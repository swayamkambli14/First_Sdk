import { useState, useEffect } from 'react';
import axios from 'axios';
import { useChainLoyaltyAuth } from '../hooks/useChainLoyaltyAuth';
import AurumNav from '../components/aurum/AurumNav';
import { AURUM_TIER_NAMES } from '../config/aurum';

const APP_ID = import.meta.env['VITE_APP_ID'] ?? '';
type Period = 'all_time' | 'monthly' | 'weekly';

interface LeaderboardEntry {
  rank: number;
  wallet_address: string;
  tier: string;
  points: string;
}

const PERIOD_LABELS: Record<Period, string> = {
  all_time: 'All Time',
  monthly: 'This Month',
  weekly: 'This Week',
};

export default function LeaderboardPage() {
  const { walletAddress } = useChainLoyaltyAuth();
  const [period, setPeriod] = useState<Period>('all_time');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async (p: Period) => {
    setLoading(true);
    try {
      const res = await axios.get(`/v1/leaderboard?app_id=${APP_ID}&period=${p}&limit=20`);
      setEntries((res.data as { leaderboard: LeaderboardEntry[] }).leaderboard ?? []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLeaderboard(period);
    const interval = setInterval(() => void fetchLeaderboard(period), 60_000);
    return () => clearInterval(interval);
  }, [period]);

  const abbrevWallet = (addr: string) =>
    addr.startsWith('0x') ? `Guest ${addr.slice(2, 5).toUpperCase()}` : addr.split('@')[0] ?? addr;

  const isMe = (addr: string) =>
    walletAddress && addr.toLowerCase() === walletAddress.toLowerCase();

  const RANK_STYLES = ['text-aurum-gold', 'text-gray-400', 'text-amber-700'];

  return (
    <div className="min-h-screen bg-aurum-ivory">
      <AurumNav />

      <div className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8">
          <p className="text-aurum-gold text-xs tracking-[0.3em] uppercase mb-2">Aurum Circle</p>
          <h1 className="font-display text-4xl text-aurum-midnight font-light">
            Top <em className="text-aurum-gold">Guests</em>
          </h1>
        </div>

        {/* Period tabs */}
        <div className="flex bg-white rounded-xl p-1 shadow-card mb-6 gap-1 w-fit">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? 'bg-aurum-midnight text-aurum-ivory shadow-sm'
                  : 'text-aurum-text-secondary hover:text-aurum-midnight'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-6 h-6 border-2 border-aurum-gold border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-aurum-text-secondary">
              No guests on the leaderboard yet — be the first!
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-aurum-text-secondary uppercase tracking-wider">Rank</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-aurum-text-secondary uppercase tracking-wider">Guest</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-aurum-text-secondary uppercase tracking-wider">Tier</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-aurum-text-secondary uppercase tracking-wider">Gold</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.rank}
                    className={`border-b border-gray-50 last:border-0 transition-colors ${
                      isMe(entry.wallet_address) ? 'bg-aurum-gold/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <span className={`font-display text-xl font-light ${RANK_STYLES[entry.rank - 1] ?? 'text-aurum-text-secondary'}`}>
                        #{entry.rank}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-aurum-midnight text-sm font-medium">
                        {abbrevWallet(entry.wallet_address)}
                      </span>
                      {isMe(entry.wallet_address) && (
                        <span className="ml-2 text-[10px] bg-aurum-gold/20 text-aurum-gold px-2 py-0.5 rounded-full font-semibold">You</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-aurum-text-secondary text-sm">
                      {AURUM_TIER_NAMES[entry.tier] ?? entry.tier}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-aurum-gold">
                      {parseInt(entry.points).toLocaleString()} Gold
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
