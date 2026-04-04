import { PrismaClient, BusinessRule, BusinessTierConfig, BusinessBadge } from '@prisma/client';
import { Rule, TierConfig, SpinPoolEntry, RewardConfig, ConditionGroup } from '../config/rules.types.js';

const prisma = new PrismaClient();

// ─── Type helpers ─────────────────────────────────────────────────────────────

/** Convert a DB BusinessRule row into the engine's Rule type */
function toRule(row: BusinessRule): Rule {
  return {
    rule_id: row.ruleId,
    name: row.name,
    description: row.description ?? undefined,
    enabled: row.enabled,
    priority: row.priority,
    type: row.ruleType as Rule['type'],
    trigger_event: row.triggerEvent,
    conditions: row.conditions as ConditionGroup,
    reward: row.rewardConfig as RewardConfig,
    cooldown_hours: row.cooldownHours ?? null,
    max_triggers_per_user: row.maxTriggers ?? null,
  };
}

// ─── Business Rules CRUD ──────────────────────────────────────────────────────

export async function getBusinessRules(appId: string): Promise<Rule[]> {
  const rows = await prisma.businessRule.findMany({
    where: { appId },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });
  return rows.map(toRule);
}

export async function getEnabledBusinessRules(appId: string): Promise<Rule[]> {
  const rows = await prisma.businessRule.findMany({
    where: { appId, enabled: true },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });
  return rows.map(toRule);
}

export async function getBusinessRuleById(appId: string, ruleId: string): Promise<BusinessRule | null> {
  return prisma.businessRule.findUnique({ where: { appId_ruleId: { appId, ruleId } } });
}

export async function createBusinessRule(
  appId: string,
  data: {
    ruleId: string;
    name: string;
    description?: string;
    ruleType: string;
    triggerEvent: string;
    conditions: ConditionGroup;
    rewardConfig: RewardConfig;
    priority?: number;
    cooldownHours?: number | null;
    maxTriggers?: number | null;
  }
): Promise<BusinessRule> {
  return prisma.businessRule.create({
    data: {
      appId,
      ruleId: data.ruleId,
      name: data.name,
      description: data.description,
      ruleType: data.ruleType,
      triggerEvent: data.triggerEvent,
      conditions: data.conditions as object,
      rewardConfig: data.rewardConfig as object,
      priority: data.priority ?? 10,
      enabled: true,
      cooldownHours: data.cooldownHours ?? null,
      maxTriggers: data.maxTriggers ?? null,
    },
  });
}

export async function updateBusinessRule(
  appId: string,
  ruleId: string,
  data: Partial<{
    name: string;
    description: string;
    ruleType: string;
    triggerEvent: string;
    conditions: ConditionGroup;
    rewardConfig: RewardConfig;
    priority: number;
    enabled: boolean;
    cooldownHours: number | null;
    maxTriggers: number | null;
  }>
): Promise<BusinessRule> {
  return prisma.businessRule.update({
    where: { appId_ruleId: { appId, ruleId } },
    data: {
      ...data,
      conditions: data.conditions as object | undefined,
      rewardConfig: data.rewardConfig as object | undefined,
    },
  });
}

export async function deleteBusinessRule(appId: string, ruleId: string): Promise<void> {
  await prisma.businessRule.delete({ where: { appId_ruleId: { appId, ruleId } } });
}

export async function toggleBusinessRule(appId: string, ruleId: string, enabled: boolean): Promise<BusinessRule> {
  return prisma.businessRule.update({
    where: { appId_ruleId: { appId, ruleId } },
    data: { enabled },
  });
}

export async function countBusinessRules(appId: string): Promise<number> {
  return prisma.businessRule.count({ where: { appId } });
}

// ─── Business Tier Config ─────────────────────────────────────────────────────

export interface BusinessTierConfigData {
  currencyName: string;
  tiers: TierConfig[];
  spinPools: Record<string, SpinPoolEntry[]>;
}

const DEFAULT_TIERS: TierConfig[] = [
  { name: 'bronze',   min_points: 0,     multiplier: 1.0 },
  { name: 'silver',   min_points: 500,   multiplier: 1.25 },
  { name: 'gold',     min_points: 2000,  multiplier: 1.5 },
  { name: 'platinum', min_points: 10000, multiplier: 2.0 },
];

export async function getBusinessTierConfig(appId: string): Promise<BusinessTierConfigData> {
  const row = await prisma.businessTierConfig.findUnique({ where: { appId } });
  if (!row) {
    return { currencyName: 'points', tiers: DEFAULT_TIERS, spinPools: {} };
  }
  return {
    currencyName: row.currencyName,
    tiers: row.tiers as TierConfig[],
    spinPools: row.spinPools as Record<string, SpinPoolEntry[]>,
  };
}

export async function upsertBusinessTierConfig(
  appId: string,
  data: Partial<BusinessTierConfigData>
): Promise<BusinessTierConfig> {
  return prisma.businessTierConfig.upsert({
    where: { appId },
    create: {
      appId,
      currencyName: data.currencyName ?? 'points',
      tiers: (data.tiers ?? DEFAULT_TIERS) as object[],
      spinPools: (data.spinPools ?? {}) as object,
    },
    update: {
      ...(data.currencyName !== undefined && { currencyName: data.currencyName }),
      ...(data.tiers !== undefined && { tiers: data.tiers as object[] }),
      ...(data.spinPools !== undefined && { spinPools: data.spinPools as object }),
    },
  });
}

// ─── Business Badges ──────────────────────────────────────────────────────────

export async function getBusinessBadges(appId: string): Promise<BusinessBadge[]> {
  return prisma.businessBadge.findMany({ where: { appId }, orderBy: { createdAt: 'asc' } });
}

export async function upsertBusinessBadge(
  appId: string,
  data: { badgeId: string; name: string; description?: string; imageUrl?: string; rarity?: string }
): Promise<BusinessBadge> {
  return prisma.businessBadge.upsert({
    where: { appId_badgeId: { appId, badgeId: data.badgeId } },
    create: { appId, ...data },
    update: { name: data.name, description: data.description, imageUrl: data.imageUrl, rarity: data.rarity },
  });
}
