import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Flame, TrendingDown, Clock, ExternalLink, RefreshCw,
  AlertTriangle, Coins, BarChart2, Shield,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { useOnChainBurn, BURN_TYPE_LABELS } from '../hooks/useOnChainBurn';

// ── Helpers ───────────────────────────────────────────────────────────────────

function abbrev(addr: string) {
  return addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
}

function MetricCard({
  label, value, sub, icon: Icon, color, href,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string; href?: string;
}) {
  return (
    <Card>
      <CardBody className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon size={22} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-cyan-600 hover:text-cyan-500 mt-1 font-mono"
            >
              Etherscan <ExternalLink size={9} />
            </a>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

// ── Burn type badge colors ────────────────────────────────────────────────────

const TYPE_BADGE: Record<number, 'cyan' | 'blue' | 'red' | 'yellow' | 'green'> = {
  0: 'cyan', 1: 'blue', 2: 'red', 3: 'yellow', 4: 'green',
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BurnDashboard() {
  const { data, loading, error, lastRefresh, refetch } = useOnChainBurn();

  // Build a synthetic 7-day chart from window data
  const windowChart = data ? [
    { label: '30d', burned: parseFloat(data.burned30d.replace(/[KM,]/g, '')) },
    { label: '7d',  burned: parseFloat(data.burned7d.replace(/[KM,]/g, '')) },
    { label: '24h', burned: parseFloat(data.burned24h.replace(/[KM,]/g, '')) },
  ] : [];

  if (loading && !data) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Flame size={24} className="text-orange-500" />
            Burn Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Live on-chain data from Sepolia — auto-refreshes every 30s
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={12} /> {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button variant="secondary" size="sm" loading={loading} onClick={refetch}>
            <RefreshCw size={14} /> Refresh
          </Button>
          {data && (
            <a
              href={`https://sepolia.etherscan.io/address/${data.clpAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-500 border border-cyan-200 rounded-lg px-3 py-1.5"
            >
              CLP Contract <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Token stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total CLP Burned"
          value={data?.totalBurned ?? '—'}
          sub="All time"
          icon={Flame}
          color="bg-orange-50 text-orange-500"
          href={data ? `https://sepolia.etherscan.io/address/${data.clpAddress}` : undefined}
        />
        <MetricCard
          label="Total CLP Minted"
          value={data?.totalMinted ?? '—'}
          sub="All time"
          icon={Coins}
          color="bg-cyan-50 text-cyan-500"
        />
        <MetricCard
          label="Deflation Rate"
          value={data ? `${data.deflationPct}%` : '—'}
          sub="Burned / Minted"
          icon={TrendingDown}
          color="bg-red-50 text-red-500"
        />
        <MetricCard
          label="Transfer Burn Rate"
          value={data?.burnRatePct ?? '—'}
          sub="Per transfer (on-chain)"
          icon={Shield}
          color="bg-purple-50 text-purple-500"
        />
      </div>

      {/* Supply stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Circulating Supply"
          value={data?.totalSupply ?? '—'}
          sub={data ? `${data.circulatingPct}% of max` : undefined}
          icon={BarChart2}
          color="bg-blue-50 text-blue-500"
        />
        <MetricCard
          label="Max Supply"
          value={data?.maxSupply ?? '—'}
          sub="Hard cap"
          icon={Coins}
          color="bg-gray-50 text-gray-500"
        />
        <MetricCard
          label="Total Redeemed"
          value={data?.totalRedeemed ?? '—'}
          sub="User redemptions"
          icon={TrendingDown}
          color="bg-green-50 text-green-500"
        />
        <MetricCard
          label="Burn Events"
          value={data?.burnEventsCount.toLocaleString() ?? '—'}
          sub="On-chain records"
          icon={Flame}
          color="bg-amber-50 text-amber-500"
          href={data ? `https://sepolia.etherscan.io/address/${data.trackerAddress}` : undefined}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rolling window bar */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Burn Windows (On-Chain)</h3>
          </CardHeader>
          <CardBody>
            {!data || windowChart.every((w) => w.burned === 0) ? (
              <EmptyState icon={TrendingDown} title="No burns recorded yet" description="Burn events will appear here once users transfer or redeem CLP." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={windowChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="burned"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ fill: '#f97316', r: 5 }}
                    name="CLP Burned"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Burn by type donut */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Burn by Type (On-Chain)</h3>
          </CardHeader>
          <CardBody>
            {!data || data.burnByType.length === 0 ? (
              <EmptyState icon={Flame} title="No burn breakdown yet" description="Breakdown appears once burns are recorded on-chain." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.burnByType}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={3}
                  >
                    {data.burnByType.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
                    formatter={(v) => [`${Number(v ?? 0).toFixed(2)} CLP`, '']}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => <span style={{ fontSize: 11, color: '#6b7280' }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent on-chain burns */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent On-Chain Burns</h3>
            {data && (
              <a
                href={`https://sepolia.etherscan.io/address/${data.trackerAddress}#events`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-500 font-mono"
              >
                View all on Etherscan <ExternalLink size={12} />
              </a>
            )}
          </div>
        </CardHeader>
        {!data || data.recentBurns.length === 0 ? (
          <EmptyState
            icon={Flame}
            title="No burn events yet"
            description="On-chain burns will appear here as users transfer, redeem, or get penalized."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentBurns.map((b, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm text-gray-700">{abbrev(b.wallet)}</td>
                    <td className="px-4 py-3">
                      <Badge color={TYPE_BADGE[b.burnType] ?? 'gray'}>{b.burnTypeLabel}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600 text-sm font-mono">
                      -{b.amount} CLP
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                      {new Date(b.timestamp * 1000).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://sepolia.etherscan.io/address/${b.wallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-cyan-500 transition-colors"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Contract addresses */}
      {data && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Deployed Contracts (Sepolia)</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { name: 'CLoyaltyToken (CLP)', addr: data.clpAddress },
                { name: 'BurnTracker', addr: data.trackerAddress },
                { name: 'BadgeNFT', addr: '0x78c7B78F3ef9f1d5216B74CDd3f56D74862DA9ab' },
                { name: 'ReferralRegistry', addr: '0x4183CBf823E347651bEaAd15546ea1c74BF09D86' },
                { name: 'RewardController', addr: '0x1829b41e296AB98B3cb35B9B41412649c37257da' },
              ].map((c) => (
                <div key={c.addr} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-gray-700">{c.name}</p>
                    <p className="text-xs font-mono text-gray-400">{c.addr}</p>
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/address/${c.addr}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-500 hover:text-cyan-400 ml-3 flex-shrink-0"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
