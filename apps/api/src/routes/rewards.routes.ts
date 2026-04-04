import { FastifyInstance } from 'fastify';
import { jwtMiddleware } from '../middleware/jwt.middleware.js';
import { apiKeyMiddleware } from '../middleware/apikey.middleware.js';
import { getRewardHistory, getPointsBalance } from '../repositories/reward.repo.js';
import { findUserByWallet } from '../repositories/user.repo.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
}
