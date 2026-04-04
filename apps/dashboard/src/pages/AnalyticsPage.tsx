import React from 'react';
import { Users, Gift, Zap, BarChart2, RefreshCw } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export default function AnalyticsPage() {
  const { data, loading, refetch } = useAnalytics();

  if (loading && !data) {
    return (
      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-white rounded-xl border border-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Program performance metrics</p>
        </div>
        <Button variant="secondary" size="sm" onClick={refetch}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Users',     value: data?.total_users ?? 0,           icon: Users,    color: 'bg-blue-50 text-blue-500' },
          { label: 'Rewards Issued',  value: data?.total_rewards_issued ?? 0,  icon: Gift,     color: 'bg-purple-50 text-purple-500' },
          { label: 'Events (7d)',     value: data?.events_last_7_days ?? 0,    icon: Zap,      color: 'bg-amber-50 text-amber-500' },
        ].map((m) => (
          <Card key={m.label}>
            <CardBody className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${m.color}`}>
                <m.icon size={22} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{m.label}</p>
                <p className="text-2xl font-bold text-gray-900">{m.value.toLocaleString()}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier distribution bar chart */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Tier Distribution</h3>
          </CardHeader>
          <CardBody>
            {!data || data.tier_distribution.length === 0 ? (
              <EmptyState icon={BarChart2} title="No data" description="Users will appear here once they earn rewards." />
            ) : (
              <div className="space-y-4">
                {data.tier_distribution.map((t) => {
                  const total = data.tier_distribution.reduce((s, x) => s + x.count, 0);
                  const pct = total > 0 ? (t.count / total) * 100 : 0;
                  return (
                    <div key={t.tier}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="capitalize font-medium text-gray-700">{t.tier}</span>
                        <span className="text-gray-500">{t.count} users · {pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Top rules */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Top Rules by Fires</h3>
          </CardHeader>
          <CardBody>
            {!data || data.top_rules.length === 0 ? (
              <EmptyState icon={Zap} title="No rule fires yet" description="Rules will appear here once they start triggering." />
            ) : (
              <div className="space-y-3">
                {data.top_rules.map((r, i) => {
                  const max = data.top_rules[0]?.fires ?? 1;
                  const pct = (r.fires / max) * 100;
                  return (
                    <div key={r.rule_id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-mono text-gray-700 text-xs">
                          <span className="text-gray-400 mr-2">#{i + 1}</span>
                          {r.rule_id}
                        </span>
                        <span className="font-bold text-cyan-600">{r.fires.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
