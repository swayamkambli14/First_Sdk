import { useState } from 'react';
import { useLeaderboard } from '../../hooks/useRewardsData';
import { useChainLoyaltyAuth } from '../../hooks/useChainLoyaltyAuth';

type Period = 'all_time' | 'monthly' | 'weekly';

export default function LeaderboardTab() {
  const [period, setPeriod] = useState<Period>('all_time');
  const { entries, loading } = useLeaderboard(period);
  const { walletAddress } = useChainLoyaltyAuth();

  const top3 = entries.slice(0, 3);
  const PODIUM_ORDER = [1, 0, 2];
  const PODIUM_LABELS = ['2nd', '1st', '3rd'];
  const PODIUM_COLORS = ['text-gray-300', 'text-amber-400', 'text-amber-600'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-['Space_Mono'] text-white text-xl font-bold">Leaderboard</h2>
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
          {(['all_time', 'monthly', 'weekly'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg font-['Space_Mono'] text-xs transition-all duration-150 min-h-[32px] ${
                period === p
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {p === 'all_time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Podium — desktop only */}
      {top3.length >= 3 && (
        <div className="hidden lg:flex items-end justify-center gap-4 py-6">
          {PODIUM_ORDER.map((idx) => {
            const entry = top3[idx];
            if (!entry) return null;
            const isFirst = idx === 0;
            return (
              <div key={idx} className="flex flex-col items-center gap-2">
                {isFirst && <span className="text-2xl">👑</span>}
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center font-['Space_Mono'] font-bold text-sm border-2 ${
                    isFirst ? 'border-amber-400/50 bg-amber-400/10 text-amber-400' : 'border-white/20 bg-white/5 text-gray-300'
                  }`}
                >
                  {entry.wallet_address.slice(2, 4).toUpperCase()}
                </div>
                <p className="font-mono text-xs text-gray-500">{entry.wallet_address}</p>
                <p className={`font-['Space_Mono'] font-bold text-sm ${PODIUM_COLORS[idx]}`}>
                  {parseInt(entry.points).toLocaleString()} pts
                </p>
                <div
                  className={`w-24 rounded-t-lg flex items-center justify-center font-mono text-xs text-gray-400 ${
                    isFirst ? 'h-20 bg-amber-400/10 border border-amber-400/20' : 'h-12 bg-white/5 border border-white/10'
                  }`}
                >
                  {PODIUM_LABELS[idx]}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {loading && entries.length === 0 ? (
          <div className="p-8 text-center text-gray-600 font-mono text-xs animate-pulse">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-600 font-mono text-xs">No data yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Rank</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Wallet</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Tier</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {entries.map((entry, i) => {
                  const isMe = walletAddress &&
                    entry.wallet_address.toLowerCase() === walletAddress.toLowerCase();
                  return (
                    <tr
                      key={entry.rank}
                      className={`transition-colors ${isMe ? 'bg-cyan-500/5' : 'hover:bg-white/[0.03]'}`}
                      style={{ animation: `fadeIn 300ms ease-out ${i * 40}ms both` }}
                    >
                      <td className="px-4 py-3 font-['Space_Mono'] text-sm text-gray-400">
                        #{entry.rank}
                        {entry.rank <= 3 && <span className="ml-1">{['🥇', '🥈', '🥉'][entry.rank - 1]}</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-300">
                        {entry.wallet_address}
                        {isMe && (
                          <span className="ml-2 text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 capitalize">{entry.tier}</td>
                      <td className="px-4 py-3 text-right font-['Space_Mono'] text-sm font-bold text-amber-400">
                        {parseInt(entry.points).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
