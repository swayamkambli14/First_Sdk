import { PrismaClient } from '@prisma/client';
import { get, setex } from '../infrastructure/redis.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();
const CACHE_TTL = 60; // 60 seconds — matches the frontend auto-refresh interval

export interface LeaderboardEntry {
  rank: number;
  wallet_address: string; // abbreviated: 0x1234...abcd
  tier: string;
  points: string;
}

type Period = 'all_time' | 'monthly' | 'weekly';

/**
 * Returns the leaderboard for an app, with Redis caching (60s TTL).
 * Abbreviates wallet addresses for privacy: 0x1234...abcd
 */
export async function getLeaderboard(
  appId: string,
  period: Period,
  limit: number
): Promise<LeaderboardEntry[]> {
  const cacheKey = `leaderboard:${appId}:${period}:${limit}`;

  // Cache hit — return immediately
  const cached = await get(cacheKey);
  if (cached) {
    logger.debug('Leaderboard cache hit', { appId, period });
    return JSON.parse(cached) as LeaderboardEntry[];
  }

  // Cache miss — query DB
  const users = await prisma.user.findMany({
    where: { appId },
    orderBy: { totalPointsEarned: 'desc' },
    take: limit,
    select: {
      walletAddress: true,
      currentTier: true,
      totalPointsEarned: true,
    },
  });

  const entries: LeaderboardEntry[] = users.map((user, index) => ({
    rank: index + 1,
    wallet_address: abbreviateWallet(user.walletAddress),
    tier: user.currentTier,
    points: user.totalPointsEarned.toString(),
  }));

  // Store in Redis with 60s TTL
  await setex(cacheKey, CACHE_TTL, JSON.stringify(entries));

  return entries;
}

/**
 * Abbreviates a wallet address for public display.
 * 0x742d35Cc6634C0532925a3b8D4C9E2F3 → 0x742d...2F3
 */
function abbreviateWallet(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
