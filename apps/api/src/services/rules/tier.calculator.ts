import { getTierConfigForApp } from '../business-rules.cache.js';
import { findUserByWallet, updateUserTier } from '../../repositories/user.repo.js';
import logger from '../../utils/logger.js';

interface TierChangeResult {
  oldTier: string;
  newTier: string;
  changed: boolean;
}

/**
 * Recalculates a user's tier based on their total_points_earned.
 * Uses THIS business's tier config — never another business's thresholds.
 * Called after every points reward is issued.
 */
export async function recalculateTier(walletAddress: string, appId: string): Promise<TierChangeResult> {
  const user = await findUserByWallet(walletAddress);
  if (!user) return { oldTier: 'bronze', newTier: 'bronze', changed: false };

  // Load THIS business's tier config
  const config = await getTierConfigForApp(appId);
  const tiers = config.tiers;
  const totalPoints = Number(user.totalPointsEarned);

  let newTier = tiers[0]?.name ?? 'bronze';
  for (const tier of tiers) {
    if (totalPoints >= tier.min_points) newTier = tier.name;
  }

  const oldTier = user.currentTier;
  const changed = newTier !== oldTier;

  if (changed) {
    await updateUserTier(walletAddress, newTier);
    logger.info('Tier promotion', { wallet: walletAddress, from: oldTier, to: newTier, appId });
  }

  return { oldTier, newTier, changed };
}
