import { useState, useEffect } from 'react';
import { spinPoolsApi } from '../lib/api';

export interface SpinEntry {
  reward_type: 'points' | 'badge';
  amount?: number;
  badge_id?: string;
  weight: number;
}

export type SpinPools = Record<string, SpinEntry[]>;

export function useSpinPools() {
  const [pools, setPools] = useState<SpinPools>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await spinPoolsApi.get();
      setPools((res.data as { spin_pools: SpinPools }).spin_pools ?? {});
    } catch {
      setError('Failed to load spin pools');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async (data: SpinPools) => {
    await spinPoolsApi.update({ spin_pools: data });
    await load();
  };

  return { pools, loading, error, refetch: load, save };
}
