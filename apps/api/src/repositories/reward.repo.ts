import { PrismaClient, Reward } from '@prisma/client';
import { PrismaTransaction } from './user.repo.js';

const prisma = new PrismaClient();

export async function createPointsReward(
  data: {
    walletAddress: string;
    amount: number;
    ruleId: string;
    eventId?: string;
    reason?: string;
  },
  tx?: PrismaTransaction
): Promise<Reward> {
  const client = tx ?? prisma;
  return client.reward.create({
    data: {
      walletAddress: data.walletAddress,
      rewardType: 'points',
      rewardValue: { amount: data.amount },
      ruleId: data.ruleId,
      eventId: data.eventId,
      reason: data.reason,
    },
  });
}

export async function createBadgeReward(
  data: {
    walletAddress: string;
    badgeId: string;
    ruleId: string;
    eventId?: string;
    reason?: string;
    rewardValue?: Record<string, unknown>;
  },
  tx?: PrismaTransaction
): Promise<Reward> {
  const client = tx ?? prisma;
  return client.reward.create({
    data: {
      walletAddress: data.walletAddress,
      rewardType: 'badge',
      rewardValue: data.rewardValue ?? { badge_id: data.badgeId },
      ruleId: data.ruleId,
      eventId: data.eventId,
      reason: data.reason,
    },
  });
}

/**
 * Checks if a wallet already has a specific badge — used for idempotency.
 * A wallet can only earn each badge once.
 */
export async function findBadgeByWallet(
  walletAddress: string,
  badgeId: string
): Promise<Reward | null> {
  const rewards = await prisma.reward.findMany({
    where: {
      walletAddress: walletAddress.toLowerCase(),
      rewardType: 'badge',
    },
  });

  return (
    rewards.find((r) => {
      const val = r.rewardValue as Record<string, unknown>;
      return val['badge_id'] === badgeId;
    }) ?? null
  );
}

export async function createRuleTrigger(
  walletAddress: string,
  ruleId: string,
  rewardId: string,
  tx?: PrismaTransaction
): Promise<void> {
  const client = tx ?? prisma;
  await client.ruleTrigger.create({
    data: { walletAddress, ruleId, rewardId },
  });
}

export async function countTriggers(walletAddress: string, ruleId: string): Promise<number> {
  return prisma.ruleTrigger.count({
    where: { walletAddress: walletAddress.toLowerCase(), ruleId },
  });
}

export async function getLastTriggerTime(
  walletAddress: string,
  ruleId: string
): Promise<Date | null> {
  const trigger = await prisma.ruleTrigger.findFirst({
    where: { walletAddress: walletAddress.toLowerCase(), ruleId },
    orderBy: { triggeredAt: 'desc' },
  });
  return trigger?.triggeredAt ?? null;
}

export async function getRewardHistory(
  walletAddress: string,
  limit: number,
  offset: number
): Promise<Reward[]> {
  return prisma.reward.findMany({
    where: { walletAddress: walletAddress.toLowerCase() },
    orderBy: { issuedAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

export async function getPointsBalance(walletAddress: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { walletAddress: walletAddress.toLowerCase() },
    select: { currentPointsBalance: true },
  });
  return Number(user?.currentPointsBalance ?? 0);
}

export async function updateOnChainStatus(
  rewardId: string,
  txHash: string,
  status: string
): Promise<void> {
  await prisma.reward.update({
    where: { id: rewardId },
    data: { onChainTxHash: txHash, onChainStatus: status },
  });
}
