import { useState } from 'react';
import { DEMO_LEADERBOARD, DEMO_USER } from '../../lib/mockData';

type Period = 'week' | 'alltime';

const PODIUM_COLORS = ['text-gray-300', 'text-amber-400', 'text-amber-600'];
const PODIUM_LABELS = ['2nd', '1st', '3rd'];
const PODIUM_ORDER = [1, 0, 2]; // display order: 2nd, 1st, 3rd

export default function LeaderboardTab() {
  const [period, setPeriod] = useState<Period>('week');

  const top3 = DEMO_LEADERBOARD.slice(0, 3);
  const rest = DEMO_LEADERBOARD.slice(3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-['Space_Mono'] text-white text-xl font-bold">Leaderboard</h2>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-amber-400/70 border border-amber-400/20 px-2 py-0.5 rounded tracking-widest uppercase">
            Demo Data
          </span>
          {/* Period toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            {(['week', 'alltime'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg font-['Space_Mono'] text-xs transition-all duration-150 min-h-[32px] ${
                  period === p
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {p === 'week' ? 'This Week' : 'All Time'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Podium — desktop only */}
      <div className="hidden lg:flex items-end justify-center gap-4 py-6">
        {PODIUM_ORDER.map((idx) => {
          const entry = top3[idx];
          const isFirst = idx === 0;
          return (
            <div key={idx} className="flex flex-col items-center gap-2">
              {isFirst && <span className="text-2xl">👑</span>}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center font-['Space_Mono'] font-bold text-sm border-2 ${
                  isFirst ? 'border-amber-400/50 bg-amber-400/10 text-amber-400' : 'border-white/20 bg-white/5 text-gray-300'
                }`}
              >
                {entry.wallet.slice(2, 4).toUpperCase()}
              </div>
              <p className="font-mono text-xs text-gray-500">{entry.wallet}</p>
              <p className={`font-['Space_Mono'] font-bold text-sm ${PODIUM_COLORS[idx]}`}>
                {entry.points.toLocaleString()} pts
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

      {/* User rank banner */}
      {DEMO_USER.rank > 20 && (
        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-4 py-3">
          <p className="font-mono text-xs text-cyan-400">
            You are ranked #{DEMO_USER.rank} — keep earning to climb the board!
          </p>
        </div>
      )}

      {/* Full list */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Rank</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Wallet</th>
                <th className="text-right px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Points</th>
                <th className="text-right px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Badges</th>
                <th className="text-right px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {DEMO_LEADERBOARD.map((entry, i) => (
                <tr
                  key={entry.rank}
                  className="hover:bg-white/[0.03] transition-colors"
                  style={{ animation: `fadeIn 300ms ease-out ${i * 50}ms both` }}
                >
                  <td className="px-4 py-3 font-['Space_Mono'] text-sm text-gray-400">
                    #{entry.rank}
                    {entry.rank <= 3 && (
                      <span className="ml-1">{['🥇', '🥈', '🥉'][entry.rank - 1]}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-300">{entry.wallet}</td>
                  <td className="px-4 py-3 text-right font-['Space_Mono'] text-sm font-bold text-amber-400">
                    {entry.points.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-gray-400">{entry.badges}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {entry.change > 0 ? (
                      <span className="text-green-400">↑{entry.change}</span>
                    ) : entry.change < 0 ? (
                      <span className="text-red-400">↓{Math.abs(entry.change)}</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
