import { useState, useEffect, useCallback } from 'react';
import { useChainLoyalty } from '../context.js';
import type { Leaderboard, LeaderboardPeriod } from '@chainloyalty/sdk';

interface UseLeaderboardResult {
  leaderboard: Leaderboard | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLeaderboard(
  period: LeaderboardPeriod = 'all_time',
  limit = 10
): UseLeaderboardResult {
  const { client } = useChainLoyalty();
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await client.leaderboard.get(period, limit);
      setLeaderboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [client, period, limit]);

  useEffect(() => {
    void fetch();
    const interval = setInterval(() => void fetch(), 60_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { leaderboard, isLoading, error, refetch: fetch };
}
