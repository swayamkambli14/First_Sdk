import { FastifyInstance } from 'fastify';
import { jwtMiddleware } from '../middleware/jwt.middleware.js';
import {
  findReferralsByReferrer,
  findReferralByReferee,
  countReferralsByReferrer,
} from '../repositories/referral.repo.js';
import { findUserByWallet } from '../repositories/user.repo.js';
import { validateReferralCode } from '../services/referral.service.js';
import { NotFoundError } from '../utils/errors.js';

export async function referralRoutes(fastify: FastifyInstance) {
  /**
   * GET /v1/referrals/:wallet
   * Referral stats for a wallet: code, referred users, total earned.
   */
  fastify.get('/:wallet', { preHandler: jwtMiddleware }, async (request, reply) => {
    const { wallet } = request.params as { wallet: string };
    const user = await findUserByWallet(wallet);
    if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

    const referrals = await findReferralsByReferrer(wallet);
    const confirmedCount = referrals.filter((r) => r.status === 'confirmed').length;

    return reply.send({
      referral_code: user.referralCode,
      total_referrals: referrals.length,
      confirmed_referrals: confirmedCount,
      pending_referrals: referrals.filter((r) => r.status === 'pending').length,
      referrals: referrals.map((r) => ({
        referee_wallet: `${r.refereeWallet.slice(0, 6)}...${r.refereeWallet.slice(-4)}`,
        status: r.status,
        created_at: r.createdAt,
        confirmed_at: r.confirmedAt,
      })),
    });
  });

  /**
   * GET /v1/referrals/:wallet/chain
   * Shows the referral chain: who referred this person, who did they refer.
   */
  fastify.get('/:wallet/chain', { preHandler: jwtMiddleware }, async (request, reply) => {
    const { wallet } = request.params as { wallet: string };

    const referredBy = await findReferralByReferee(wallet);
    const referralsMade = await findReferralsByReferrer(wallet);

    return reply.send({
      referred_by: referredBy
        ? {
            referrer_wallet: `${referredBy.referrerWallet.slice(0, 6)}...${referredBy.referrerWallet.slice(-4)}`,
            status: referredBy.status,
            created_at: referredBy.createdAt,
          }
        : null,
      referred_users: referralsMade.map((r) => ({
        referee_wallet: `${r.refereeWallet.slice(0, 6)}...${r.refereeWallet.slice(-4)}`,
        status: r.status,
        created_at: r.createdAt,
      })),
    });
  });

  /**
   * POST /v1/referrals/validate/:code
   * Check if a referral code is valid before using it.
   */
  fastify.post('/validate/:code', async (request, reply) => {
    const { code } = request.params as { code: string };
    const result = await validateReferralCode(code);
    return reply.send(result);
  });
}
