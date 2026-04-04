import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BadgeNFT } from '../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('BadgeNFT', () => {
  let badge: BadgeNFT;
  let admin: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let nonMinter: HardhatEthersSigner;

  const BADGE_TYPE_1 = 1n;
  const BADGE_TYPE_2 = 2n;
  const TEST_URI = 'ipfs://QmTestBadgeMetadata';
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'));
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

  beforeEach(async () => {
    [admin, minter, user1, user2, nonMinter] = await ethers.getSigners();
    const BadgeNFTFactory = await ethers.getContractFactory('BadgeNFT');
    badge = await BadgeNFTFactory.deploy(admin.address);
    await badge.waitForDeployment();

    // Grant MINTER_ROLE to the minter account
    await badge.connect(admin).grantRole(MINTER_ROLE, minter.address);
  });

  describe('Minting', () => {
    it('minter can mint a badge to a user', async () => {
      await badge.connect(minter).mint(user1.address, BADGE_TYPE_1, TEST_URI);
      expect(await badge.balanceOf(user1.address, BADGE_TYPE_1)).to.equal(1n);
    });

    it('non-minter cannot mint (reverts)', async () => {
      await expect(
        badge.connect(nonMinter).mint(user1.address, BADGE_TYPE_1, TEST_URI)
      ).to.be.revertedWithCustomError(badge, 'AccessControlUnauthorizedAccount');
    });

    it('minting same badge twice to same wallet reverts', async () => {
      await badge.connect(minter).mint(user1.address, BADGE_TYPE_1, TEST_URI);
      await expect(
        badge.connect(minter).mint(user1.address, BADGE_TYPE_1, TEST_URI)
      ).to.be.revertedWith('BadgeNFT: recipient already holds this badge');
    });

    it('same user can hold different badge types', async () => {
      await badge.connect(minter).mint(user1.address, BADGE_TYPE_1, TEST_URI);
      await badge.connect(minter).mint(user1.address, BADGE_TYPE_2, 'ipfs://QmBadge2');
      expect(await badge.balanceOf(user1.address, BADGE_TYPE_1)).to.equal(1n);
      expect(await badge.balanceOf(user1.address, BADGE_TYPE_2)).to.equal(1n);
    });

    it('emits BadgeMinted event with correct parameters', async () => {
      await expect(badge.connect(minter).mint(user1.address, BADGE_TYPE_1, TEST_URI))
        .to.emit(badge, 'BadgeMinted')
        .withArgs(user1.address, BADGE_TYPE_1, TEST_URI);
    });
  });

  describe('Soulbound — Transfer Prevention', () => {
    beforeEach(async () => {
      await badge.connect(minter).mint(user1.address, BADGE_TYPE_1, TEST_URI);
    });

    it('badge cannot be transferred (safeTransferFrom reverts)', async () => {
      await expect(
        badge.connect(user1).safeTransferFrom(user1.address, user2.address, BADGE_TYPE_1, 1n, '0x')
      ).to.be.revertedWith('BadgeNFT: badges are soulbound and cannot be transferred');
    });

    it('batch transfer reverts', async () => {
      await badge.connect(minter).mint(user1.address, BADGE_TYPE_2, 'ipfs://QmBadge2');
      await expect(
        badge.connect(user1).safeBatchTransferFrom(
          user1.address,
          user2.address,
          [BADGE_TYPE_1, BADGE_TYPE_2],
          [1n, 1n],
          '0x'
        )
      ).to.be.revertedWith('BadgeNFT: badges are soulbound and cannot be transferred');
    });
  });

  describe('URI Management', () => {
    it('uri() returns correct URI after setBadgeURI()', async () => {
      await badge.connect(admin).setBadgeURI(BADGE_TYPE_1, TEST_URI);
      expect(await badge.uri(BADGE_TYPE_1)).to.equal(TEST_URI);
    });

    it('uri() reverts for badge type with no URI set', async () => {
      await expect(badge.uri(999n)).to.be.revertedWith(
        'BadgeNFT: URI not set for this badge type'
      );
    });

    it('non-admin cannot call setBadgeURI', async () => {
      await expect(
        badge.connect(nonMinter).setBadgeURI(BADGE_TYPE_1, TEST_URI)
      ).to.be.revertedWithCustomError(badge, 'AccessControlUnauthorizedAccount');
    });

    it('mint sets URI for badge type', async () => {
      await badge.connect(minter).mint(user1.address, BADGE_TYPE_1, TEST_URI);
      expect(await badge.uri(BADGE_TYPE_1)).to.equal(TEST_URI);
    });
  });

  describe('Pause / Unpause', () => {
    it('pausing prevents minting', async () => {
      await badge.connect(admin).pause();
      await expect(
        badge.connect(minter).mint(user1.address, BADGE_TYPE_1, TEST_URI)
      ).to.be.revertedWithCustomError(badge, 'EnforcedPause');
    });

    it('unpausing allows minting again', async () => {
      await badge.connect(admin).pause();
      await badge.connect(admin).unpause();
      await badge.connect(minter).mint(user1.address, BADGE_TYPE_1, TEST_URI);
      expect(await badge.balanceOf(user1.address, BADGE_TYPE_1)).to.equal(1n);
    });

    it('non-admin cannot pause', async () => {
      await expect(
        badge.connect(nonMinter).pause()
      ).to.be.revertedWithCustomError(badge, 'AccessControlUnauthorizedAccount');
    });
  });

  describe('Access Control', () => {
    it('admin can grant MINTER_ROLE to a new address', async () => {
      await badge.connect(admin).grantRole(MINTER_ROLE, user2.address);
      await badge.connect(user2).mint(user1.address, BADGE_TYPE_1, TEST_URI);
      expect(await badge.balanceOf(user1.address, BADGE_TYPE_1)).to.equal(1n);
    });

    it('cannot renounce DEFAULT_ADMIN_ROLE', async () => {
      await expect(
        badge.connect(admin).renounceRole(DEFAULT_ADMIN_ROLE, admin.address)
      ).to.be.revertedWith('BadgeNFT: cannot renounce DEFAULT_ADMIN_ROLE');
    });

    it('can renounce MINTER_ROLE', async () => {
      await badge.connect(minter).renounceRole(MINTER_ROLE, minter.address);
      await expect(
        badge.connect(minter).mint(user1.address, BADGE_TYPE_1, TEST_URI)
      ).to.be.revertedWithCustomError(badge, 'AccessControlUnauthorizedAccount');
    });
  });
});
