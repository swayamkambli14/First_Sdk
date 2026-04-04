/**
 * Custodial Wallet Service
 *
 * Manages server-side Ethereum wallets for non-crypto users.
 * The private key is NEVER stored in plaintext — always AES-256-GCM encrypted.
 * The decrypted key is NEVER logged, returned in API responses, or stored outside
 * this function's local scope. After use it is explicitly nulled.
 *
 * Security model:
 *   - Encryption key derived from WALLET_ENCRYPTION_SECRET via scrypt
 *   - Each wallet has a unique random IV (initialization vector)
 *   - GCM auth tag ensures integrity — tampered ciphertext is rejected
 */
import { ethers } from 'ethers';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// Derive a 32-byte encryption key from the secret — done once at module load
const ENCRYPTION_KEY = crypto.scryptSync(
  env.WALLET_ENCRYPTION_SECRET,
  'chainloyalty-custodial-salt-v1',
  32
);

// ── Encryption helpers ────────────────────────────────────────────────────────

function encryptPrivateKey(privateKey: string): { encryptedKey: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(privateKey, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encryptedKey: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

function decryptPrivateKey(encryptedKey: string, iv: string, authTag: string): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    ENCRYPTION_KEY,
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedKey, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Creates a new managed wallet for a user.
 * Generates a fresh Ethereum keypair, encrypts the private key, stores in DB.
 * Returns only the address — the private key never leaves this function.
 */
export async function createManagedWallet(userId: string): Promise<{ address: string }> {
  const wallet = ethers.Wallet.createRandom();
  const address = wallet.address;
  let privateKey: string | null = wallet.privateKey;

  try {
    const { encryptedKey, iv, authTag } = encryptPrivateKey(privateKey);

    await prisma.custodialWallet.create({
      data: { userId, address, encryptedKey, iv, authTag },
    });

    logger.info('Custodial wallet created', { userId, address });
    return { address };
  } finally {
    // Best-effort memory clearing — private key must not linger
    privateKey = null;
  }
}

/**
 * Returns an ethers.Wallet signer for a custodial user.
 * The decrypted private key exists only in this function's scope.
 * NEVER log, return, or store the result of this function.
 */
export async function getSignerForUser(
  userId: string,
  provider?: ethers.JsonRpcProvider
): Promise<ethers.Wallet> {
  const record = await prisma.custodialWallet.findUnique({ where: { userId } });
  if (!record) throw new Error(`No custodial wallet found for user ${userId}`);

  let privateKey: string | null = null;
  try {
    privateKey = decryptPrivateKey(record.encryptedKey, record.iv, record.authTag);
    const wallet = provider
      ? new ethers.Wallet(privateKey, provider)
      : new ethers.Wallet(privateKey);

    // Update last used timestamp
    await prisma.custodialWallet.update({
      where: { userId },
      data: { lastUsedAt: new Date() },
    });

    return wallet;
  } finally {
    privateKey = null;
  }
}

/**
 * Exports the private key for a custodial user who wants to take self-custody.
 * This is a one-way operation — after export, walletType is set to "self_custody"
 * and ChainLoyalty will no longer sign on their behalf.
 *
 * ONLY call this after explicit user confirmation ("I understand I am responsible").
 * Returns the private key and mnemonic — shown ONCE, never stored again.
 */
export async function exportWalletForUser(userId: string): Promise<{
  privateKey: string;
  address: string;
  mnemonic: string | null;
}> {
  const record = await prisma.custodialWallet.findUnique({ where: { userId } });
  if (!record) throw new Error(`No custodial wallet found for user ${userId}`);
  if (record.walletType === 'self_custody') {
    throw new Error('Wallet already exported — user is in self-custody mode');
  }

  const privateKey = decryptPrivateKey(record.encryptedKey, record.iv, record.authTag);
  const wallet = new ethers.Wallet(privateKey);

  // Mark as self-custody — ChainLoyalty will no longer sign for this user
  await prisma.custodialWallet.update({
    where: { userId },
    data: { walletType: 'self_custody' },
  });

  logger.info('Custodial wallet exported to self-custody', { userId, address: record.address });

  return {
    privateKey,
    address: record.address,
    mnemonic: wallet.mnemonic?.phrase ?? null,
  };
}

/**
 * Returns the wallet address for a user without decrypting the key.
 */
export async function getWalletAddress(userId: string): Promise<string | null> {
  const record = await prisma.custodialWallet.findUnique({
    where: { userId },
    select: { address: true },
  });
  return record?.address ?? null;
}

/**
 * Checks if a user has a custodial wallet.
 */
export async function hasCustodialWallet(userId: string): Promise<boolean> {
  const count = await prisma.custodialWallet.count({ where: { userId } });
  return count > 0;
}
