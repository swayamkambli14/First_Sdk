import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { usersApi, getAppId } from '../lib/api';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

interface UserEntry {
  rank: number;
  wallet_address: string;
  tier: string;
  points: string;
}

const TIER_COLOR: Record<string, 'gray' | 'yellow' | 'cyan' | 'blue'> = {
  bronze: 'gray',
  silver: 'gray',
  gold: 'yellow',
  platinum: 'cyan',
  diamond: 'blue',
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const load = async (p: number) => {
    setLoading(true);
    try {
      const res = await usersApi.list(getAppId(), p, 20);
      setUsers((res.data as { leaderboard: UserEntry[] }).leaderboard ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(page); }, [page]);

  const filtered = search
    ? users.filter((u) => u.wallet_address.toLowerCase().includes(search.toLowerCase()))
    : users;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 text-sm mt-1">All users in your loyalty program</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Search by wallet address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Users ({filtered.length})</h3>
        </CardHeader>
        {loading ? (
          <CardBody>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
            </div>
          </CardBody>
        ) : filtered.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No users yet" description="Users appear here once they connect their wallet and earn rewards." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.wallet_address} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">#{u.rank}</td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-700">{u.wallet_address}</td>
                    <td className="px-4 py-3">
                      <Badge color={TIER_COLOR[u.tier] ?? 'gray'}>{u.tier}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-cyan-600 text-sm">
                      {parseInt(u.points).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="flex items-center gap-1 px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <span className="px-4 py-2 text-sm text-gray-500">Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={filtered.length < 20}
          className="flex items-center gap-1 px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
