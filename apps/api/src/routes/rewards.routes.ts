import { FastifyInstance } from 'fastify';
import { jwtMiddleware } from '../middleware/jwt.middleware.js';
import { apiKeyMiddleware } from '../middleware/apikey.middleware.js';
import { getRewardHistory, getPointsBalance } from '../repositories/reward.repo.js';
import { findUserByWallet } from '../repositories/user.repo.js';
import { getBusinessTierConfig } from '../repositories/business-rules.repo.js';
import { get, setex } from '../infrastructure/redis.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Plain-English reward descriptions — no blockchain language
function rewardToPlainEnglish(reward: { rewardType: string; rewardValue: unknown; reason: string | null; issuedAt: Date }): string {
  const val = reward.rewardValue as Record<string, unknown>;
  if (reward.rewardType === 'points') {
    const amt = Number(val['amount'] ?? 0);
    if (reward.reason?.includes('purchase')) return `🛒 You earned ${amt} points for your purchase`;
    if (reward.reason?.includes('referral')) return `👥 Referral bonus: ${amt} points`;
    if (reward.reason?.includes('spin')) return `🎰 Lucky spin! You won ${amt} points`;
    if (reward.reason?.includes('tier')) return `⭐ Level up bonus: ${amt} points`;
    return `🎁 You earned ${amt} points`;
  }
  if (reward.rewardType === 'badge') {
    const name = String(val['badge_name'] ?? val['badge_id'] ?? 'Achievement');
    return `🏆 You unlocked the ${name} achievement`;
  }
  return `🎁 ${reward.reason ?? 'Reward received'}`;
}

export async function rewardRoutes(fastify: FastifyInstance) {
  // Both JWT (user) and API key (server) can access reward data
  const authMiddleware = [jwtMiddleware];

  /**
   * GET /v1/users/:wallet/rewards
   * Paginated reward history for a wallet.
   */
  fastify.get('/:wallet/rewards', { preHandler: authMiddleware }, async (request, reply) => {
    const { wallet } = request.params as { wallet: string };
    const { limit = '20', offset = '0' } = request.query as { limit?: string; offset?: string };

    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const offsetNum = parseInt(offset, 10) || 0;

    const rewards = await getRewardHistory(wallet, limitNum, offsetNum);
    return reply.send({ rewards, limit: limitNum, offset: offsetNum });
  });

  /**
   * GET /v1/users/:wallet/points
   * Current points balance and earn history.
   */
  fastify.get('/:wallet/points', { preHandler: authMiddleware }, async (request, reply) => {
    const { wallet } = request.params as { wallet: string };
    const balance = await getPointsBalance(wallet);
    const history = await getRewardHistory(wallet, 20, 0);
    const pointsHistory = history.filter((r) => r.rewardType === 'points');

    return reply.send({
      balance: balance.toString(),
      history: pointsHistory,
    });
  });

  /**
   * GET /v1/users/:wallet/badges
   * All badges earned by a wallet, with badge definitions.
   */
  fastify.get('/:wallet/badges', { preHandler: authMiddleware }, async (request, reply) => {
    const { wallet } = request.params as { wallet: string };

    const badgeRewards = await prisma.reward.findMany({
      where: { walletAddress: wallet.toLowerCase(), rewardType: 'badge' },
      orderBy: { issuedAt: 'desc' },
    });

    // Enrich with badge definitions
    const enriched = await Promise.all(
      badgeRewards.map(async (reward) => {
        const val = reward.rewardValue as Record<string, unknown>;
        const badgeId = val['badge_id'] as string;
        const def = await prisma.badgeDefinition.findUnique({ where: { badgeId } });
        return {
          reward_id: reward.id,
          badge_id: badgeId,
          name: def?.name ?? badgeId,
          description: def?.description,
          image_url: def?.imageUrl,
          rarity: def?.rarity ?? 'common',
          earned_at: reward.issuedAt,
          on_chain_tx_hash: reward.onChainTxHash,
        };
      })
    );

    return reply.send({ badges: enriched });
  });

  /**
   * GET /v1/users/:wallet/profile
   * Full user profile: tier, points, badge count, referral code.
   */
  fastify.get('/:wallet/profile', { preHandler: authMiddleware }, async (request, reply) => {
    const { wallet } = request.params as { wallet: string };
    const user = await findUserByWallet(wallet);

    if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

    const badgeCount = await prisma.reward.count({
      where: { walletAddress: wallet.toLowerCase(), rewardType: 'badge' },
    });

    return reply.send({
      wallet_address: user.walletAddress,
      tier: user.currentTier,
      current_points: user.currentPointsBalance.toString(),
      total_points_earned: user.totalPointsEarned.toString(),
      badge_count: badgeCount,
      referral_code: user.referralCode,
      first_seen_at: user.firstSeenAt,
      last_active_at: user.lastActiveAt,
    });
  });

  /**
   * GET /v1/users/:userId/summary
   * Powers the LoyaltyTopBar widget. Requires only API key (no user JWT).
   * userId can be: wallet address, email, or internal user ID.
   * Cached in Redis for 10 seconds — high-traffic endpoint.
   */
  fastify.get('/:userId/summary', { preHandler: [apiKeyMiddleware] }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const appId = request.app!.id;

    // Try Redis cache first
    const cacheKey = `summary:${appId}:${userId.toLowerCase()}`;
    const cached = await get(cacheKey);
    if (cached) {
      return reply.send(JSON.parse(cached));
    }

    // Resolve userId to a wallet address (supports email, wallet, or UUID)
    let walletAddress: string | null = null;

    if (userId.startsWith('0x') && userId.length === 42) {
      walletAddress = userId.toLowerCase();
    } else if (userId.includes('@')) {
      // Email lookup via UserAccount
      const account = await prisma.userAccount.findUnique({
        where: { email: userId.toLowerCase() },
        select: { walletAddress: true },
      });
      walletAddress = account?.walletAddress ?? null;
    } else {
      // UUID lookup via UserAccount
      const account = await prisma.userAccount.findUnique({
        where: { id: userId },
        select: { walletAddress: true },
      });
      walletAddress = account?.walletAddress ?? null;
    }

    if (!walletAddress) throw new NotFoundError('User not found');

    const user = await findUserByWallet(walletAddress);
    if (!user) throw new NotFoundError('User not found');

    // Get tier config for this app (currency name + tier thresholds)
    const tierConfig = await getBusinessTierConfig(appId);
    const currencyName = tierConfig.currencyName ?? 'Points';
    const tiers = tierConfig.tiers ?? [];

    const currentPoints = Number(user.currentPointsBalance);
    const currentTierDef = tiers.find((t) => t.name === user.currentTier);
    const currentTierIdx = tiers.findIndex((t) => t.name === user.currentTier);
    const nextTierDef = tiers[currentTierIdx + 1];

    let pointsToNextTier = 0;
    let nextTierProgress = 100;
    let nextTierName = null;

    if (nextTierDef) {
      pointsToNextTier = Math.max(0, nextTierDef.min_points - currentPoints);
      const range = nextTierDef.min_points - (currentTierDef?.min_points ?? 0);
      const earned = currentPoints - (currentTierDef?.min_points ?? 0);
      nextTierProgress = range > 0 ? Math.min(100, Math.round((earned / range) * 100)) : 100;
      nextTierName = nextTierDef.name;
    }

    const badgeCount = await prisma.reward.count({
      where: { walletAddress, rewardType: 'badge' },
    });

    const recentRewards = await getRewardHistory(walletAddress, 3, 0);

    // Get display name from UserAccount if available
    const userAccount = await prisma.userAccount.findUnique({
      where: { walletAddress },
      select: { displayName: true, email: true },
    });

    const displayName = userAccount?.displayName
      ?? (userAccount?.email ? userAccount.email.split('@')[0] : null)
      ?? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-3)}`;

    const summary = {
      displayName,
      tier: user.currentTier,
      tierDisplayName: `${user.currentTier.charAt(0).toUpperCase() + user.currentTier.slice(1)} Member`,
      balance: currentPoints,
      currencyName,
      nextTierName,
      pointsToNextTier,
      nextTierProgress,
      badgeCount,
      recentRewards: recentRewards.map((r) => ({
        id: r.id,
        description: rewardToPlainEnglish(r),
        issuedAt: r.issuedAt,
      })),
    };

    // Cache for 10 seconds
    await setex(cacheKey, 10, JSON.stringify(summary));

    return reply.send(summary);
  });
}
