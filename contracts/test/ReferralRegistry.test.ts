import { expect } from 'chai';
import { ethers } from 'hardhat';
import { ReferralRegistry } from '../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('ReferralRegistry', () => {
  let registry: ReferralRegistry;
  let admin: HardhatEthersSigner;
  let backend: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;
  let attacker: HardhatEthersSigner;

  const BACKEND_ROLE = ethers.keccak256(ethers.toUtf8Bytes('BACKEND_ROLE'));
  const code1 = ethers.keccak256(ethers.toUtf8Bytes('REF-USER1'));
  const code2 = ethers.keccak256(ethers.toUtf8Bytes('REF-USER2'));

  beforeEach(async () => {
    [admin, backend, user1, user2, user3, attacker] = await ethers.getSigners();
    const F = await ethers.getContractFactory('ReferralRegistry');
    registry = await F.deploy(admin.address);
    await registry.connect(admin).grantRole(BACKEND_ROLE, backend.address);

    // Register codes
    await registry.connect(backend).registerCode(user1.address, code1);
    await registry.connect(backend).registerCode(user2.address, code2);
  });

  describe('registerReferral', () => {
    it('registers a valid referral', async () => {
      await registry.connect(backend).registerReferral(user2.address, code1);
      expect(await registry.referredBy(user2.address)).to.equal(user1.address);
      expect(await registry.hasBeenReferred(user2.address)).to.equal(true);
    });

    it('self-referral is blocked (emits FraudulentReferralBlocked)', async () => {
      await expect(
        registry.connect(backend).registerReferral(user1.address, code1)
      ).to.emit(registry, 'FraudulentReferralBlocked');
    });

    it('second referral to already-referred wallet reverts', async () => {
      await registry.connect(backend).registerReferral(user2.address, code1);
      await expect(
        registry.connect(backend).registerReferral(user2.address, code1)
      ).to.be.revertedWith('RR: already referred');
    });

    it('circular referral is blocked', async () => {
      // user1 referred by user2
      await registry.connect(backend).registerReferral(user1.address, code2);
      // user2 tries to be referred by user1 — circular
      await expect(
        registry.connect(backend).registerReferral(user2.address, code1)
      ).to.emit(registry, 'FraudulentReferralBlocked');
    });

    it('non-backend cannot register referral', async () => {
      await expect(
        registry.connect(attacker).registerReferral(user2.address, code1)
      ).to.be.revertedWithCustomError(registry, 'AccessControlUnauthorizedAccount');
    });
  });

  describe('getReferralChain', () => {
    it('returns correct full ancestry', async () => {
      // user3 referred by user2, user2 referred by user1
      await registry.connect(backend).registerReferral(user2.address, code1);
      await registry.connect(backend).registerCode(user3.address, ethers.keccak256(ethers.toUtf8Bytes('REF-USER3')));
      await registry.connect(backend).registerReferral(user3.address, code2);

      const chain = await registry.getReferralChain(user3.address);
      expect(chain[0]).to.equal(user2.address);
      expect(chain[1]).to.equal(user1.address);
    });
  });

  describe('getReferralCount', () => {
    it('returns correct count', async () => {
      await registry.connect(backend).registerReferral(user2.address, code1);
      await registry.connect(backend).registerReferral(user3.address, code1);
      expect(await registry.getReferralCount(user1.address)).to.equal(2n);
    });
  });
});
