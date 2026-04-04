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
  const referralCode = generateReferralCode(normalized);

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
