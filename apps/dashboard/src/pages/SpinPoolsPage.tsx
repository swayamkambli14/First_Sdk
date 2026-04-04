import React, { useState, useEffect } from 'react';
import { Dices, Plus } from 'lucide-react';
import { useSpinPools, SpinEntry, SpinPools } from '../hooks/useSpinPools';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

function PoolEditor({
  poolId,
  entries,
  onChange,
  onDelete,
}: {
  poolId: string;
  entries: SpinEntry[];
  onChange: (entries: SpinEntry[]) => void;
  onDelete: () => void;
}) {
  const totalWeight = entries.reduce((s, e) => s + e.weight, 0);

  const add = () => onChange([...entries, { reward_type: 'points', amount: 100, weight: 10 }]);
  const remove = (i: number) => onChange(entries.filter((_, idx) => idx !== i));
  const update = (i: number, k: keyof SpinEntry, v: unknown) =>
    onChange(entries.map((e, idx) => idx === i ? { ...e, [k]: v } : e));

  const inputCls = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 font-mono">{poolId}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Total weight: {totalWeight}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={add}>+ Entry</Button>
            <Button variant="danger" size="sm" onClick={onDelete}>Delete Pool</Button>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {entries.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No entries. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((e, i) => {
              const pct = totalWeight > 0 ? ((e.weight / totalWeight) * 100).toFixed(1) : '0';
              return (
                <div key={i} className="grid grid-cols-4 gap-2 items-center p-2 bg-gray-50 rounded-lg">
                  <select
                    className={inputCls}
                    value={e.reward_type}
                    onChange={(ev) => update(i, 'reward_type', ev.target.value)}
                  >
                    <option value="points">Points</option>
                    <option value="badge">Badge</option>
                  </select>
                  {e.reward_type === 'points' ? (
                    <input
                      type="number"
                      className={inputCls}
                      placeholder="Amount"
                      value={e.amount ?? ''}
                      onChange={(ev) => update(i, 'amount', parseInt(ev.target.value) || 0)}
                      min={1}
                    />
                  ) : (
                    <input
                      className={inputCls}
                      placeholder="Badge ID"
                      value={e.badge_id ?? ''}
                      onChange={(ev) => update(i, 'badge_id', ev.target.value)}
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className={inputCls}
                      placeholder="Weight"
                      value={e.weight}
                      onChange={(ev) => update(i, 'weight', parseInt(ev.target.value) || 1)}
                      min={1}
                    />
                    <span className="text-xs text-gray-400 whitespace-nowrap">{pct}%</span>
                  </div>
                  <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 text-xl leading-none text-center">×</button>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default function SpinPoolsPage() {
  const { pools, loading, save } = useSpinPools();
  const [local, setLocal] = useState<SpinPools>({});
  const [newPoolId, setNewPoolId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setLocal(pools); }, [pools]);

  const addPool = () => {
    if (!newPoolId.trim()) return;
    setLocal((p) => ({ ...p, [newPoolId.trim()]: [] }));
    setNewPoolId('');
  };

  const deletePool = (id: string) => setLocal((p) => { const n = { ...p }; delete n[id]; return n; });

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(local);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading && Object.keys(pools).length === 0) {
    return <div className="p-8"><div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" /></div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Spin Pools</h1>
        <p className="text-gray-500 text-sm mt-1">Configure weighted reward pools for the spin wheel</p>
      </div>

      <div className="flex gap-3">
        <input
          className="flex-1 max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="New pool ID (e.g. default)"
          value={newPoolId}
          onChange={(e) => setNewPoolId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPool()}
        />
        <Button variant="secondary" onClick={addPool}>Add Pool</Button>
      </div>

      {Object.keys(local).length === 0 ? (
        <EmptyState icon={Dices} title="No spin pools" description="Add a pool above to configure spin wheel rewards." />
      ) : (
        <div className="space-y-4">
          {Object.entries(local).map(([id, entries]) => (
            <PoolEditor
              key={id}
              poolId={id}
              entries={entries}
              onChange={(e) => setLocal((p) => ({ ...p, [id]: e }))}
              onDelete={() => deletePool(id)}
            />
          ))}
        </div>
      )}

      {Object.keys(local).length > 0 && (
        <Button onClick={handleSave} loading={saving}>
          {saved ? '✓ Saved' : 'Save All Pools'}
        </Button>
      )}
    </div>
  );
}
