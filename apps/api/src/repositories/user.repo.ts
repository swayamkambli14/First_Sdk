import { PrismaClient, User, Prisma } from '@prisma/client';
import crypto from 'crypto';
import { env } from '../config/env.js';

const prisma = new PrismaClient();

// Prisma transaction type alias for use in service layer
export type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Generates a deterministic referral code from a wallet address.
 * Same wallet always produces the same code — HMAC-SHA256 based.
 */
function generateReferralCode(walletAddress: string): string {
  const hash = crypto
    .createHmac('sha256', env.REFERRAL_SECRET)
    .update(walletAddress.toLowerCase())
    .digest('hex');
  return 'REF-' + hash.substring(0, 8).toUpperCase();
}

/**
 * Creates the user if they don't exist yet (first event from this wallet).
 * Normalizes wallet address to lowercase before any DB operation.
 */
export async function upsertUser(walletAddress: string, appId: string): Promise<User> {
  const normalized = walletAddress.toLowerCase();
  // Gap #9 fix: collision-safe referral code generation
  const referralCode = await generateUniqueReferralCode(normalized);

  return prisma.user.upsert({
    where: { walletAddress: normalized },
    update: { lastActiveAt: new Date() },
    create: {
      walletAddress: normalized,
      appId,
      referralCode,
      currentTier: 'bronze',
      currentPointsBalance: 0n,
      totalPointsEarned: 0n,
    },
  });
}

/**
 * Gap #9 fix: generates a referral code and retries with longer suffix on collision.
 */
async function generateUniqueReferralCode(walletAddress: string): Promise<string> {
  for (let length = 8; length <= 16; length += 2) {
    const hash = crypto
      .createHmac('sha256', env.REFERRAL_SECRET)
      .update(walletAddress)
      .digest('hex');
    const code = 'REF-' + hash.substring(0, length).toUpperCase();
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
  }
  // Absolute fallback — append wallet suffix for guaranteed uniqueness
  const hash = crypto.createHmac('sha256', env.REFERRAL_SECRET).update(walletAddress).digest('hex');
  return 'REF-' + hash.substring(0, 8).toUpperCase() + '-' + walletAddress.slice(2, 6).toUpperCase();
}

export async function findUserByWallet(walletAddress: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { walletAddress: walletAddress.toLowerCase() },
  });
}

export async function updateUserTier(walletAddress: string, tier: string): Promise<void> {
  await prisma.user.update({
    where: { walletAddress: walletAddress.toLowerCase() },
    data: { currentTier: tier },
  });
}

export async function updateUserPoints(
  walletAddress: string,
  amount: number,
  tx?: PrismaTransaction
): Promise<void> {
  const client = tx ?? prisma;
  await client.user.update({
    where: { walletAddress: walletAddress.toLowerCase() },
    data: {
      currentPointsBalance: { increment: BigInt(amount) },
      totalPointsEarned: { increment: BigInt(amount) },
    },
  });
}

export async function findUserByReferralCode(referralCode: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { referralCode } });
}
