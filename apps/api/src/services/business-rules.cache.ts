/**
 * Redis cache for per-business rules and tier config.
 * TTL = 60 seconds. Invalidated on every rule save/update/delete.
 * This prevents DB hits on every event while keeping rules fresh.
 */
import { get, setex, del } from '../infrastructure/redis.js';
import {
  getEnabledBusinessRules,
  getBusinessTierConfig,
  countBusinessRules,
  BusinessTierConfigData,
} from '../repositories/business-rules.repo.js';
import { getRules, getTierConfig, getSpinPool } from '../config/rules.loader.js';
import { Rule, TierConfig, SpinPoolEntry } from '../config/rules.types.js';
import logger from '../utils/logger.js';

const RULES_TTL = 60;   // seconds
const TIERS_TTL = 300;  // 5 minutes — tier config changes less often

function rulesKey(appId: string) { return `biz:rules:${appId}`; }
function tiersKey(appId: string) { return `biz:tiers:${appId}`; }

/**
 * Returns the rules for a given app_id.
 * Priority: Redis cache → DB business rules → global fallback rules.
 * Falls back to global rules ONLY if the business has zero custom rules.
 */
export async function getRulesForApp(appId: string): Promise<Rule[]> {
  // 1. Try Redis cache
  const cached = await get(rulesKey(appId));
  if (cached) {
    try {
      return JSON.parse(cached) as Rule[];
    } catch {
      // Cache corrupted — fall through to DB
    }
  }

  // 2. Load from DB
  const count = await countBusinessRules(appId);
  let rules: Rule[];

  if (count === 0) {
    // Business has no custom rules — use global defaults
    rules = getRules();
    logger.debug(`App ${appId}: using global default rules (no custom rules configured)`);
  } else {
    rules = await getEnabledBusinessRules(appId);
    logger.debug(`App ${appId}: loaded ${rules.length} custom rules from DB`);
  }

  // 3. Cache result
  await setex(rulesKey(appId), RULES_TTL, JSON.stringify(rules));
  return rules;
}

/**
 * Returns tier config for a given app_id.
 * Falls back to global tier config if business has no custom config.
 */
export async function getTierConfigForApp(appId: string): Promise<BusinessTierConfigData> {
  const cached = await get(tiersKey(appId));
  if (cached) {
    try {
      return JSON.parse(cached) as BusinessTierConfigData;
    } catch { /* fall through */ }
  }

  const config = await getBusinessTierConfig(appId);

  // If tiers array is empty, use global defaults
  if (!config.tiers || config.tiers.length === 0) {
    config.tiers = getTierConfig();
  }

  await setex(tiersKey(appId), TIERS_TTL, JSON.stringify(config));
  return config;
}

/**
 * Returns a spin pool for a given app_id and pool ID.
 * Checks business tier config first, falls back to global config.
 */
export async function getSpinPoolForApp(appId: string, poolId: string): Promise<SpinPoolEntry[]> {
  const config = await getTierConfigForApp(appId);
  const pool = config.spinPools[poolId];
  if (pool && pool.length > 0) return pool;
  // Fall back to global spin pool
  return getSpinPool(poolId);
}

/** Invalidate cached rules for an app — call after any rule CRUD operation */
export async function invalidateRulesCache(appId: string): Promise<void> {
  await del(rulesKey(appId));
  logger.debug(`Rules cache invalidated for app ${appId}`);
}

/** Invalidate cached tier config for an app */
export async function invalidateTierCache(appId: string): Promise<void> {
  await del(tiersKey(appId));
}
