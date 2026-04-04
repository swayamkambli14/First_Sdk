import { useState } from 'react';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';
import { useRewardHistory } from '../../hooks/useRewardsData';

type Filter = 'all' | 'points' | 'badge';

function typeIcon(rewardType: string) {
  if (rewardType === 'badge') return <Award size={14} className="text-cyan-400" />;
  return <TrendingUp size={14} className="text-amber-400" />;
}

export default function PointsHistoryTable() {
  const [filter, setFilter] = useState<Filter>('all');
  const { rewards, loading } = useRewardHistory();

  const filtered = rewards.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'points') return r.reward_type === 'points';
    if (filter === 'badge') return r.reward_type === 'badge';
    return true;
  });

  if (loading && rewards.length === 0) {
    return (
      <div>
        <h3 className="font-['Space_Mono'] text-white font-bold text-sm mb-4">Points History</h3>
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 animate-pulse h-40" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-['Space_Mono'] text-white font-bold text-sm">Points History</h3>
        <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          {(['all', 'points', 'badge'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-mono capitalize transition-colors min-h-[32px] ${
                filter === f ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-600 font-mono text-xs">
            No history yet — start earning rewards!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Date</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Event</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Type</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((row) => {
                  const val = row.reward_value as Record<string, unknown>;
                  const pts = row.reward_type === 'points' ? Number(val['amount'] ?? 0) : 0;
                  const badgeName = row.reward_type === 'badge'
                    ? String(val['badge_name'] ?? val['badge_id'] ?? 'Badge')
                    : null;
                  return (
                    <tr key={row.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {new Date(row.issued_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-['DM_Sans'] text-sm text-gray-300 max-w-[200px] truncate">
                        {row.reason || row.reward_type}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {typeIcon(row.reward_type)}
                          <span className="font-mono text-[10px] text-gray-500 capitalize">{row.reward_type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-['Space_Mono'] text-sm font-bold">
                        {pts > 0 ? (
                          <span className="text-amber-400">+{pts.toLocaleString()}</span>
                        ) : badgeName ? (
                          <span className="text-cyan-400 text-xs">{badgeName}</span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
