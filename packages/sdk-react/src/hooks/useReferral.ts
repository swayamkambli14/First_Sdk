import { useState, useEffect, useCallback } from 'react';
import { useChainLoyalty } from '../context.js';
import type { ReferralStats } from '@chainloyalty/sdk';

interface UseReferralResult {
  stats: ReferralStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useReferral(walletAddress: string | null | undefined): UseReferralResult {
  const { client } = useChainLoyalty();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await client.referrals.getStats(walletAddress);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referral stats');
    } finally {
      setIsLoading(false);
    }
  }, [client, walletAddress]);

  useEffect(() => {
    setStats(null);
    void fetch();
  }, [fetch]);

  return { stats, isLoading, error, refetch: fetch };
}
