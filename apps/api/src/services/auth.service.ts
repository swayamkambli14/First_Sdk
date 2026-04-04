import crypto from 'crypto';
import { ethers } from 'ethers';
import { env } from '../config/env.js';
import { setex, get, del } from '../infrastructure/redis.js';
import { upsertUser, findUserByWallet } from '../repositories/user.repo.js';
import { AuthenticationError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;
const NONCE_TTL_SECONDS = 300; // 5 minutes

function nonceKey(walletAddress: string): string {
  return `nonce:${walletAddress.toLowerCase()}`;
}

/**
 * Generates a one-time nonce for SIWE authentication.
 * Stored in Redis with 5-minute TTL — expires automatically.
 */
export async function generateNonce(
  walletAddress: string
): Promise<{ nonce: string; message: string }> {
  if (!WALLET_REGEX.test(walletAddress)) {
    throw new ValidationError(
      'Invalid Ethereum wallet address format',
      'INVALID_WALLET_ADDRESS'
    );
  }

  const nonce = crypto.randomUUID();
  const message = buildSiweMessage(walletAddress, nonce);

  await setex(nonceKey(walletAddress), NONCE_TTL_SECONDS, nonce);
  logger.debug('Nonce generated', { wallet: walletAddress });

  return { nonce, message };
}

/**
 * Verifies a SIWE signature and returns a signed JWT on success.
 * The nonce is deleted immediately after use — single-use, prevents replay attacks.
 */
export async function verifySignature(
  walletAddress: string,
  signature: string,
  appId: string
): Promise<{ walletAddress: string; tier: string; points: string }> {
  const normalized = walletAddress.toLowerCase();

  // Fetch nonce — if missing, it either expired or was already used
  const storedNonce = await get(nonceKey(normalized));
  if (!storedNonce) {
    throw new AuthenticationError(
      'Nonce expired or already used — request a new nonce',
      'NONCE_EXPIRED'
    );
  }

  const message = buildSiweMessage(walletAddress, storedNonce);

  // Verify the cryptographic signature
  let recoveredAddress: string;
  try {
    recoveredAddress = ethers.verifyMessage(message, signature);
  } catch {
    throw new AuthenticationError('Invalid signature format', 'INVALID_SIGNATURE');
  }

  if (recoveredAddress.toLowerCase() !== normalized) {
    throw new AuthenticationError(
      'Signature does not match wallet address',
      'SIGNATURE_MISMATCH'
    );
  }

  // Delete nonce immediately — one-time use
  await del(nonceKey(normalized));

  // Upsert user record (creates on first login)
  const user = await upsertUser(normalized, appId);

  logger.info('Wallet authenticated', { wallet: normalized });

  return {
    walletAddress: normalized,
    tier: user.currentTier,
    points: user.currentPointsBalance.toString(),
  };
}

/**
 * Builds the exact SIWE message string the user must sign.
 * Must be identical on both nonce generation and verification.
 */
function buildSiweMessage(walletAddress: string, nonce: string): string {
  return `Sign this message to log in to ChainLoyalty: ${nonce}`;
}

/**
 * Returns the current user profile for the /me endpoint.
 */
export async function getProfile(walletAddress: string) {
  const user = await findUserByWallet(walletAddress);
  if (!user) {
    throw new AuthenticationError('User not found', 'USER_NOT_FOUND');
  }
  return {
    walletAddress: user.walletAddress,
    tier: user.currentTier,
    points: user.currentPointsBalance.toString(),
    totalPointsEarned: user.totalPointsEarned.toString(),
    referralCode: user.referralCode,
    firstSeenAt: user.firstSeenAt,
    lastActiveAt: user.lastActiveAt,
  };
}
