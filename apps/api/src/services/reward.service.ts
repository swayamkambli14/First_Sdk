import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import type { Event as PrismaEvent } from '@prisma/client';
import { RewardInstruction, SpinResult } from '../config/rules.types.js';
import { getSpinPoolForApp } from './business-rules.cache.js';
import {
  findBadgeByWallet,
} from '../repositories/reward.repo.js';
import { recalculateTier } from './rules/tier.calculator.js';
import { badgeMintingQueue } from '../infrastructure/queues.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Routes a RewardInstruction to the correct handler.
 * appId is threaded through so every sub-call uses the correct business config.
 */
export async function issue(instruction: RewardInstruction, event: PrismaEvent): Promise<void> {
  const appId = event.appId;

  switch (instruction.type) {
    case 'points':
      await issuePoints(event.walletAddress, instruction.amount ?? 0,
        instruction.reason ?? 'Reward', event.id, instruction.rule_id, appId);
      break;

    case 'badge':
      if (!instruction.badge_id) {
        logger.warn('Badge instruction missing badge_id', { rule_id: instruction.rule_id });
        return;
      }
      await issueBadge(event.walletAddress, instruction.badge_id, event.id, instruction.rule_id, appId);
      break;

    case 'probabilistic':
      if (!instruction.spin_pool_id) {
        logger.warn('Probabilistic instruction missing spin_pool_id', { rule_id: instruction.rule_id });
        return;
      }
      await issueProbabilistic(event.walletAddress, instruction.spin_pool_id,
        event.id, instruction.rule_id, appId);
      break;
  }
}

export async function issuePoints(
  walletAddress: string,
  amount: number,
  reason: string,
  eventId: string,
  ruleId: string,
  appId: string,
): Promise<void> {
  if (amount <= 0) {
    logger.warn('Attempted to issue 0 or negative points', { walletAddress, amount, ruleId });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { walletAddress: walletAddress.toLowerCase() },
      data: {
        currentPointsBalance: { increment: BigInt(amount) },
        totalPointsEarned: { increment: BigInt(amount) },
      },
    });
    const reward = await tx.reward.create({
      data: {
        walletAddress: walletAddress.toLowerCase(),
        rewardType: 'points',
        rewardValue: { amount },
        ruleId,
        eventId,
        reason,
      },
    });
    await tx.ruleTrigger.create({
      data: { walletAddress: walletAddress.toLowerCase(), ruleId, rewardId: reward.id },
    });
  });

  // Recalculate tier using THIS business's tier thresholds
  const tierChange = await recalculateTier(walletAddress, appId);
  if (tierChange.changed) {
    await issueBadge(walletAddress, `tier_${tierChange.newTier}`, eventId,
      `tier_upgrade_${tierChange.newTier}`, appId);
  }

  logger.info('Points issued', { walletAddress, amount, ruleId, appId });
}

export async function issueBadge(
  walletAddress: string,
  badgeId: string,
  eventId: string,
  ruleId: string,
  appId: string,
): Promise<void> {
  const existing = await findBadgeByWallet(walletAddress, badgeId);
  if (existing) return;

  // Check business badge catalog first, then global definitions
  const badgeDef = await prisma.businessBadge.findUnique({
    where: { appId_badgeId: { appId, badgeId } },
  }).catch(() => null) ?? await prisma.badgeDefinition.findUnique({ where: { badgeId } });

  const reward = await prisma.$transaction(async (tx) => {
    const r = await tx.reward.create({
      data: {
        walletAddress: walletAddress.toLowerCase(),
        rewardType: 'badge',
        rewardValue: {
          badge_id: badgeId,
          badge_name: badgeDef?.name,
          rarity: (badgeDef as { rarity?: string })?.rarity ?? 'common',
        },
        ruleId,
        eventId,
        reason: `Badge earned: ${badgeDef?.name ?? badgeId}`,
      },
    });
    await tx.ruleTrigger.create({
      data: { walletAddress: walletAddress.toLowerCase(), ruleId, rewardId: r.id },
    });
    return r;
  });

  if (env.BLOCKCHAIN_MINTING_ENABLED) {
    await badgeMintingQueue.add('mint-badge', { walletAddress, badgeId, rewardId: reward.id });
  }

  logger.info('Badge issued', { walletAddress, badgeId, ruleId, appId });
}

export async function issueProbabilistic(
  walletAddress: string,
  poolId: string,
  eventId: string,
  ruleId: string,
  appId: string,
): Promise<void> {
  const result = await spinWheelForApp(poolId, appId);
  logger.info('Spin wheel result', { wallet: walletAddress, pool: poolId, result });

  if (result.reward_type === 'points' && result.amount) {
    await issuePoints(walletAddress, result.amount,
      `Spin wheel win: ${result.amount} points`, eventId, ruleId, appId);
  } else if (result.reward_type === 'badge' && result.badge_id) {
    await issueBadge(walletAddress, result.badge_id, eventId, ruleId, appId);
  }
}

/** Weighted random selection from a business-scoped spin pool */
export async function spinWheelForApp(poolId: string, appId: string): Promise<SpinResult> {
  const pool = await getSpinPoolForApp(appId, poolId);
  return selectFromPool(pool);
}

/** Legacy sync version for tests — uses global pool only */
export function spinWheel(poolId: string): SpinResult {
  // This is kept for backward compatibility with tests
  // In production, spinWheelForApp is used
  throw new Error('Use spinWheelForApp(poolId, appId) in production code');
}

function selectFromPool(pool: Array<{ reward_type: 'points' | 'badge'; amount?: number; badge_id?: string; weight: number }>): SpinResult {
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) throw new Error('Spin pool has zero total weight');

  const random = crypto.randomInt(0, totalWeight);
  let cumulative = 0;
  for (const item of pool) {
    cumulative += item.weight;
    if (random < cumulative) {
      return { reward_type: item.reward_type, amount: item.amount, badge_id: item.badge_id, weight: item.weight };
    }
  }
  const last = pool[pool.length - 1]!;
  return { reward_type: last.reward_type, amount: last.amount, badge_id: last.badge_id, weight: last.weight };
}
