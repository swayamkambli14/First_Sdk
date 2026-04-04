/**
 * @chainloyalty/sdk — Shared TypeScript types
 * No `any` allowed anywhere in this file.
 */

export interface ChainLoyaltyConfig {
  /** API key for server-side usage (sk_live_...) */
  apiKey?: string;
  /** App UUID — required for all calls */
  appId: string;
  /** Base URL of the ChainLoyalty API */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Number of retry attempts on failure (default: 3) */
  retries?: number;
  /** JWT token for browser/end-user calls (set automatically after SIWE) */
  jwtToken?: string;
}

// ─── Error types ──────────────────────────────────────────────────────────────

export class ChainLoyaltyError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ChainLoyaltyError';
  }
}

// ─── Event types ──────────────────────────────────────────────────────────────

export type EventType =
  | 'purchase'
  | 'referral'
  | 'feature_usage'
  | 'milestone'
  | 'subscription'
  | (string & Record<never, never>); // allow custom event types

export interface TrackEventInput {
  walletAddress: string;
  eventType: EventType;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
  timestamp?: string;
}

export interface TrackEventResult {
  eventId: string;
  status: 'queued';
}

// ─── Reward types ─────────────────────────────────────────────────────────────

export interface PointsBalance {
  walletAddress: string;
  currentBalance: number;
  totalEarned: number;
  tier: string;
  currencyName: string;
}

export interface Badge {
  badgeId: string;
  badgeName: string;
  rarity: string;
  issuedAt: string;
  onChainTxHash: string | null;
}

export interface RewardRecord {
  id: string;
  rewardType: 'points' | 'badge' | 'probabilistic';
  rewardValue: Record<string, unknown>;
  reason: string | null;
  issuedAt: string;
}

export interface RewardHistory {
  rewards: RewardRecord[];
  total: number;
}

export interface SpinResult {
  rewardType: 'points' | 'badge';
  amount?: number;
  badgeId?: string;
  badgeName?: string;
}

// ─── Referral types ───────────────────────────────────────────────────────────

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  confirmedReferrals: number;
  pendingReferrals: number;
  referrals: Array<{
    refereeWallet: string;
    status: 'pending' | 'confirmed' | 'fraudulent';
    createdAt: string;
  }>;
}

// ─── Leaderboard types ────────────────────────────────────────────────────────

export type LeaderboardPeriod = 'all_time' | 'monthly' | 'weekly';

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  tier: string;
  points: number;
}

export interface Leaderboard {
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  updatedAt: string;
}

// ─── User profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  walletAddress: string;
  tier: string;
  currentPointsBalance: number;
  totalPointsEarned: number;
  referralCode: string;
  firstSeenAt: string;
  lastActiveAt: string;
}

// ─── Business rule types ──────────────────────────────────────────────────────

export type RuleType = 'threshold' | 'frequency' | 'conditional';
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

export type RewardConfig =
  | { type: 'points'; amount?: number; amount_formula?: string; reason?: string }
  | { type: 'badge'; badge_id: string; badge_name?: string; rarity?: string }
  | { type: 'probabilistic'; spin_pool_id: string };

export interface BusinessRule {
  ruleId: string;
  name: string;
  description?: string;
  ruleType: RuleType;
  triggerEvent: string;
  conditions: ConditionGroup;
  reward: RewardConfig;
  priority: number;
  enabled: boolean;
  cooldownHours: number | null;
  maxTriggers: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRuleInput {
  rule_id: string;
  name: string;
  description?: string;
  rule_type: RuleType;
  trigger_event: string;
  conditions: ConditionGroup;
  reward: RewardConfig;
  priority?: number;
  cooldown_hours?: number | null;
  max_triggers?: number | null;
}

export interface TierDefinition {
  name: string;
  min_points: number;
  multiplier: number;
  color?: string;
  icon?: string;
}

export interface SpinPoolEntry {
  reward_type: 'points' | 'badge';
  amount?: number;
  badge_id?: string;
  weight: number;
}

export interface BusinessTierConfig {
  currencyName: string;
  tiers: TierDefinition[];
  spinPools: Record<string, SpinPoolEntry[]>;
}

// ─── Auth types ───────────────────────────────────────────────────────────────

export interface NonceResponse {
  nonce: string;
  message: string;
}

export interface AuthResult {
  walletAddress: string;
  tier: string;
  points: string;
}
