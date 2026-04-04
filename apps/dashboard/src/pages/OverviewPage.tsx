import React from 'react';
import { Users, Gift, Zap, Trophy, BarChart2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
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
