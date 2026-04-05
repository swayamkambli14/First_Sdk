import { useState, useEffect } from 'react';
import { analyticsApi, companyApi } from '../lib/api';

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

    const companyToken = localStorage.getItem('cl_company_token');
    const activeAppId = localStorage.getItem('cl_active_app_id');

    try {
      if (activeAppId || localStorage.getItem('cl_api_key')) {
        // Business analytics — full data (requires active app context)
        const res = await analyticsApi.get();
        setData(res.data as Analytics);
      } else if (companyToken) {
        // No app selected yet — fall back to company-level aggregate (limited data)
        const res = await companyApi.getAnalytics(companyToken);
        const d = res.data as { total_users: number; total_events: number; total_rewards: number; apps_count: number };
        setData({
          total_users: d.total_users,
          total_rewards_issued: d.total_rewards,
          events_last_7_days: 0,
          top_rules: [],
          tier_distribution: [],
        });
      } else {
        setError('No active app selected');
      }
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetch(); }, []);
  return { data, loading, error, refetch: fetch };
}
