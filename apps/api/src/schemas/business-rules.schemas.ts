import { z } from 'zod';

// ─── Condition schemas ────────────────────────────────────────────────────────

const OPERATORS = ['==', '!=', '>', '>=', '<', '<=', 'in', 'not_in', 'contains', 'starts_with', 'exists'] as const;

const SingleConditionSchema = z.object({
  field: z.string().min(1, 'Condition field is required'),
  op: z.enum(OPERATORS, { errorMap: () => ({ message: `Operator must be one of: ${OPERATORS.join(', ')}` }) }),
  value: z.unknown(),
  window_days: z.number().int().positive().optional(),
});

type SingleCondition = z.infer<typeof SingleConditionSchema>;
type ConditionGroup = { operator: 'AND' | 'OR'; checks: Array<SingleCondition | ConditionGroup> };

const ConditionGroupSchema: z.ZodType<ConditionGroup> = z.lazy(() =>
  z.object({
    operator: z.enum(['AND', 'OR'], { errorMap: () => ({ message: 'Logic operator must be AND or OR' }) }),
    checks: z.array(z.union([SingleConditionSchema, ConditionGroupSchema]))
      .min(1, 'At least one condition is required'),
  })
);

// ─── Reward config schemas ────────────────────────────────────────────────────

const PointsRewardSchema = z.object({
  type: z.literal('points'),
  amount: z.number().int().positive('Points amount must be a positive integer').optional(),
  amount_formula: z.string().optional(),
  reason: z.string().optional(),
});

const BadgeRewardSchema = z.object({
  type: z.literal('badge'),
  badge_id: z.string().min(1, 'Badge ID is required'),
  badge_name: z.string().optional(),
  badge_image_url: z.string().url().optional(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']).optional(),
});

const ProbabilisticRewardSchema = z.object({
  type: z.literal('probabilistic'),
  spin_pool_id: z.string().min(1, 'Spin pool ID is required'),
});

const RewardConfigSchema = z.discriminatedUnion('type', [
  PointsRewardSchema,
  BadgeRewardSchema,
  ProbabilisticRewardSchema,
]);

// ─── Rule schemas ─────────────────────────────────────────────────────────────

export const CreateRuleSchema = z.object({
  rule_id: z.string()
    .min(1, 'Rule ID is required')
    .max(100, 'Rule ID must be 100 characters or less')
    .regex(/^[a-z0-9_-]+$/, 'Rule ID must be lowercase letters, numbers, underscores, or hyphens'),
  name: z.string().min(1, 'Rule name is required').max(255),
  description: z.string().max(1000).optional(),
  rule_type: z.enum(['threshold', 'frequency', 'conditional'], {
    errorMap: () => ({ message: 'Rule type must be threshold, frequency, or conditional' }),
  }),
  trigger_event: z.string().min(1, 'Trigger event is required'),
  conditions: ConditionGroupSchema,
  reward: RewardConfigSchema,
  priority: z.number().int().min(1).max(100).default(10),
  cooldown_hours: z.number().int().positive().nullable().default(null),
  max_triggers: z.number().int().positive().nullable().default(null),
});

export const UpdateRuleSchema = CreateRuleSchema.partial().omit({ rule_id: true });

export const ToggleRuleSchema = z.object({
  enabled: z.boolean(),
});

// ─── Tier config schemas ──────────────────────────────────────────────────────

const TierSchema = z.object({
  name: z.string().min(1, 'Tier name is required').max(50),
  min_points: z.number().int().min(0, 'Minimum points must be 0 or greater'),
  multiplier: z.number().min(0.1).max(10, 'Multiplier must be between 0.1 and 10'),
  color: z.string().optional(),
  icon: z.string().optional(),
});

const SpinPoolEntrySchema = z.object({
  reward_type: z.enum(['points', 'badge']),
  amount: z.number().int().positive().optional(),
  badge_id: z.string().optional(),
  weight: z.number().int().positive('Weight must be a positive integer'),
});

export const UpdateTierConfigSchema = z.object({
  currency_name: z.string().min(1).max(50).optional(),
  tiers: z.array(TierSchema)
    .min(1, 'At least one tier is required')
    .refine(
      (tiers) => tiers.some((t) => t.min_points === 0),
      { message: 'At least one tier must have min_points of 0 (the base tier)' }
    )
    .optional(),
  spin_pools: z.record(z.string(), z.array(SpinPoolEntrySchema)).optional(),
});

// ─── Test rule schema ─────────────────────────────────────────────────────────

export const TestRuleSchema = z.object({
  rule_id: z.string().min(1),
  mock_event: z.object({
    event_type: z.string(),
    metadata: z.record(z.string(), z.unknown()).default({}),
  }),
  mock_user: z.object({
    current_tier: z.string().default('bronze'),
    current_points: z.number().default(0),
    total_points_earned: z.number().default(0),
    lifetime_event_count: z.record(z.string(), z.number()).default({}),
    event_count_in_window: z.number().default(0),
  }).default({}),
});

export type CreateRuleInput = z.infer<typeof CreateRuleSchema>;
export type UpdateRuleInput = z.infer<typeof UpdateRuleSchema>;
export type UpdateTierConfigInput = z.infer<typeof UpdateTierConfigSchema>;
export type TestRuleInput = z.infer<typeof TestRuleSchema>;
