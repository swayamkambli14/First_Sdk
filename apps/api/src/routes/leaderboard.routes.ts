import { FastifyInstance } from 'fastify';
import { getLeaderboard } from '../services/leaderboard.service.js';
import { ValidationError } from '../utils/errors.js';

export async function leaderboardRoutes(fastify: FastifyInstance) {
  /**
   * GET /v1/leaderboard?app_id=&period=all_time&limit=10
   * Public endpoint — no auth required.
   * app_id is required to scope the leaderboard to a specific SaaS app.
   */
  fastify.get('/', async (request, reply) => {
    const { app_id, period = 'all_time', limit = '10' } = request.query as {
      app_id?: string;
      period?: string;
      limit?: string;
    };

    if (!app_id) {
      throw new ValidationError('app_id query parameter is required', 'MISSING_APP_ID');
    }

    const validPeriods = ['all_time', 'monthly', 'weekly'];
    if (!validPeriods.includes(period)) {
      throw new ValidationError(
        `period must be one of: ${validPeriods.join(', ')}`,
        'INVALID_PERIOD'
      );
    }

    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);

    const entries = await getLeaderboard(
      app_id,
      period as 'all_time' | 'monthly' | 'weekly',
      limitNum
    );

    return reply.send({ leaderboard: entries, period, limit: limitNum });
  });
}
