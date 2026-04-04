import { getTierConfig } from '../../config/rules.loader.js';
import { findUserByWallet, updateUserTier } from '../../repositories/user.repo.js';
import logger from '../../utils/logger.js';

interface TierChangeResult {
  oldTier: string;
  newTier: string;
  changed: boolean;
}

/**
 * Recalculates a user's tier based on their total_points_earned.
 * Called after every points reward is issued.
 * If tier changed: updates DB and returns the change for badge issuance.
 */
export async function recalculateTier(walletAddress: string): Promise<TierChangeResult> {
  const user = await findUserByWallet(walletAddress);
  if (!user) {
    return { oldTier: 'bronze', newTier: 'bronze', changed: false };
  }

  const tiers = getTierConfig();
  const totalPoints = Number(user.totalPointsEarned);

  // Find the highest tier the user qualifies for
  let newTier = 'bronze';
  for (const tier of tiers) {
    if (totalPoints >= tier.min_points) {
      newTier = tier.name;
    }
  }

  const oldTier = user.currentTier;
  const changed = newTier !== oldTier;

  if (changed) {
    await updateUserTier(walletAddress, newTier);
    logger.info('Tier promotion', {
      wallet: walletAddress,
      from: oldTier,
      to: newTier,
      total_points: totalPoints,
    });
  }

  return { oldTier, newTier, changed };
}
