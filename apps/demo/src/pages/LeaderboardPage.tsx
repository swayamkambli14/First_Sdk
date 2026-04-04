import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useChainLoyaltyAuth } from '../hooks/useChainLoyaltyAuth';

const APP_ID = import.meta.env['VITE_APP_ID'] ?? 'demo-app-id';
type Period = 'all_time' | 'monthly' | 'weekly';

interface LeaderboardEntry {
  rank: number;
  wallet_address: string;
  tier: string;
  points: string;
}

const TIER_COLORS: Record<string, string> = {
  bronze: 'text-orange-400',
  silver: 'text-gray-300',
  gold: 'text-yellow-400',
  platinum: 'text-cyan-400',
};

export default function LeaderboardPage() {
  const { walletAddress } = useChainLoyaltyAuth();
  const [period, setPeriod] = useState<Period>('all_time');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async (p: Period) => {
    setLoading(true);
    try {
      const res = await axios.get(`/v1/leaderboard?app_id=${APP_ID}&period=${p}&limit=10`);
      setEntries((res.data as { leaderboard: LeaderboardEntry[] }).leaderboard);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLeaderboard(period);
    // Auto-refresh every 60 seconds — matches server cache TTL
    const interval = setInterval(() => void fetchLeaderboard(period), 60_000);
    return () => clearInterval(interval);
  }, [period]);

  const abbrev = (addr: string) => addr;

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
        <Link to="/dashboard" className="text-purple-400 hover:text-purple-300 text-sm">← Dashboard</Link>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 mb-6">
        {(['all_time', 'monthly', 'weekly'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {p === 'all_time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Leaderboard table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No data yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-sm">
                <th className="text-left p-4">Rank</th>
                <th className="text-left p-4">Wallet</th>
                <th className="text-left p-4">Tier</th>
                <th className="text-right p-4">Points</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isCurrentUser =
                  walletAddress &&
                  entry.wallet_address.toLowerCase().includes(walletAddress.slice(2, 6).toLowerCase());
                return (
                  <tr
                    key={entry.rank}
                    className={`border-b border-gray-800 last:border-0 ${
                      isCurrentUser ? 'bg-purple-900/20' : 'hover:bg-gray-800/50'
                    }`}
                  >
                    <td className="p-4 text-gray-400 font-mono">#{entry.rank}</td>
                    <td className="p-4 font-mono text-sm text-gray-200">
                      {entry.wallet_address}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs bg-purple-800 text-purple-300 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </td>
                    <td className={`p-4 capitalize font-medium ${TIER_COLORS[entry.tier] ?? 'text-gray-400'}`}>
                      {entry.tier}
                    </td>
                    <td className="p-4 text-right font-bold text-yellow-400">
                      {parseInt(entry.points).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
