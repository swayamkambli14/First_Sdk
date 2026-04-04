import { expect } from 'chai';
import { ethers } from 'hardhat';
import { CLoyaltyToken, BurnTracker } from '../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('CLoyaltyToken', () => {
  let clp: CLoyaltyToken;
  let tracker: BurnTracker;
  let admin: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let fraudController: HardhatEthersSigner;
  let keeper: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let attacker: HardhatEthersSigner;

  const MINTER_ROLE           = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'));
  const FRAUD_CONTROLLER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('FRAUD_CONTROLLER_ROLE'));
  const KEEPER_ROLE           = ethers.keccak256(ethers.toUtf8Bytes('KEEPER_ROLE'));
  const RECORDER_ROLE         = ethers.keccak256(ethers.toUtf8Bytes('RECORDER_ROLE'));

  const MAX_SUPPLY = ethers.parseEther('1000000');
  const APP_ID     = ethers.keccak256(ethers.toUtf8Bytes('test-app'));

  beforeEach(async () => {
    [admin, minter, fraudController, keeper, user1, user2, attacker] = await ethers.getSigners();

    const TrackerFactory = await ethers.getContractFactory('BurnTracker');
    tracker = await TrackerFactory.deploy(admin.address);

    const CLPFactory = await ethers.getContractFactory('CLoyaltyToken');
    clp = await CLPFactory.deploy(admin.address, await tracker.getAddress(), MAX_SUPPLY);

    // Grant roles
    await clp.connect(admin).grantRole(MINTER_ROLE, minter.address);
    await clp.connect(admin).grantRole(FRAUD_CONTROLLER_ROLE, fraudController.address);
    await clp.connect(admin).grantRole(KEEPER_ROLE, keeper.address);
    await tracker.connect(admin).grantRole(RECORDER_ROLE, await clp.getAddress());
  });

  describe('Minting', () => {
    it('mint increases totalSupply and recipient balance', async () => {
      const amount = ethers.parseEther('1000');
      await clp.connect(minter).mint(user1.address, amount, APP_ID, 'test');
      expect(await clp.balanceOf(user1.address)).to.equal(amount);
      expect(await clp.totalSupply()).to.equal(amount);
      expect(await clp.totalMinted()).to.equal(amount);
    });

    it('non-minter cannot mint', async () => {
      await expect(
        clp.connect(attacker).mint(user1.address, 100n, APP_ID, 'hack')
      ).to.be.revertedWithCustomError(clp, 'AccessControlUnauthorizedAccount');
    });

    it('mint reverts when supply cap exceeded', async () => {
      await expect(
        clp.connect(minter).mint(user1.address, MAX_SUPPLY + 1n, APP_ID, 'over')
      ).to.be.revertedWith('CLP: supply cap exceeded');
    });

    it('mint reverts on zero address', async () => {
      await expect(
        clp.connect(minter).mint(ethers.ZeroAddress, 100n, APP_ID, 'zero')
      ).to.be.revertedWith('CLP: mint to zero address');
    });

    it('emits TokensMinted event', async () => {
      const amount = ethers.parseEther('500');
      await expect(clp.connect(minter).mint(user1.address, amount, APP_ID, 'reward'))
        .to.emit(clp, 'TokensMinted')
        .withArgs(user1.address, amount, APP_ID, 'reward');
    });
  });

  describe('Transfer burn tax', () => {
    beforeEach(async () => {
      await clp.connect(minter).mint(user1.address, ethers.parseEther('1000'), APP_ID, 'setup');
    });

    it('transfer burns exactly 1% and sends 99% to recipient', async () => {
      const amount     = ethers.parseEther('100');
      const burnAmt    = amount / 100n;       // 1%
      const receiveAmt = amount - burnAmt;    // 99%

      const supplyBefore = await clp.totalSupply();
      await clp.connect(user1).transfer(user2.address, amount);

      expect(await clp.balanceOf(user2.address)).to.equal(receiveAmt);
      expect(await clp.totalSupply()).to.equal(supplyBefore - burnAmt);
    });

    it('totalBurned accumulates correctly across 10 transfers', async () => {
      const amount  = ethers.parseEther('100');
      const burnPer = amount / 100n;
      for (let i = 0; i < 10; i++) {
        await clp.connect(user1).transfer(user2.address, amount);
        // user2 sends back so user1 has enough for next iteration
        if (i < 9) await clp.connect(user2).transfer(user1.address, amount - burnPer);
      }
      const burned = await clp.totalBurned();
      expect(burned).to.be.gt(0n);
    });

    it('emits TokensBurned on transfer', async () => {
      await expect(clp.connect(user1).transfer(user2.address, ethers.parseEther('100')))
        .to.emit(clp, 'TokensBurned');
    });
  });

  describe('Redemption burn', () => {
    beforeEach(async () => {
      await clp.connect(minter).mint(user1.address, ethers.parseEther('1000'), APP_ID, 'setup');
    });

    it('redeemForReward burns 100% of specified amount', async () => {
      const amount      = ethers.parseEther('200');
      const balBefore   = await clp.balanceOf(user1.address);
      const supplyBefore = await clp.totalSupply();

      await clp.connect(user1).redeemForReward(amount, 'reward_xyz');

      expect(await clp.balanceOf(user1.address)).to.equal(balBefore - amount);
      expect(await clp.totalSupply()).to.equal(supplyBefore - amount);
      expect(await clp.totalRedeemed()).to.equal(amount);
    });

    it('emits TokensRedeemed event', async () => {
      await expect(clp.connect(user1).redeemForReward(ethers.parseEther('100'), 'r1'))
        .to.emit(clp, 'TokensRedeemed')
        .withArgs(user1.address, ethers.parseEther('100'), 'r1');
    });
  });

  describe('Fraud penalty burn', () => {
    beforeEach(async () => {
      await clp.connect(minter).mint(user1.address, ethers.parseEther('1000'), APP_ID, 'setup');
    });

    it('penaltyBurn only callable by FraudController', async () => {
      await expect(
        clp.connect(attacker).penaltyBurn(user1.address, 100n, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(clp, 'AccessControlUnauthorizedAccount');
    });

    it('FraudController can burn tokens from flagged wallet', async () => {
      const amount    = ethers.parseEther('100');
      const balBefore = await clp.balanceOf(user1.address);
      await clp.connect(fraudController).penaltyBurn(user1.address, amount, ethers.ZeroHash);
      expect(await clp.balanceOf(user1.address)).to.equal(balBefore - amount);
    });

    it('emits PenaltyBurned event', async () => {
      await expect(
        clp.connect(fraudController).penaltyBurn(user1.address, ethers.parseEther('50'), ethers.ZeroHash)
      ).to.emit(clp, 'PenaltyBurned');
    });
  });

  describe('Tier decay burn', () => {
    beforeEach(async () => {
      await clp.connect(minter).mint(user1.address, ethers.parseEther('1000'), APP_ID, 'setup');
    });

    it('tierDecayBurn only callable by KEEPER_ROLE', async () => {
      await expect(
        clp.connect(attacker).tierDecayBurn(user1.address)
      ).to.be.revertedWithCustomError(clp, 'AccessControlUnauthorizedAccount');
    });

    it('tierDecayBurn reverts if wallet not inactive long enough', async () => {
      await expect(
        clp.connect(keeper).tierDecayBurn(user1.address)
      ).to.be.revertedWith('CLP: wallet not inactive long enough');
    });

    it('tierDecayBurn burns 5% after inactivity period', async () => {
      // Fast-forward 91 days
      await ethers.provider.send('evm_increaseTime', [91 * 24 * 60 * 60]);
      await ethers.provider.send('evm_mine', []);

      const bal    = await clp.balanceOf(user1.address);
      const decay  = (bal * 500n) / 10_000n;
      await clp.connect(keeper).tierDecayBurn(user1.address);
      expect(await clp.balanceOf(user1.address)).to.equal(bal - decay);
    });
  });

  describe('Burn rate governance', () => {
    it('burn rate cannot be set below 0.5%', async () => {
      await expect(clp.connect(admin).setBurnRate(49n))
        .to.be.revertedWith('CLP: rate out of bounds');
    });

    it('burn rate cannot be set above 3%', async () => {
      await expect(clp.connect(admin).setBurnRate(301n))
        .to.be.revertedWith('CLP: rate out of bounds');
    });

    it('admin can set burn rate within bounds', async () => {
      await clp.connect(admin).setBurnRate(200n); // 2%
      expect(await clp.burnRateBps()).to.equal(200n);
    });

    it('emits BurnRateUpdated event', async () => {
      await expect(clp.connect(admin).setBurnRate(150n))
        .to.emit(clp, 'BurnRateUpdated')
        .withArgs(100n, 150n, admin.address);
    });
  });
});
