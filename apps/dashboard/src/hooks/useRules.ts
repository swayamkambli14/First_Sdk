import { useState, useEffect, useCallback } from 'react';
import { rulesApi } from '../lib/api';

export interface Rule {
  id: string;
  ruleId: string;
  name: string;
  description?: string;
  ruleType: string;
  triggerEvent: string;
  conditions: unknown;
  rewardConfig: unknown;
  priority: number;
  enabled: boolean;
  cooldownHours: number | null;
  maxTriggers: number | null;
  createdAt: string;
  updatedAt: string;
}

export function useRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await rulesApi.list();
      setRules((res.data as { rules: Rule[] }).rules ?? []);
    } catch {
      setError('Failed to load rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggle = async (ruleId: string, enabled: boolean) => {
    await rulesApi.toggle(ruleId, enabled);
    await load();
  };

  const remove = async (ruleId: string) => {
    await rulesApi.delete(ruleId);
    await load();
  };

  return { rules, loading, error, refetch: load, toggle, remove };
}
