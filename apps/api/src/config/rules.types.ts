/**
 * Type definitions for the rules configuration system.
 * Every rule, condition, reward, and tier is typed here.
 */

export type ConditionOperator = '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'not_in' | 'contains' | 'starts_with' | 'exists';
export type LogicOperator = 'AND' | 'OR';

export interface SingleCondition {
  field: string;
  op: ConditionOperator;
  value: unknown;
  window_days?: number;
}

export interface ConditionGroup {
  operator: LogicOperator;
  checks: Array<SingleCondition | ConditionGroup>;
}

// Type guard to distinguish a ConditionGroup from a SingleCondition
export function isConditionGroup(check: SingleCondition | ConditionGroup): check is ConditionGroup {
  return 'operator' in check && 'checks' in check;
}

export type RewardType = 'points' | 'badge' | 'probabilistic';

export interface PointsRewardConfig {
  type: 'points';
  amount?: number;
  amount_formula?: string;
  reason?: string;
}

export interface BadgeRewardConfig {
  type: 'badge';
  badge_id: string;
  badge_name?: string;
  badge_image_url?: string;
  rarity?: string;
}

export interface ProbabilisticRewardConfig {
  type: 'probabilistic';
  spin_pool_id: string;
}

export type RewardConfig = PointsRewardConfig | BadgeRewardConfig | ProbabilisticRewardConfig;

export interface Rule {
  rule_id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  type: 'threshold' | 'frequency' | 'conditional';
  trigger_event: string; // event type or '*' for all
  conditions: ConditionGroup;
  reward: RewardConfig;
  cooldown_hours: number | null;
  max_triggers_per_user: number | null;
}

export interface SpinPoolEntry {
  reward_type: 'points' | 'badge';
  amount?: number;
  badge_id?: string;
  weight: number;
}

export interface TierConfig {
  name: string;
  min_points: number;
  multiplier: number;
}

export interface RulesConfig {
  version: string;
  rules: Rule[];
  spin_pools: Record<string, SpinPoolEntry[]>;
  tier_config: {
    tiers: TierConfig[];
  };
}

// The instruction returned by the rules engine to the reward service
export interface RewardInstruction {
  rule_id: string;
  type: RewardType;
  amount?: number;
  badge_id?: string;
  badge_name?: string;
  rarity?: string;
  spin_pool_id?: string;
  reason?: string;
}

// The evaluation context built for each event
export interface EvalContext {
  event_type: string;
  metadata: Record<string, unknown>;
  user: {
    wallet_address: string;
    current_tier: string;
    current_points: number;
    total_points_earned: number;
    lifetime_event_count: Record<string, number>;
    event_count_in_window: number;
    cumulative_metadata: Record<string, Record<string, number>>;
  };
}

export interface SpinResult {
  reward_type: 'points' | 'badge';
  amount?: number;
  badge_id?: string;
  weight: number;
}
