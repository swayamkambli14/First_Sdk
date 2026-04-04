import { useState, useEffect, useCallback } from 'react';
import { useChainLoyalty } from '../context.js';
import type { PointsBalance, Badge, RewardHistory } from '@chainloyalty/sdk';

interface UseRewardsResult {
  balance: PointsBalance | null;
  badges: Badge[];
  history: RewardHistory | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRewards(walletAddress: string | null | undefined): UseRewardsResult {
  const { client } = useChainLoyalty();
  const [balance, setBalance] = useState<PointsBalance | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [history, setHistory] = useState<RewardHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      const [bal, bdg, hist] = await Promise.all([
        client.rewards.getBalance(walletAddress),
        client.rewards.getBadges(walletAddress),
        client.rewards.getHistory(walletAddress),
      ]);
      setBalance(bal);
      setBadges(bdg);
      setHistory(hist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rewards');
    } finally {
      setIsLoading(false);
    }
  }, [client, walletAddress]);

  useEffect(() => {
    // Clear data immediately when wallet changes
    setBalance(null);
    setBadges([]);
    setHistory(null);
    void fetch();
  }, [fetch]);

  return { balance, badges, history, isLoading, error, refetch: fetch };
}
