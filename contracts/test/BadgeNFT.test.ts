import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BadgeNFT, CLoyaltyToken, BurnTracker } from '../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('BadgeNFT', () => {
  let badge: BadgeNFT;
  let clp: CLoyaltyToken;
  let tracker: BurnTracker;
  let admin: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let attacker: HardhatEthersSigner;

  const MINTER_ROLE           = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'));
  const FRAUD_CONTROLLER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('FRAUD_CONTROLLER_ROLE'));
  const RECORDER_ROLE         = ethers.keccak256(ethers.toUtf8Bytes('RECORDER_ROLE'));
  const APP_ID                = ethers.keccak256(ethers.toUtf8Bytes('test-app'));
  const TEST_URI              = 'ipfs://QmTest';
  const META_HASH             = ethers.keccak256(ethers.toUtf8Bytes('metadata'));

  const COMMON    = 0;
  const RARE      = 1;
  const EPIC      = 2;
  const LEGENDARY = 3;

  beforeEach(async () => {
    [admin, minter, user1, user2, attacker] = await ethers.getSigners();

    const TrackerFactory = await ethers.getContractFactory('BurnTracker');
    tracker = await TrackerFactory.deploy(admin.address);

    const CLPFactory = await ethers.getContractFactory('CLoyaltyToken');
    clp = await CLPFactory.deploy(admin.address, await tracker.getAddress(), ethers.parseEther('1000000'));

    const BadgeFactory = await ethers.getContractFactory('BadgeNFT');
    badge = await BadgeFactory.deploy(admin.address, await clp.getAddress(), await tracker.getAddress());

    // Roles
    await clp.connect(admin).grantRole(MINTER_ROLE, minter.address);
    await clp.connect(admin).grantRole(FRAUD_CONTROLLER_ROLE, await badge.getAddress());
    await tracker.connect(admin).grantRole(RECORDER_ROLE, await clp.getAddress());
    await tracker.connect(admin).grantRole(RECORDER_ROLE, await badge.getAddress());
    await badge.connect(admin).grantRole(MINTER_ROLE, minter.address);

    // Register badge types
    await badge.connect(admin).registerBadgeType(1n, COMMON,    0, 0, 0, META_HASH, TEST_URI);
    await badge.connect(admin).registerBadgeType(2n, RARE,      0, 0, 0, META_HASH, TEST_URI);
    await badge.connect(admin).registerBadgeType(3n, EPIC,      0, ethers.parseEther('100'), 0, META_HASH, TEST_URI);
    await badge.connect(admin).registerBadgeType(4n, LEGENDARY, 0, ethers.parseEther('500'), ethers.parseEther('1000'), META_HASH, TEST_URI);
    await badge.connect(admin).registerBadgeType(5n, RARE,      0, 0, 0, META_HASH, TEST_URI);
    await badge.connect(admin).registerBadgeType(6n, RARE,      0, 0, 0, META_HASH, TEST_URI);
    await badge.connect(admin).registerBadgeType(7n, EPIC,      0, 0, 0, META_HASH, TEST_URI); // evolution target
  });

  describe('Minting', () => {
    it('minter can mint a COMMON badge', async () => {
      await badge.connect(minter).mint(user1.address, 1n, TEST_URI);
      expect(await badge.balanceOf(user1.address, 1n)).to.equal(1n);
    });

    it('non-minter cannot mint', async () => {
      await expect(
        badge.connect(attacker).mint(user1.address, 1n, TEST_URI)
      ).to.be.revertedWithCustomError(badge, 'AccessControlUnauthorizedAccount');
    });

    it('minting same badge twice reverts', async () => {
      await badge.connect(minter).mint(user1.address, 1n, TEST_URI);
      await expect(
        badge.connect(minter).mint(user1.address, 1n, TEST_URI)
      ).to.be.revertedWith('BadgeNFT: already holds badge');
    });

    it('mint to zero address reverts', async () => {
      await expect(
        badge.connect(minter).mint(ethers.ZeroAddress, 1n, TEST_URI)
      ).to.be.revertedWith('BadgeNFT: mint to zero');
    });

    it('emits BadgeMinted with rarity', async () => {
      await expect(badge.connect(minter).mint(user1.address, 1n, TEST_URI))
        .to.emit(badge, 'BadgeMinted')
        .withArgs(user1.address, 1n, COMMON, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));
    });
  });

  describe('LEGENDARY badge — CLP balance requirement', () => {
    it('LEGENDARY mint fails if CLP balance below minimum', async () => {
      // user1 has 0 CLP
      await expect(
        badge.connect(minter).mint(user1.address, 4n, TEST_URI)
      ).to.be.revertedWith('BadgeNFT: insufficient CLP for LEGENDARY');
    });

    it('LEGENDARY mint succeeds with sufficient CLP', async () => {
      await clp.connect(minter).mint(user1.address, ethers.parseEther('2000'), APP_ID, 'setup');
      await badge.connect(minter).mint(user1.address, 4n, TEST_URI);
      expect(await badge.balanceOf(user1.address, 4n)).to.equal(1n);
    });
  });

  describe('EPIC badge — CLP burn on mint', () => {
    it('EPIC mint burns CLP from recipient', async () => {
      await clp.connect(minter).mint(user1.address, ethers.parseEther('500'), APP_ID, 'setup');
      const balBefore = await clp.balanceOf(user1.address);
      await badge.connect(minter).mint(user1.address, 3n, TEST_URI);
      expect(await clp.balanceOf(user1.address)).to.equal(balBefore - ethers.parseEther('100'));
    });

    it('EPIC mint emits BadgeMintedWithPayment', async () => {
      await clp.connect(minter).mint(user1.address, ethers.parseEther('500'), APP_ID, 'setup');
      await expect(badge.connect(minter).mint(user1.address, 3n, TEST_URI))
        .to.emit(badge, 'BadgeMintedWithPayment')
        .withArgs(user1.address, 3n, ethers.parseEther('100'));
    });
  });

  describe('Soulbound — correct _update override', () => {
    beforeEach(async () => {
      await badge.connect(minter).mint(user1.address, 1n, TEST_URI);
    });

    it('transfer reverts with soulbound error', async () => {
      await expect(
        badge.connect(user1).safeTransferFrom(user1.address, user2.address, 1n, 1n, '0x')
      ).to.be.revertedWith('BadgeNFT: soulbound');
    });

    it('batch transfer reverts', async () => {
      await badge.connect(minter).mint(user1.address, 2n, TEST_URI);
      await expect(
        badge.connect(user1).safeBatchTransferFrom(user1.address, user2.address, [1n, 2n], [1n, 1n], '0x')
      ).to.be.revertedWith('BadgeNFT: soulbound');
    });
  });

  describe('Badge expiry', () => {
    it('isValidBadge returns false after expiry', async () => {
      const now    = (await ethers.provider.getBlock('latest'))!.timestamp;
      const expiry = now + 60; // 60s from current block time
      await badge.connect(admin).registerBadgeType(99n, COMMON, expiry, 0, 0, META_HASH, TEST_URI);
      await badge.connect(minter).mint(user1.address, 99n, TEST_URI);

      expect(await badge.isValidBadge(user1.address, 99n)).to.equal(true);

      // Fast-forward past expiry
      await ethers.provider.send('evm_increaseTime', [120]);
      await ethers.provider.send('evm_mine', []);

      expect(await badge.isValidBadge(user1.address, 99n)).to.equal(false);
    });

    it('isValidBadge returns false if badge not held', async () => {
      expect(await badge.isValidBadge(user1.address, 1n)).to.equal(false);
    });
  });

  describe('Badge evolution', () => {
    it('burn 3 RARE badges to receive 1 EPIC', async () => {
      // Mint 3 RARE badges to user1
      await badge.connect(minter).mint(user1.address, 2n, TEST_URI);
      await badge.connect(minter).mint(user1.address, 5n, TEST_URI);
      await badge.connect(minter).mint(user1.address, 6n, TEST_URI);

      await badge.connect(user1).evolveBadge([2n, 5n, 6n], 7n);

      // Source badges burned
      expect(await badge.balanceOf(user1.address, 2n)).to.equal(0n);
      expect(await badge.balanceOf(user1.address, 5n)).to.equal(0n);
      expect(await badge.balanceOf(user1.address, 6n)).to.equal(0n);
      // Target badge received
      expect(await badge.balanceOf(user1.address, 7n)).to.equal(1n);
    });

    it('evolution reverts if not exactly 3 badges', async () => {
      await expect(
        badge.connect(user1).evolveBadge([2n, 5n], 7n)
      ).to.be.revertedWith('BadgeNFT: must burn exactly 3 badges');
    });

    it('evolution reverts if target is not one tier higher', async () => {
      await expect(
        badge.connect(user1).evolveBadge([2n, 5n, 6n], 4n) // LEGENDARY, not EPIC
      ).to.be.revertedWith('BadgeNFT: target must be one tier higher');
    });

    it('emits BadgeEvolved event', async () => {
      await badge.connect(minter).mint(user1.address, 2n, TEST_URI);
      await badge.connect(minter).mint(user1.address, 5n, TEST_URI);
      await badge.connect(minter).mint(user1.address, 6n, TEST_URI);
      await expect(badge.connect(user1).evolveBadge([2n, 5n, 6n], 7n))
        .to.emit(badge, 'BadgeEvolved')
        .withArgs(user1.address, [2n, 5n, 6n], 7n);
    });
  });
});
