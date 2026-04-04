import { FastifyInstance } from 'fastify';
import { adminMiddleware } from '../middleware/jwt.middleware.js';
import { getRules, reloadRules } from '../config/rules.loader.js';
import { evaluateConditions } from '../services/rules/condition.evaluator.js';
import { buildContext } from '../services/rules/context.builder.js';
import { countTriggers } from '../repositories/reward.repo.js';
import { NotFoundError } from '../utils/errors.js';
import type { Event as PrismaEvent, User } from '@prisma/client';

export async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require the ADMIN_SECRET header
  fastify.addHook('preHandler', adminMiddleware);

  /**
   * GET /v1/admin/rules
   * List all loaded rules with their status.
   */
  fastify.get('/rules', async (_request, reply) => {
    const rules = getRules();
    return reply.send({
      rules: rules.map((r) => ({
        rule_id: r.rule_id,
        name: r.name,
        type: r.type,
        enabled: r.enabled,
        priority: r.priority,
        trigger_event: r.trigger_event,
        reward_type: r.reward.type,
      })),
      total: rules.length,
      enabled: rules.filter((r) => r.enabled).length,
    });
  });

  /**
   * POST /v1/admin/rules/reload
   * Hot-reload rules from the config file without restarting the server.
   */
  fastify.post('/rules/reload', async (_request, reply) => {
    reloadRules();
    const rules = getRules();
    return reply.send({
      message: 'Rules reloaded successfully',
      total: rules.length,
      enabled: rules.filter((r) => r.enabled).length,
    });
  });

  /**
   * POST /v1/admin/rules/test
   * Test a rule against a mock event+user context.
   * Returns whether the rule would match and why.
   */
  fastify.post('/rules/test', async (request, reply) => {
    const { rule_id, mock_event, mock_user } = request.body as {
      rule_id: string;
      mock_event: Partial<PrismaEvent>;
      mock_user: Partial<User>;
    };

    const rules = getRules();
    const rule = rules.find((r) => r.rule_id === rule_id);
    if (!rule) throw new NotFoundError(`Rule ${rule_id} not found`, 'RULE_NOT_FOUND');

    // Build a mock context from the provided data
    const mockContext = {
      event_type: mock_event.eventType ?? 'purchase',
      metadata: (mock_event.metadata as Record<string, unknown>) ?? {},
      user: {
        wallet_address: mock_user.walletAddress ?? '0x0000000000000000000000000000000000000000',
        current_tier: mock_user.currentTier ?? 'bronze',
        current_points: Number(mock_user.currentPointsBalance ?? 0),
        total_points_earned: Number(mock_user.totalPointsEarned ?? 0),
        lifetime_event_count: {},
        event_count_in_window: 0,
        cumulative_metadata: {},
      },
    };

    const matched = evaluateConditions(rule.conditions, mockContext);

    return reply.send({
      rule_id,
      matched,
      rule_name: rule.name,
      conditions: rule.conditions,
      context_used: mockContext,
    });
  });

  /**
   * GET /v1/admin/rules/:id/stats
   * How many times a rule has been triggered, by how many unique users.
   */
  fastify.get('/rules/:id/stats', async (request, reply) => {
    const { id } = request.params as { id: string };
    const rules = getRules();
    const rule = rules.find((r) => r.rule_id === id);
    if (!rule) throw new NotFoundError(`Rule ${id} not found`, 'RULE_NOT_FOUND');

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const totalTriggers = await prisma.ruleTrigger.count({ where: { ruleId: id } });
    const uniqueUsers = await prisma.ruleTrigger.groupBy({
      by: ['walletAddress'],
      where: { ruleId: id },
    });

    return reply.send({
      rule_id: id,
      rule_name: rule.name,
      total_triggers: totalTriggers,
      unique_users: uniqueUsers.length,
    });
  });
}
