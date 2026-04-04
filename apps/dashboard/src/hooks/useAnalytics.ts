import { useState, useEffect } from 'react';
import { analyticsApi } from '../lib/api';

export interface Analytics {
  total_users: number;
  total_rewards_issued: number;
  events_last_7_days: number;
  top_rules: Array<{ rule_id: string; fires: number }>;
  tier_distribution: Array<{ tier: string; count: number }>;
}

export function useAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.get();
      setData(res.data as Analytics);
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetch(); }, []);
  return { data, loading, error, refetch: fetch };
}
