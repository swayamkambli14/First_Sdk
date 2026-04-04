import React, { useState, useEffect } from 'react';
import { useTierConfig, TierDef } from '../hooks/useTierConfig';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function TiersPage() {
  const { config, loading, save } = useTierConfig();
  const [currencyName, setCurrencyName] = useState('');
  const [tiers, setTiers] = useState<TierDef[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setCurrencyName(config.currencyName ?? 'Points');
      setTiers(config.tiers ?? []);
    }
  }, [config]);

  const updateTier = (i: number, k: keyof TierDef, v: string | number) =>
    setTiers((ts) => ts.map((t, idx) => idx === i ? { ...t, [k]: v } : t));

  const addTier = () =>
    setTiers((ts) => [...ts, { name: 'new_tier', min_points: 0, multiplier: 1.0 }]);

  const removeTier = (i: number) => setTiers((ts) => ts.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    try {
      await save({ currencyName, tiers });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500';

  if (loading && !config) {
    return (
      <div className="p-8">
        <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tiers & Currency</h1>
        <p className="text-gray-500 text-sm mt-1">Configure loyalty tiers and your points currency name</p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Currency Name</h3>
        </CardHeader>
        <CardBody>
          <div className="max-w-xs space-y-1">
            <label className="block text-sm font-medium text-gray-700">Name shown to users</label>
            <input
              className={inputCls}
              value={currencyName}
              onChange={(e) => setCurrencyName(e.target.value)}
              placeholder="Points"
            />
            <p className="text-xs text-gray-400">e.g. "Stars", "Coins", "XP"</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Tier Thresholds</h3>
            <Button variant="secondary" size="sm" onClick={addTier}>+ Add Tier</Button>
          </div>
        </CardHeader>
        <CardBody>
          {tiers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No tiers configured. Add one to get started.</p>
          ) : (
            <div className="space-y-3">
              {tiers.map((t, i) => (
                <div key={i} className="grid grid-cols-3 gap-3 items-end p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Tier Name</label>
                    <input
                      className={inputCls}
                      value={t.name}
                      onChange={(e) => updateTier(i, 'name', e.target.value)}
                      placeholder="bronze"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Min Points</label>
                    <input
                      type="number"
                      className={inputCls}
                      value={t.min_points}
                      onChange={(e) => updateTier(i, 'min_points', parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-gray-500">Multiplier</label>
                      <input
                        type="number"
                        step="0.1"
                        className={inputCls}
                        value={t.multiplier}
                        onChange={(e) => updateTier(i, 'multiplier', parseFloat(e.target.value) || 1)}
                        min={0.1}
                      />
                    </div>
                    <button
                      onClick={() => removeTier(i)}
                      className="text-red-400 hover:text-red-600 text-xl leading-none pb-2"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} loading={saving}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
