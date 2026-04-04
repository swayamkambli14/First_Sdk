import { useState, useEffect } from 'react';
import { tiersApi } from '../lib/api';

export interface TierDef {
  name: string;
  min_points: number;
  multiplier: number;
  color?: string;
  icon?: string;
}

export interface TierConfig {
  currencyName: string;
  tiers: TierDef[];
}

export function useTierConfig() {
  const [config, setConfig] = useState<TierConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tiersApi.get();
      setConfig(res.data as TierConfig);
    } catch {
      setError('Failed to load tier config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async (data: Partial<TierConfig>) => {
    await tiersApi.update({
      currency_name: data.currencyName,
      tiers: data.tiers,
    });
    await load();
  };

  return { config, loading, error, refetch: load, save };
}
