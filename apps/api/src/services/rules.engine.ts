import type { Event as PrismaEvent } from '@prisma/client';
import { Rule, RewardInstruction, EvalContext } from '../config/rules.types.js';
import { findUserByWallet } from '../repositories/user.repo.js';
import { getLastTriggerTime, countTriggers } from '../repositories/reward.repo.js';
import { buildContext } from './rules/context.builder.js';
import { evaluateConditions } from './rules/condition.evaluator.js';
import { evaluateFormula } from './rules/formula.evaluator.js';
import { getRulesForApp, getTierConfigForApp } from './business-rules.cache.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Core Rules Engine — evaluates all applicable rules for an event.
 *
 * CRITICAL: Rules are scoped per app_id. A business's rules NEVER affect
 * another business's users. The appId is taken from the event record itself,
 * which was set at ingestion time from the authenticated API key.
 *
 * Algorithm (TRD Section 7.2):
 * 1. Load rules for THIS app_id only (cache → DB → global fallback)
 * 2. Filter by enabled=true AND trigger_event matches
 * 3. Sort by priority descending
 * 4. For each rule: check cooldown → check max_triggers → build context → evaluate conditions
 * 5. If matched: build RewardInstruction with THIS business's tier multiplier
 */
export async function evaluate(event: PrismaEvent): Promise<RewardInstruction[]> {
  const user = await findUserByWallet(event.walletAddress);
  if (!user) {
    throw new NotFoundError(`User not found: ${event.walletAddress}`, 'USER_NOT_FOUND');
  }

  // ── ISOLATION GUARANTEE: load rules scoped to this event's app_id ──────────
  const appId = event.appId;
  const allRules = await getRulesForApp(appId);
  const instructions: RewardInstruction[] = [];

  // Filter to rules that apply to this event type
  const applicableRules = allRules
    .filter((r) => r.enabled)
    .filter((r) => r.trigger_event === event.eventType || r.trigger_event === '*')
    .sort((a, b) => b.priority - a.priority);

  // Build context lazily — only once per event evaluation
  let context: EvalContext | null = null;

  for (const rule of applicableRules) {
    // ── Cooldown check ──────────────────────────────────────────────────────
    if (rule.cooldown_hours !== null) {
      const lastTriggered = await getLastTriggerTime(user.walletAddress, rule.rule_id);
      if (lastTriggered) {
        const hoursSince = (Date.now() - lastTriggered.getTime()) / 3_600_000;
        if (hoursSince < rule.cooldown_hours) {
          logger.debug(`Rule ${rule.rule_id}: SKIP — in cooldown`);
          continue;
        }
      }
    }

    // ── Max triggers check ──────────────────────────────────────────────────
    if (rule.max_triggers_per_user !== null) {
      const triggerCount = await countTriggers(user.walletAddress, rule.rule_id);
      if (triggerCount >= rule.max_triggers_per_user) {
        logger.debug(`Rule ${rule.rule_id}: SKIP — max triggers reached`);
        continue;
      }
    }

    // ── Build context (lazy) ────────────────────────────────────────────────
    if (!context) {
      context = await buildContext(event, user);
    }

    // ── Evaluate conditions ─────────────────────────────────────────────────
    const matched = evaluateConditions(rule.conditions, context);
    if (!matched) continue;

    // ── Build reward instruction with THIS business's tier multiplier ────────
    const instruction = await buildRewardInstruction(rule, context, appId);
    instructions.push(instruction);

    logger.debug(`Rule ${rule.rule_id}: MATCH`, { appId, reward: instruction });
  }

  logger.info(`Rules evaluated`, {
    appId,
    event_type: event.eventType,
    wallet: event.walletAddress,
    rules_checked: applicableRules.length,
    rules_matched: instructions.length,
  });

  return instructions;
}

/**
 * Builds a RewardInstruction from a matched rule.
 * Uses THIS business's tier config for multipliers — never another business's.
 */
async function buildRewardInstruction(
  rule: Rule,
  context: EvalContext,
  appId: string
): Promise<RewardInstruction> {
  const reward = rule.reward;

  if (reward.type === 'points') {
    let amount = reward.amount ?? 0;
    if (reward.amount_formula) {
      amount = evaluateFormula(reward.amount_formula, context);
    }
    // Apply THIS business's tier multiplier
    const multiplier = await getTierMultiplierForApp(context.user.current_tier, appId);
    amount = Math.floor(amount * multiplier);

    return { rule_id: rule.rule_id, type: 'points', amount, reason: reward.reason };
  }

  if (reward.type === 'badge') {
    return {
      rule_id: rule.rule_id,
      type: 'badge',
      badge_id: reward.badge_id,
      badge_name: reward.badge_name,
      rarity: reward.rarity,
      reason: `Badge earned: ${reward.badge_name ?? reward.badge_id}`,
    };
  }

  return {
    rule_id: rule.rule_id,
    type: 'probabilistic',
    spin_pool_id: reward.spin_pool_id,
    reason: 'Spin wheel reward',
  };
}

/** Returns the tier multiplier for a user's tier, scoped to their business */
async function getTierMultiplierForApp(tierName: string, appId: string): Promise<number> {
  const config = await getTierConfigForApp(appId);
  const tier = config.tiers.find((t) => t.name === tierName);
  return tier?.multiplier ?? 1.0;
}
