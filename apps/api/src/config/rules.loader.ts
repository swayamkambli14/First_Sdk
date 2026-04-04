import fs from 'fs';
import path from 'path';
import { RulesConfig, Rule, SpinPoolEntry, TierConfig } from './rules.types.js';
import logger from '../utils/logger.js';
import { env } from './env.js';

const VALID_OPERATORS = ['==', '!=', '>', '>=', '<', '<=', 'in', 'not_in', 'contains', 'starts_with', 'exists'];
const VALID_REWARD_TYPES = ['points', 'badge', 'probabilistic'];

let currentConfig: RulesConfig | null = null;

/**
 * Validates the structure of a loaded rules config.
 * Throws if any required field is missing or invalid.
 */
function validateConfig(config: unknown): RulesConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('Rules config must be a JSON object');
  }

  const cfg = config as Record<string, unknown>;

  if (!Array.isArray(cfg['rules'])) {
    throw new Error('Rules config must have a "rules" array');
  }

  for (const rule of cfg['rules'] as unknown[]) {
    const r = rule as Record<string, unknown>;
    if (!r['rule_id']) throw new Error(`Rule missing rule_id: ${JSON.stringify(r)}`);
    if (!r['trigger_event']) throw new Error(`Rule ${r['rule_id']} missing trigger_event`);
    if (!r['reward']) throw new Error(`Rule ${r['rule_id']} missing reward`);
    const reward = r['reward'] as Record<string, unknown>;
    if (!VALID_REWARD_TYPES.includes(reward['type'] as string)) {
      throw new Error(`Rule ${r['rule_id']} has invalid reward type: ${reward['type']}`);
    }
  }

  if (!cfg['tier_config'] || !Array.isArray((cfg['tier_config'] as Record<string, unknown>)['tiers'])) {
    throw new Error('Rules config must have tier_config.tiers array');
  }

  return cfg as unknown as RulesConfig;
}

/**
 * Loads and validates the rules config from disk.
 * Called at startup and on hot-reload.
 */
function loadConfig(): RulesConfig {
  const configPath = path.resolve(env.RULES_CONFIG_PATH);
  const raw = fs.readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(raw) as unknown;
  const validated = validateConfig(parsed);

  const enabledCount = validated.rules.filter((r) => r.enabled).length;
  const poolCount = Object.keys(validated.spin_pools ?? {}).length;
  logger.info(`Rules Engine loaded: ${enabledCount} enabled rules, ${poolCount} spin pools`);

  return validated;
}

/**
 * Initializes the rules config and sets up fs.watch for hot-reload.
 * When the config file changes, it reloads and re-validates automatically.
 */
export function initRulesLoader(): void {
  currentConfig = loadConfig();

  const configPath = path.resolve(env.RULES_CONFIG_PATH);

  // Hot-reload on file change — no server restart needed
  fs.watch(configPath, (eventType) => {
    if (eventType === 'change') {
      try {
        currentConfig = loadConfig();
        logger.info('Rules config hot-reloaded successfully');
      } catch (err) {
        logger.error('Rules config hot-reload failed — keeping previous config', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  });
}

export function getRules(): Rule[] {
  if (!currentConfig) currentConfig = loadConfig();
  return currentConfig.rules;
}

export function getSpinPool(poolId: string): SpinPoolEntry[] {
  if (!currentConfig) currentConfig = loadConfig();
  const pool = currentConfig.spin_pools?.[poolId];
  if (!pool) throw new Error(`Spin pool "${poolId}" not found in rules config`);
  return pool;
}

export function getTierConfig(): TierConfig[] {
  if (!currentConfig) currentConfig = loadConfig();
  return currentConfig.tier_config.tiers;
}

export function reloadRules(): void {
  currentConfig = loadConfig();
}
