import type { Event as PrismaEvent } from '@prisma/client';
import { getRules, getTierConfig } from '../config/rules.loader.js';
import { Rule, RewardInstruction, EvalContext } from '../config/rules.types.js';
import { findUserByWallet } from '../repositories/user.repo.js';
import { getLastTriggerTime, countTriggers } from '../repositories/reward.repo.js';
import { buildContext } from './rules/context.builder.js';
import { evaluateConditions } from './rules/condition.evaluator.js';
import { evaluateFormula } from './rules/formula.evaluator.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Core Rules Engine — evaluates all applicable rules for an event.
 * Returns an array of RewardInstructions to be executed by the RewardService.
 *
 * Algorithm (from TRD Section 7.2):
 * 1. Filter rules by enabled=true AND trigger_event matches
 * 2. Sort by priority descending (higher priority first)
 * 3. For each rule: check cooldown → check max_triggers → build context → evaluate conditions
 * 4. If matched: build RewardInstruction with tier multiplier applied
 */
export async function evaluate(event: PrismaEvent): Promise<RewardInstruction[]> {
  const user = await findUserByWallet(event.walletAddress);
  if (!user) {
    throw new NotFoundError(`User not found: ${event.walletAddress}`, 'USER_NOT_FOUND');
  }

  const allRules = getRules();
  const instructions: RewardInstruction[] = [];

  // Filter to rules that apply to this event type
  const applicableRules = allRules
    .filter((r) => r.enabled)
    .filter((r) => r.trigger_event === event.eventType || r.trigger_event === '*')
    .sort((a, b) => b.priority - a.priority); // highest priority first

  // Build context once — shared across all rule evaluations for this event
  // (context is built lazily below to avoid unnecessary DB calls if no rules apply)
  let context: EvalContext | null = null;

  for (const rule of applicableRules) {
    // ── Cooldown check ──────────────────────────────────────────────────────
    if (rule.cooldown_hours !== null) {
      const lastTriggered = await getLastTriggerTime(user.walletAddress, rule.rule_id);
      if (lastTriggered) {
        const hoursSince = (Date.now() - lastTriggered.getTime()) / 3_600_000;
        if (hoursSince < rule.cooldown_hours) {
          logger.debug(`Rule ${rule.rule_id}: SKIP — in cooldown (${hoursSince.toFixed(1)}h / ${rule.cooldown_hours}h)`);
          continue;
        }
      }
    }

    // ── Max triggers check ──────────────────────────────────────────────────
    if (rule.max_triggers_per_user !== null) {
      const triggerCount = await countTriggers(user.walletAddress, rule.rule_id);
      if (triggerCount >= rule.max_triggers_per_user) {
        logger.debug(`Rule ${rule.rule_id}: SKIP — max triggers reached (${triggerCount}/${rule.max_triggers_per_user})`);
        continue;
      }
    }

    // ── Build context (lazy — only once per event evaluation) ───────────────
    if (!context) {
      context = await buildContext(event, user);
    }

    // ── Evaluate conditions ─────────────────────────────────────────────────
    const matched = evaluateConditions(rule.conditions, context);

    if (!matched) {
      logger.debug(`Rule ${rule.rule_id}: SKIP — conditions not met`);
      continue;
    }

    // ── Build reward instruction ────────────────────────────────────────────
    const instruction = buildRewardInstruction(rule, context);
    instructions.push(instruction);

    logger.debug(`Rule ${rule.rule_id}: MATCH — reward: ${JSON.stringify(instruction)}`);
  }

  logger.info(`Rules evaluated for event ${event.id}`, {
    event_type: event.eventType,
    wallet: event.walletAddress,
    rules_checked: applicableRules.length,
    rules_matched: instructions.length,
  });

  return instructions;
}

/**
 * Builds a RewardInstruction from a matched rule.
 * Resolves formula-based amounts and applies tier multipliers for points.
 */
function buildRewardInstruction(rule: Rule, context: EvalContext): RewardInstruction {
  const reward = rule.reward;

  if (reward.type === 'points') {
    let amount = reward.amount ?? 0;

    // Resolve formula if present (e.g., "metadata.amount * 3")
    if (reward.amount_formula) {
      amount = evaluateFormula(reward.amount_formula, context);
    }

    // Apply tier multiplier
    const multiplier = getTierMultiplier(context.user.current_tier);
    amount = Math.floor(amount * multiplier);

    return {
      rule_id: rule.rule_id,
      type: 'points',
      amount,
      reason: reward.reason,
    };
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

  // Probabilistic — spin wheel
  return {
    rule_id: rule.rule_id,
    type: 'probabilistic',
    spin_pool_id: reward.spin_pool_id,
    reason: 'Spin wheel reward',
  };
}

/**
 * Returns the points multiplier for a given tier.
 * Falls back to 1.0 if tier is not found in config.
 */
function getTierMultiplier(tierName: string): number {
  const tiers = getTierConfig();
  const tier = tiers.find((t) => t.name === tierName);
  return tier?.multiplier ?? 1.0;
}
