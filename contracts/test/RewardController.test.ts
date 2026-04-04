import { expect } from 'chai';
import { ethers } from 'hardhat';
import { RewardController, CLoyaltyToken, BadgeNFT, BurnTracker, ReferralRegistry } from '../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('RewardController', () => {
  let rc: RewardController;
  let clp: CLoyaltyToken;
  let badge: BadgeNFT;
  let tracker: BurnTracker;
  let registry: ReferralRegistry;
  let admin: HardhatEthersSigner;
  let backend: HardhatEthersSigner;
  let governance: HardhatEthersSigner;
  let fraudController: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let attacker: HardhatEthersSigner;

  const MINTER_ROLE           = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'));
  const BACKEND_ROLE          = ethers.keccak256(ethers.toUtf8Bytes('BACKEND_ROLE'));
  const FRAUD_CONTROLLER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('FRAUD_CONTROLLER_ROLE'));
  const GOVERNANCE_ROLE       = ethers.keccak256(ethers.toUtf8Bytes('GOVERNANCE_ROLE'));
  const RECORDER_ROLE         = ethers.keccak256(ethers.toUtf8Bytes('RECORDER_ROLE'));
  const RR_BACKEND_ROLE       = ethers.keccak256(ethers.toUtf8Bytes('BACKEND_ROLE'));
  const APP_ID                = ethers.keccak256(ethers.toUtf8Bytes('test-app'));
  const TEST_URI              = 'ipfs://QmTest';
  const META_HASH             = ethers.keccak256(ethers.toUtf8Bytes('meta'));

  beforeEach(async () => {
    [admin, backend, governance, fraudController, user1, user2, attacker] = await ethers.getSigners();

    const TrackerF  = await ethers.getContractFactory('BurnTracker');
    tracker = await TrackerF.deploy(admin.address);

    const CLPF = await ethers.getContractFactory('CLoyaltyToken');
    clp = await CLPF.deploy(admin.address, await tracker.getAddress(), ethers.parseEther('10000000'));

    const BadgeF = await ethers.getContractFactory('BadgeNFT');
    badge = await BadgeF.deploy(admin.address, await clp.getAddress(), await tracker.getAddress());

    const RegistryF = await ethers.getContractFactory('ReferralRegistry');
    registry = await RegistryF.deploy(admin.address);

    const RCF = await ethers.getContractFactory('RewardController');
    rc = await RCF.deploy(
      admin.address,
      await clp.getAddress(),
      await badge.getAddress(),
      await registry.getAddress()
    );

    // Wire up roles
    await clp.connect(admin).grantRole(MINTER_ROLE, await rc.getAddress());
    await clp.connect(admin).grantRole(FRAUD_CONTROLLER_ROLE, await rc.getAddress());
    await badge.connect(admin).grantRole(MINTER_ROLE, await rc.getAddress());
    await tracker.connect(admin).grantRole(RECORDER_ROLE, await clp.getAddress());
    await tracker.connect(admin).grantRole(RECORDER_ROLE, await badge.getAddress());
    await registry.connect(admin).grantRole(RR_BACKEND_ROLE, await rc.getAddress());

    await rc.connect(admin).grantRole(BACKEND_ROLE, backend.address);
    await rc.connect(admin).grantRole(FRAUD_CONTROLLER_ROLE, fraudController.address);
    await rc.connect(admin).grantRole(GOVERNANCE_ROLE, governance.address);

    // Register a COMMON badge type
    await badge.connect(admin).registerBadgeType(1n, 0, 0, 0, 0, META_HASH, TEST_URI);
  });

  describe('issuePoints', () => {
    it('backend can issue points below threshold', async () => {
      await rc.connect(backend).issuePoints(user1.address, ethers.parseEther('100'), APP_ID, 'reward');
      expect(await clp.balanceOf(user1.address)).to.equal(ethers.parseEther('100'));
    });

    it('large mint requires GOVERNANCE_ROLE', async () => {
      const large = ethers.parseEther('20000');
      await expect(
        rc.connect(backend).issuePoints(user1.address, large, APP_ID, 'big')
      ).to.be.revertedWithCustomError(rc, 'AccessControlUnauthorizedAccount');

      await rc.connect(governance).issuePoints(user1.address, large, APP_ID, 'big');
      expect(await clp.balanceOf(user1.address)).to.equal(large);
    });

    it('attacker cannot issue points', async () => {
      await expect(
        rc.connect(attacker).issuePoints(user1.address, 100n, APP_ID, 'hack')
      ).to.be.revertedWithCustomError(rc, 'AccessControlUnauthorizedAccount');
    });
  });

  describe('batchIssuePoints', () => {
    it('batch issues to 50 wallets within gas limits', async () => {
      const wallets = Array.from({ length: 50 }, (_, i) =>
        ethers.Wallet.createRandom().address
      );
      const amounts = Array(50).fill(ethers.parseEther('10'));
      const tx = await rc.connect(backend).batchIssuePoints(wallets, amounts, APP_ID);
      const receipt = await tx.wait();
      expect(receipt!.gasUsed).to.be.lt(15_000_000n); // well under 30M block limit
    });

    it('batch reverts if length mismatch', async () => {
      await expect(
        rc.connect(backend).batchIssuePoints([user1.address], [100n, 200n], APP_ID)
      ).to.be.revertedWith('RC: length mismatch');
    });

    it('batch reverts if over 200 wallets', async () => {
      const wallets = Array(201).fill(user1.address);
      const amounts = Array(201).fill(100n);
      await expect(
        rc.connect(backend).batchIssuePoints(wallets, amounts, APP_ID)
      ).to.be.revertedWith('RC: batch too large');
    });
  });

  describe('issueReferralReward — atomicity', () => {
    it('issues to both referrer and referee', async () => {
      await rc.connect(backend).issueReferralReward(
        user1.address, user2.address,
        ethers.parseEther('100'), ethers.parseEther('50'),
        APP_ID
      );
      expect(await clp.balanceOf(user1.address)).to.equal(ethers.parseEther('100'));
      expect(await clp.balanceOf(user2.address)).to.equal(ethers.parseEther('50'));
    });

    it('emits ReferralRewardIssued', async () => {
      await expect(
        rc.connect(backend).issueReferralReward(user1.address, user2.address, 100n, 50n, APP_ID)
      ).to.emit(rc, 'ReferralRewardIssued');
    });
  });

  describe('executeFraudPenalty', () => {
    beforeEach(async () => {
      await rc.connect(backend).issuePoints(user1.address, ethers.parseEther('500'), APP_ID, 'setup');
    });

    it('FraudController can execute penalty burn', async () => {
      const amount    = ethers.parseEther('100');
      const balBefore = await clp.balanceOf(user1.address);
      await rc.connect(fraudController).executeFraudPenalty(user1.address, amount, ethers.ZeroHash);
      expect(await clp.balanceOf(user1.address)).to.equal(balBefore - amount);
    });

    it('non-FraudController cannot execute penalty', async () => {
      await expect(
        rc.connect(attacker).executeFraudPenalty(user1.address, 100n, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(rc, 'AccessControlUnauthorizedAccount');
    });
  });
});
