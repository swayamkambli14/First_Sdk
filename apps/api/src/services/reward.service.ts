import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import type { Event as PrismaEvent } from '@prisma/client';
import { RewardInstruction, SpinResult } from '../config/rules.types.js';
import { getSpinPool } from '../config/rules.loader.js';
import {
  createPointsReward,
  createBadgeReward,
  findBadgeByWallet,
  createRuleTrigger,
} from '../repositories/reward.repo.js';
import { updateUserPoints } from '../repositories/user.repo.js';
import { recalculateTier } from './rules/tier.calculator.js';
import { badgeMintingQueue } from '../infrastructure/queues.js';
import { NotFoundError } from '../utils/errors.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Routes a RewardInstruction to the correct handler based on type.
 */
export async function issue(instruction: RewardInstruction, event: PrismaEvent): Promise<void> {
  switch (instruction.type) {
    case 'points':
      await issuePoints(
        event.walletAddress,
        instruction.amount ?? 0,
        instruction.reason ?? 'Reward',
        event.id,
        instruction.rule_id
      );
      break;

    case 'badge':
      if (!instruction.badge_id) {
        logger.warn('Badge instruction missing badge_id', { rule_id: instruction.rule_id });
        return;
      }
      await issueBadge(
        event.walletAddress,
        instruction.badge_id,
        event.id,
        instruction.rule_id
      );
      break;

    case 'probabilistic':
      if (!instruction.spin_pool_id) {
        logger.warn('Probabilistic instruction missing spin_pool_id', { rule_id: instruction.rule_id });
        return;
      }
      await issueProbabilistic(
        event.walletAddress,
        instruction.spin_pool_id,
        event.id,
        instruction.rule_id
      );
      break;
  }
}

/**
 * Issues points to a wallet.
 * Uses a DB transaction to atomically:
 *   1. Increment user's points balance
 *   2. Insert reward record
 *   3. Insert rule_trigger record
 * Then recalculates tier outside the transaction.
 */
export async function issuePoints(
  walletAddress: string,
  amount: number,
  reason: string,
  eventId: string,
  ruleId: string
): Promise<void> {
  if (amount <= 0) {
    logger.warn('Attempted to issue 0 or negative points', { walletAddress, amount, ruleId });
    return;
  }

  let rewardId: string;

  await prisma.$transaction(async (tx) => {
    // Atomically increment both balance fields
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

    rewardId = reward.id;
  });

  // Recalculate tier after transaction commits — may trigger tier-upgrade badge
  const tierChange = await recalculateTier(walletAddress);
  if (tierChange.changed) {
    // Issue tier upgrade badge (outside the points transaction to avoid nesting)
    await issueBadge(
      walletAddress,
      `tier_${tierChange.newTier}`,
      eventId,
      `tier_upgrade_${tierChange.newTier}`
    );
  }

  logger.info('Points issued', { walletAddress, amount, ruleId, reason });
}

/**
 * Issues a badge to a wallet.
 * Idempotent — silently returns if the wallet already has this badge.
 * Queues on-chain minting if BLOCKCHAIN_MINTING_ENABLED=true.
 */
export async function issueBadge(
  walletAddress: string,
  badgeId: string,
  eventId: string,
  ruleId: string
): Promise<void> {
  // Idempotency check — a wallet can only hold each badge once
  const existing = await findBadgeByWallet(walletAddress, badgeId);
  if (existing) {
    logger.debug('Badge already issued — skipping', { walletAddress, badgeId });
    return;
  }

  // Verify badge exists in badge_definitions
  const badgeDef = await prisma.badgeDefinition.findUnique({ where: { badgeId } });
  if (!badgeDef) {
    // Don't throw — tier badges may not have definitions yet; log and continue
    logger.warn('Badge definition not found', { badgeId });
  }

  const reward = await prisma.$transaction(async (tx) => {
    const r = await tx.reward.create({
      data: {
        walletAddress: walletAddress.toLowerCase(),
        rewardType: 'badge',
        rewardValue: {
          badge_id: badgeId,
          badge_name: badgeDef?.name,
          rarity: badgeDef?.rarity,
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

  // Queue on-chain minting if enabled — non-blocking, separate queue
  if (env.BLOCKCHAIN_MINTING_ENABLED) {
    await badgeMintingQueue.add('mint-badge', {
      walletAddress,
      badgeId,
      rewardId: reward.id,
    });
  }

  logger.info('Badge issued', { walletAddress, badgeId, ruleId });
}

/**
 * Issues a probabilistic reward by spinning the wheel.
 * Logs the full spin context (odds, result) for transparency.
 */
export async function issueProbabilistic(
  walletAddress: string,
  poolId: string,
  eventId: string,
  ruleId: string
): Promise<void> {
  const result = spinWheel(poolId);

  logger.info('Spin wheel result', {
    wallet: walletAddress,
    pool: poolId,
    result_type: result.reward_type,
    result_amount: result.amount,
    result_badge: result.badge_id,
  });

  if (result.reward_type === 'points' && result.amount) {
    await issuePoints(walletAddress, result.amount, `Spin wheel win: ${result.amount} points`, eventId, ruleId);
  } else if (result.reward_type === 'badge' && result.badge_id) {
    await issueBadge(walletAddress, result.badge_id, eventId, ruleId);
  }
}

/**
 * Weighted random selection from a spin pool.
 * Uses crypto.randomInt() for cryptographic fairness — NOT Math.random().
 */
export function spinWheel(poolId: string): SpinResult {
  const pool = getSpinPool(poolId);

  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    throw new Error(`Spin pool "${poolId}" has zero total weight`);
  }

  // crypto.randomInt(max) returns a value in [0, max) — cryptographically secure
  const random = crypto.randomInt(0, totalWeight);

  let cumulative = 0;
  for (const item of pool) {
    cumulative += item.weight;
    if (random < cumulative) {
      return {
        reward_type: item.reward_type,
        amount: item.amount,
        badge_id: item.badge_id,
        weight: item.weight,
      };
    }
  }

  // Fallback — should never reach here if weights are valid
  const last = pool[pool.length - 1]!;
  return {
    reward_type: last.reward_type,
    amount: last.amount,
    badge_id: last.badge_id,
    weight: last.weight,
  };
}
