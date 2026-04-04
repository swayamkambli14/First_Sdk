import { FastifyInstance } from 'fastify';
import { apiKeyMiddleware } from '../middleware/apikey.middleware.js';
import {
  getBusinessRules,
  getBusinessRuleById,
  createBusinessRule,
  updateBusinessRule,
  deleteBusinessRule,
  toggleBusinessRule,
  getBusinessTierConfig,
  upsertBusinessTierConfig,
  getBusinessBadges,
  upsertBusinessBadge,
} from '../repositories/business-rules.repo.js';
import { invalidateRulesCache, invalidateTierCache } from '../services/business-rules.cache.js';
import { evaluateConditions } from '../services/rules/condition.evaluator.js';
import {
  CreateRuleSchema,
  UpdateRuleSchema,
  ToggleRuleSchema,
  UpdateTierConfigSchema,
  TestRuleSchema,
} from '../schemas/business-rules.schemas.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from '../utils/errors.js';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export async function businessRoutes(fastify: FastifyInstance) {
  // All business routes require API key auth — scoped to the authenticated app
  fastify.addHook('preHandler', apiKeyMiddleware);

  // ── Rules CRUD ──────────────────────────────────────────────────────────────

  /** GET /v1/business/rules — list all rules for this business */
  fastify.get('/rules', async (request, reply) => {
    const appId = request.app.id;
    const rules = await getBusinessRules(appId);
    return reply.send({ rules, total: rules.length });
  });

  /** POST /v1/business/rules — create a new rule */
  fastify.post('/rules', async (request, reply) => {
    const appId = request.app.id;
    const parsed = CreateRuleSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
        'RULE_VALIDATION_ERROR'
      );
    }

    const data = parsed.data;

    // Check for duplicate rule_id within this business
    const existing = await getBusinessRuleById(appId, data.rule_id);
    if (existing) {
      throw new ConflictError(
        `A rule with ID "${data.rule_id}" already exists for your account`,
        'RULE_ID_CONFLICT'
      );
    }

    const rule = await createBusinessRule(appId, {
      ruleId: data.rule_id,
      name: data.name,
      description: data.description,
      ruleType: data.rule_type,
      triggerEvent: data.trigger_event,
      conditions: data.conditions,
      rewardConfig: data.reward,
      priority: data.priority,
      cooldownHours: data.cooldown_hours,
      maxTriggers: data.max_triggers,
    });

    await invalidateRulesCache(appId);
    logger.info('Business rule created', { appId, ruleId: data.rule_id });

    return reply.status(201).send({ rule });
  });

  /** PUT /v1/business/rules/:rule_id — update a rule */
  fastify.put('/rules/:rule_id', async (request, reply) => {
    const appId = request.app.id;
    const { rule_id } = request.params as { rule_id: string };

    const existing = await getBusinessRuleById(appId, rule_id);
    if (!existing) throw new NotFoundError(`Rule "${rule_id}" not found`, 'RULE_NOT_FOUND');

    const parsed = UpdateRuleSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
        'RULE_VALIDATION_ERROR'
      );
    }

    const data = parsed.data;
    const updated = await updateBusinessRule(appId, rule_id, {
      name: data.name,
      description: data.description,
      ruleType: data.rule_type,
      triggerEvent: data.trigger_event,
      conditions: data.conditions,
      rewardConfig: data.reward,
      priority: data.priority,
      cooldownHours: data.cooldown_hours,
      maxTriggers: data.max_triggers,
    });

    await invalidateRulesCache(appId);
    return reply.send({ rule: updated });
  });

  /** DELETE /v1/business/rules/:rule_id — delete a rule */
  fastify.delete('/rules/:rule_id', async (request, reply) => {
    const appId = request.app.id;
    const { rule_id } = request.params as { rule_id: string };

    const existing = await getBusinessRuleById(appId, rule_id);
    if (!existing) throw new NotFoundError(`Rule "${rule_id}" not found`, 'RULE_NOT_FOUND');

    await deleteBusinessRule(appId, rule_id);
    await invalidateRulesCache(appId);

    return reply.send({ message: `Rule "${rule_id}" deleted successfully` });
  });

  /** PATCH /v1/business/rules/:rule_id/toggle — enable or disable a rule */
  fastify.patch('/rules/:rule_id/toggle', async (request, reply) => {
    const appId = request.app.id;
    const { rule_id } = request.params as { rule_id: string };

    const existing = await getBusinessRuleById(appId, rule_id);
    if (!existing) throw new NotFoundError(`Rule "${rule_id}" not found`, 'RULE_NOT_FOUND');

    const parsed = ToggleRuleSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError('Body must be { "enabled": true | false }', 'VALIDATION_ERROR');
    }

    const updated = await toggleBusinessRule(appId, rule_id, parsed.data.enabled);
    await invalidateRulesCache(appId);

    return reply.send({ rule: updated });
  });

  /** POST /v1/business/rules/test — test a rule against a mock event */
  fastify.post('/rules/test', async (request, reply) => {
    const appId = request.app.id;
    const parsed = TestRuleSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
        'VALIDATION_ERROR'
      );
    }

    const { rule_id, mock_event, mock_user } = parsed.data;
    const ruleRow = await getBusinessRuleById(appId, rule_id);
    if (!ruleRow) throw new NotFoundError(`Rule "${rule_id}" not found`, 'RULE_NOT_FOUND');

    const mockContext = {
      event_type: mock_event.event_type,
      metadata: mock_event.metadata,
      user: {
        wallet_address: '0x0000000000000000000000000000000000000000',
        current_tier: mock_user.current_tier,
        current_points: mock_user.current_points,
        total_points_earned: mock_user.total_points_earned,
        lifetime_event_count: mock_user.lifetime_event_count,
        event_count_in_window: mock_user.event_count_in_window,
        cumulative_metadata: {},
      },
    };

    const matched = evaluateConditions(ruleRow.conditions as Parameters<typeof evaluateConditions>[0], mockContext);

    // Generate plain-English preview
    const preview = generateRulePreview(ruleRow);

    return reply.send({ rule_id, matched, preview, context_used: mockContext });
  });

  // ── Tier & Currency Config ──────────────────────────────────────────────────

  /** GET /v1/business/tiers — get tier configuration */
  fastify.get('/tiers', async (request, reply) => {
    const config = await getBusinessTierConfig(request.app.id);
    return reply.send(config);
  });

  /** PUT /v1/business/tiers — update tier configuration */
  fastify.put('/tiers', async (request, reply) => {
    const appId = request.app.id;
    const parsed = UpdateTierConfigSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
        'TIER_VALIDATION_ERROR'
      );
    }

    const data = parsed.data;
    await upsertBusinessTierConfig(appId, {
      currencyName: data.currency_name,
      tiers: data.tiers,
      spinPools: data.spin_pools,
    });

    await invalidateTierCache(appId);
    await invalidateRulesCache(appId); // tier multipliers affect rule outcomes

    const updated = await getBusinessTierConfig(appId);
    return reply.send(updated);
  });

  /** GET /v1/business/spin-pools — get spin pool definitions */
  fastify.get('/spin-pools', async (request, reply) => {
    const config = await getBusinessTierConfig(request.app.id);
    return reply.send({ spin_pools: config.spinPools });
  });

  /** PUT /v1/business/spin-pools — update spin pool definitions */
  fastify.put('/spin-pools', async (request, reply) => {
    const appId = request.app.id;
    const body = request.body as { spin_pools: Record<string, unknown[]> };
    if (!body?.spin_pools || typeof body.spin_pools !== 'object') {
      throw new ValidationError('Body must have a spin_pools object', 'VALIDATION_ERROR');
    }

    await upsertBusinessTierConfig(appId, { spinPools: body.spin_pools as Record<string, import('../config/rules.types.js').SpinPoolEntry[]> });
    await invalidateTierCache(appId);

    return reply.send({ message: 'Spin pools updated', spin_pools: body.spin_pools });
  });

  // ── Badges ──────────────────────────────────────────────────────────────────

  /** GET /v1/business/badges — list business badge catalog */
  fastify.get('/badges', async (request, reply) => {
    const badges = await getBusinessBadges(request.app.id);
    return reply.send({ badges });
  });

  /** POST /v1/business/badges — add a badge to the catalog */
  fastify.post('/badges', async (request, reply) => {
    const appId = request.app.id;
    const body = request.body as {
      badge_id: string; name: string; description?: string;
      image_url?: string; rarity?: string;
    };
    if (!body?.badge_id || !body?.name) {
      throw new ValidationError('badge_id and name are required', 'VALIDATION_ERROR');
    }
    const badge = await upsertBusinessBadge(appId, {
      badgeId: body.badge_id,
      name: body.name,
      description: body.description,
      imageUrl: body.image_url,
      rarity: body.rarity,
    });
    return reply.status(201).send({ badge });
  });

  // ── Analytics ───────────────────────────────────────────────────────────────

  /** GET /v1/business/analytics — rewards distributed, active users, rule fire rates */
  fastify.get('/analytics', async (request, reply) => {
    const appId = request.app.id;

    const [
      totalUsers,
      totalRewards,
      recentEvents,
      topRules,
      tierDistribution,
    ] = await Promise.all([
      prisma.user.count({ where: { appId } }),
      prisma.reward.count({
        where: { user: { appId } },
      }),
      prisma.event.count({
        where: {
          appId,
          timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.ruleTrigger.groupBy({
        by: ['ruleId'],
        where: { user: { appId } },
        _count: { ruleId: true },
        orderBy: { _count: { ruleId: 'desc' } },
        take: 5,
      }),
      prisma.user.groupBy({
        by: ['currentTier'],
        where: { appId },
        _count: { currentTier: true },
      }),
    ]);

    return reply.send({
      total_users: totalUsers,
      total_rewards_issued: totalRewards,
      events_last_7_days: recentEvents,
      top_rules: topRules.map((r) => ({ rule_id: r.ruleId, fires: r._count.ruleId })),
      tier_distribution: tierDistribution.map((t) => ({
        tier: t.currentTier,
        count: t._count.currentTier,
      })),
    });
  });
}

// ─── Plain-English Rule Preview ───────────────────────────────────────────────

function generateRulePreview(rule: { name: string; triggerEvent: string; conditions: unknown; rewardConfig: unknown; cooldownHours: number | null; maxTriggers: number | null }): string {
  const reward = rule.rewardConfig as { type: string; amount?: number; badge_name?: string; badge_id?: string; spin_pool_id?: string };
  const rewardText =
    reward.type === 'points' ? `award ${reward.amount ?? '?'} points` :
    reward.type === 'badge' ? `award the "${reward.badge_name ?? reward.badge_id}" badge` :
    `trigger a spin wheel (pool: ${reward.spin_pool_id})`;

  const cooldownText = rule.cooldownHours
    ? ` This rule has a ${rule.cooldownHours}-hour cooldown per user.`
    : '';
  const maxText = rule.maxTriggers
    ? ` This can trigger at most ${rule.maxTriggers} time(s) per user.`
    : '';

  return `When a user triggers a "${rule.triggerEvent}" event and conditions are met, ${rewardText}.${cooldownText}${maxText}`;
}
