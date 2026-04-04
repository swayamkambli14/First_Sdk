/**
 * Gap #2 fix: Real API data hook for dashboard tabs.
 * Replaces mockData.ts usage with live ChainLoyalty API calls.
 */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useChainLoyaltyAuth } from './useChainLoyaltyAuth';

const APP_ID = import.meta.env['VITE_APP_ID'] ?? 'demo-app-id';

export interface UserStats {
  walletAddress: string;
  tier: string;
  currentPointsBalance: number;
  totalPointsEarned: number;
  referralCode: string;
  badgesCount: number;
}

export interface Badge {
  badge_id: string;
  badge_name: string;
  rarity: string;
  issued_at: string;
  on_chain_tx_hash: string | null;
}

export interface RewardRecord {
  id: string;
  reward_type: string;
  reward_value: Record<string, unknown>;
  reason: string;
  issued_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  wallet_address: string;
  tier: string;
  points: string;
}

export interface ReferralStats {
  referral_code: string;
  total_referrals: number;
  confirmed_referrals: number;
  pending_referrals: number;
  referrals: Array<{ referee_wallet: string; status: string; created_at: string }>;
}

function apiGet<T>(url: string) {
  return axios.get<T>(url, { withCredentials: true, headers: { 'x-app-id': APP_ID } });
}

export function useUserStats() {
  const { walletAddress, isAuthenticated, tier, points } = useChainLoyaltyAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!walletAddress || !isAuthenticated) return;
    setLoading(true);
    try {
      const res = await apiGet<UserStats>(`/v1/users/${walletAddress}/profile`);
      setStats(res.data);
    } catch {
      // Fallback to auth state values
      if (walletAddress) {
        setStats({
          walletAddress,
          tier: tier ?? 'bronze',
          currentPointsBalance: parseInt(points ?? '0'),
          totalPointsEarned: parseInt(points ?? '0'),
          referralCode: '',
          badgesCount: 0,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [walletAddress, isAuthenticated, tier, points]);

  useEffect(() => { void fetch(); }, [fetch]);
  return { stats, loading, refetch: fetch };
}

export function useBadges() {
  const { walletAddress, isAuthenticated } = useChainLoyaltyAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress || !isAuthenticated) return;
    setLoading(true);
    apiGet<{ badges: Badge[] }>(`/v1/users/${walletAddress}/badges`)
      .then((r) => setBadges(r.data.badges))
      .catch(() => setBadges([]))
      .finally(() => setLoading(false));
  }, [walletAddress, isAuthenticated]);

  return { badges, loading };
}

export function useRewardHistory() {
  const { walletAddress, isAuthenticated } = useChainLoyaltyAuth();
  const [rewards, setRewards] = useState<RewardRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress || !isAuthenticated) return;
    setLoading(true);
    apiGet<{ rewards: RewardRecord[] }>(`/v1/users/${walletAddress}/rewards`)
      .then((r) => setRewards(r.data.rewards))
      .catch(() => setRewards([]))
      .finally(() => setLoading(false));
  }, [walletAddress, isAuthenticated]);

  return { rewards, loading };
}

export function useLeaderboard(period: string) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ leaderboard: LeaderboardEntry[] }>(
        `/v1/leaderboard?app_id=${APP_ID}&period=${period}&limit=20`
      );
      setEntries(res.data.leaderboard);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void fetch();
    const interval = setInterval(() => void fetch(), 60_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { entries, loading };
}

export function useReferralStats() {
  const { walletAddress, isAuthenticated } = useChainLoyaltyAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress || !isAuthenticated) return;
    setLoading(true);
    apiGet<ReferralStats>(`/v1/referrals/${walletAddress}`)
      .then((r) => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [walletAddress, isAuthenticated]);

  return { stats, loading };
}

/** Fire a product event to the ChainLoyalty API */
export async function fireEvent(
  eventType: string,
  walletAddress: string,
  metadata: Record<string, unknown> = {}
) {
  const apiKey = import.meta.env['VITE_API_KEY'] as string | undefined;
  if (!apiKey) return;
  await axios.post(
    '/v1/events',
    { wallet_address: walletAddress, event_type: eventType, metadata },
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
}
