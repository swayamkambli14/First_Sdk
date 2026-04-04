import type { Event as PrismaEvent, User } from '@prisma/client';
import { EvalContext } from '../../config/rules.types.js';
import {
  countEventsByType,
  countEventsInWindow,
  getCumulativeMetadata,
} from '../../repositories/event.repo.js';

/**
 * Builds the evaluation context for a rule check.
 * All DB calls are parallelized with Promise.all — never sequential awaits.
 * The context exposes every field a rule condition might reference via dot notation.
 */
export async function buildContext(event: PrismaEvent, user: User): Promise<EvalContext> {
  // Parallel DB queries — do not await sequentially
  const [lifetimeEventCount, eventCountInWindow, cumulativeMetadata] = await Promise.all([
    countEventsByType(user.walletAddress),
    countEventsInWindow(user.walletAddress, 7),
    getCumulativeMetadata(user.walletAddress),
  ]);

  return {
    event_type: event.eventType,
    metadata: event.metadata as Record<string, unknown>,
    user: {
      wallet_address: user.walletAddress,
      current_tier: user.currentTier,
      current_points: Number(user.currentPointsBalance),
      total_points_earned: Number(user.totalPointsEarned),
      lifetime_event_count: lifetimeEventCount,
      event_count_in_window: eventCountInWindow,
      cumulative_metadata: cumulativeMetadata,
    },
  };
}
