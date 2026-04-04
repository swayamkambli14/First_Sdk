import React, { useState } from 'react';
import { Zap, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useRules, Rule } from '../hooks/useRules';
import { rulesApi } from '../lib/api';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

const EVENT_OPTIONS = [
  { value: 'purchase', label: 'purchase' },
  { value: 'referral', label: 'referral' },
  { value: 'feature_usage', label: 'feature_usage' },
  { value: 'milestone', label: 'milestone' },
  { value: 'subscription', label: 'subscription' },
];

const REWARD_TYPES = [
  { value: 'points', label: 'Points' },
  { value: 'badge', label: 'Badge' },
  { value: 'probabilistic', label: 'Spin Wheel' },
];

interface Condition { field: string; op: string; value: string }

interface FormState {
  rule_id: string; name: string; description: string;
  trigger_event: string; logic: 'AND' | 'OR';
  conditions: Condition[];
  reward_type: string; reward_amount: string; reward_badge_id: string; reward_spin_pool: string;
  priority: string; cooldown_hours: string; max_triggers: string;
}

const BLANK: FormState = {
  rule_id: '', name: '', description: '', trigger_event: 'purchase', logic: 'AND',
  conditions: [{ field: 'metadata.amount', op: '>=', value: '50' }],
  reward_type: 'points', reward_amount: '100', reward_badge_id: '', reward_spin_pool: 'default',
  priority: '10', cooldown_hours: '', max_triggers: '',
};

function RuleRow({ rule, onToggle, onDelete }: { rule: Rule; onToggle: () => void; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-gray-600">{rule.ruleId}</td>
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900 text-sm">{rule.name}</div>
        {rule.description && <div className="text-xs text-gray-400 mt-0.5">{rule.description}</div>}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-gray-500">{rule.triggerEvent}</td>
      <td className="px-4 py-3">
        <Badge color={rule.enabled ? 'green' : 'gray'}>{rule.enabled ? 'Active' : 'Disabled'}</Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {rule.enabled ? 'Disable' : 'Enable'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={deleting}
            onClick={async () => { setDeleting(true); await onDelete(); setDeleting(false); }}
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function RuleBuilderPage() {
  const { rules, loading, toggle, remove, refetch } = useRules();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const set = (k: keyof FormState, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const addCondition = () => set('conditions', [...form.conditions, { field: '', op: '==', value: '' }]);
  const removeCondition = (i: number) => set('conditions', form.conditions.filter((_, idx) => idx !== i));
  const updateCondition = (i: number, k: keyof Condition, v: string) =>
    set('conditions', form.conditions.map((c, idx) => idx === i ? { ...c, [k]: v } : c));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rule_id || !form.name) { setSaveError('Rule ID and Name are required'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const rewardConfig =
        form.reward_type === 'points' ? { type: 'points', amount: parseInt(form.reward_amount) || 0 }
        : form.reward_type === 'badge' ? { type: 'badge', badge_id: form.reward_badge_id }
        : { type: 'probabilistic', spin_pool_id: form.reward_spin_pool };

      await rulesApi.create({
        rule_id: form.rule_id,
        name: form.name,
        description: form.description || undefined,
        trigger_event: form.trigger_event,
        conditions: { logic: form.logic, rules: form.conditions },
        reward_config: rewardConfig,
        priority: parseInt(form.priority) || 10,
        cooldown_hours: form.cooldown_hours ? parseInt(form.cooldown_hours) : undefined,
        max_triggers: form.max_triggers ? parseInt(form.max_triggers) : undefined,
      });
      setShowForm(false);
      setForm(BLANK);
      await refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSaveError(msg ?? 'Failed to create rule');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500';

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rule Builder</h1>
          <p className="text-gray-500 text-sm mt-1">Define when and how rewards are issued</p>
        </div>
        <Button onClick={() => { setShowForm(true); setForm(BLANK); setSaveError(''); }}>
          <Plus size={14} /> New Rule
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Create Rule</h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Rule ID *</label>
                  <input className={inputCls} value={form.rule_id} onChange={(e) => set('rule_id', e.target.value)} placeholder="purchase_reward_v1" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Purchase Reward" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional description" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Trigger Event</label>
                  <select className={inputCls} value={form.trigger_event} onChange={(e) => set('trigger_event', e.target.value)}>
                    {EVENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <input type="number" className={inputCls} value={form.priority} onChange={(e) => set('priority', e.target.value)} min={1} max={100} />
                </div>
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Conditions</label>
                  <div className="flex items-center gap-3">
                    <select className="text-xs border border-gray-300 rounded px-2 py-1" value={form.logic} onChange={(e) => set('logic', e.target.value as 'AND' | 'OR')}>
                      <option value="AND">ALL must match (AND)</option>
                      <option value="OR">ANY must match (OR)</option>
                    </select>
                    <Button type="button" variant="secondary" size="sm" onClick={addCondition}>+ Add</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {form.conditions.map((c, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className={`${inputCls} flex-1`} placeholder="metadata.amount" value={c.field} onChange={(e) => updateCondition(i, 'field', e.target.value)} />
                      <select className="border border-gray-300 rounded-lg px-2 py-2 text-sm" value={c.op} onChange={(e) => updateCondition(i, 'op', e.target.value)}>
                        {['==', '!=', '>', '>=', '<', '<=', 'in', 'exists'].map((op) => <option key={op}>{op}</option>)}
                      </select>
                      <input className={`${inputCls} flex-1`} placeholder="50" value={c.value} onChange={(e) => updateCondition(i, 'value', e.target.value)} />
                      {form.conditions.length > 1 && (
                        <button type="button" onClick={() => removeCondition(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reward */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Reward</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Type</label>
                    <select className={inputCls} value={form.reward_type} onChange={(e) => set('reward_type', e.target.value)}>
                      {REWARD_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  {form.reward_type === 'points' && (
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Amount</label>
                      <input type="number" className={inputCls} value={form.reward_amount} onChange={(e) => set('reward_amount', e.target.value)} min={1} />
                    </div>
                  )}
                  {form.reward_type === 'badge' && (
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Badge ID</label>
                      <input className={inputCls} value={form.reward_badge_id} onChange={(e) => set('reward_badge_id', e.target.value)} placeholder="first_purchase" />
                    </div>
                  )}
                  {form.reward_type === 'probabilistic' && (
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Spin Pool ID</label>
                      <input className={inputCls} value={form.reward_spin_pool} onChange={(e) => set('reward_spin_pool', e.target.value)} placeholder="default" />
                    </div>
                  )}
                </div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Cooldown (hours)</label>
                  <input type="number" className={inputCls} value={form.cooldown_hours} onChange={(e) => set('cooldown_hours', e.target.value)} placeholder="Leave blank for none" min={0} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Max Triggers per User</label>
                  <input type="number" className={inputCls} value={form.max_triggers} onChange={(e) => set('max_triggers', e.target.value)} placeholder="Leave blank for unlimited" min={1} />
                </div>
              </div>

              {saveError && <p className="text-red-600 text-sm">{saveError}</p>}

              <div className="flex gap-3">
                <Button type="submit" loading={saving}>Create Rule</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Rules ({rules.length})</h3>
        </CardHeader>
        {loading && rules.length === 0 ? (
          <CardBody>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
            </div>
          </CardBody>
        ) : rules.length === 0 ? (
          <EmptyState icon={Zap} title="No rules yet" description="Create your first rule to start rewarding users." action={<Button onClick={() => setShowForm(true)}><Plus size={14} /> Create Rule</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rule ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <RuleRow
                    key={r.id}
                    rule={r}
                    onToggle={() => toggle(r.ruleId, !r.enabled)}
                    onDelete={() => remove(r.ruleId)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
