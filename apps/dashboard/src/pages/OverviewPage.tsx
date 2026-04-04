import React, { useState, useEffect } from 'react';
import { Users, Gift, Zap, Trophy, BarChart2, Key, Copy, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAuth } from '../lib/auth';
import { companyApi } from '../lib/api';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

function MetricCard({ label, value, icon: Icon, sub, color }: { label: string; value: string | number; icon: LucideIcon; sub?: string; color: string }) {
  return (
    <Card>
      <CardBody className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  );
}

export default function OverviewPage() {
  const { data, loading } = useAnalytics();
  const { companyToken } = useAuth();

  // API key state
  const [keyMeta, setKeyMeta] = useState<{ has_key: boolean; api_key_prefix: string | null; created_at: string | null } | null>(null);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!companyToken) return;
    companyApi.getApiKey(companyToken)
      .then((r) => setKeyMeta(r.data as typeof keyMeta))
      .catch(() => {});
  }, [companyToken]);

  const handleGenerate = async () => {
    if (!companyToken) return;
    setGenerating(true);
    setShowConfirm(false);
    try {
      const r = await companyApi.generateApiKey(companyToken);
      const d = r.data as { api_key: string; api_key_prefix: string; created_at: string };
      setRawKey(d.api_key);
      setKeyMeta({ has_key: true, api_key_prefix: `${d.api_key_prefix}...`, created_at: d.created_at });
    } finally {
      setGenerating(false);
    }
  };

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && !data) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const topRule = data?.top_rules[0];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Your loyalty program at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Users" value={data?.total_users ?? 0} icon={Users} sub="All time" color="bg-blue-50 text-blue-500" />
        <MetricCard label="Rewards Issued" value={data?.total_rewards_issued ?? 0} icon={Gift} sub="All time" color="bg-purple-50 text-purple-500" />
        <MetricCard label="Events (7d)" value={data?.events_last_7_days ?? 0} icon={Zap} sub="Last 7 days" color="bg-amber-50 text-amber-500" />
        <MetricCard
          label="Top Rule"
          value={topRule ? `${topRule.fires} fires` : '—'}
          icon={Trophy}
          sub={topRule?.rule_id ?? 'No rules yet'}
          color="bg-cyan-50 text-cyan-500"
        />
      </div>

      {/* API Key section — only shown for company-auth users */}
      {companyToken && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Key size={16} className="text-cyan-600" /> API Key
              </h3>
              {keyMeta?.has_key && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowConfirm(true)}
                  loading={generating}
                >
                  <RefreshCw size={13} /> Rotate Key
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {/* Newly generated key — show once */}
            {rawKey && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 font-medium">Save this key now — it won't be shown again.</p>
                </div>
                <div className="flex items-center gap-3 bg-white border border-amber-200 rounded-lg px-4 py-3">
                  <code className="flex-1 text-sm font-mono text-gray-800 break-all">{rawKey}</code>
                  <button
                    onClick={() => copy(rawKey)}
                    className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-medium flex-shrink-0"
                  >
                    {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                  </button>
                </div>
                <button
                  onClick={() => setRawKey(null)}
                  className="mt-2 text-xs text-amber-600 hover:text-amber-800"
                >
                  I've saved it — dismiss
                </button>
              </div>
            )}

            {/* Key metadata */}
            {keyMeta?.has_key && !rawKey ? (
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Active API Key</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {keyMeta.api_key_prefix}{'*'.repeat(48)}
                  </p>
                  {keyMeta.created_at && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Generated {new Date(keyMeta.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>
            ) : !rawKey && (
              <div className="text-center py-6">
                <Key size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">No API key yet. Generate one to start integrating.</p>
                <Button onClick={handleGenerate} loading={generating}>
                  <Key size={14} /> Generate API Key
                </Button>
              </div>
            )}

            {/* Confirm rotate modal */}
            {showConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Rotate API Key?</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Your current key will be invalidated immediately. Any integrations using it will break until updated.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setShowConfirm(false)} className="flex-1 justify-center">Cancel</Button>
                    <Button variant="danger" onClick={handleGenerate} loading={generating} className="flex-1 justify-center">Rotate</Button>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Tier Distribution</h3>
          </CardHeader>
          <CardBody>
            {!data || data.tier_distribution.length === 0 ? (
              <EmptyState icon={BarChart2} title="No data yet" description="Users will appear here once they start earning rewards." />
            ) : (
              <div className="space-y-3">
                {data.tier_distribution.map((t) => {
                  const total = data.tier_distribution.reduce((s, x) => s + x.count, 0);
                  const pct = total > 0 ? Math.round((t.count / total) * 100) : 0;
                  return (
                    <div key={t.tier}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize font-medium text-gray-700">{t.tier}</span>
                        <span className="text-gray-500">{t.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Top Rules by Fires</h3>
          </CardHeader>
          <CardBody>
            {!data || data.top_rules.length === 0 ? (
              <EmptyState icon={Zap} title="No rules fired yet" description="Create rules and they'll appear here once they start triggering." />
            ) : (
              <div className="space-y-2">
                {data.top_rules.map((r, i) => (
                  <div key={r.rule_id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm font-mono w-5">#{i + 1}</span>
                      <span className="text-sm font-medium text-gray-700 font-mono">{r.rule_id}</span>
                    </div>
                    <span className="text-sm font-bold text-cyan-600">{r.fires.toLocaleString()} fires</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
