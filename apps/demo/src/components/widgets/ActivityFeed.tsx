import { useRewardHistory } from '../../hooks/useRewardsData';

function rewardIcon(type: string, value: Record<string, unknown>): string {
  if (type === 'badge') return '🏅';
  if (type === 'probabilistic') return '🎰';
  const amt = Number(value['amount'] ?? 0);
  if (amt >= 200) return '🎯';
  return '⚡';
}

export default function ActivityFeed() {
  const { rewards, loading } = useRewardHistory();

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-['Space_Mono'] text-white font-bold text-sm">Recent Activity</h3>
        <span className="font-mono text-[10px] text-gray-600">LIVE FEED</span>
      </div>

      {loading && rewards.length === 0 ? (
        <div className="p-8 text-center text-gray-600 font-mono text-xs animate-pulse">Loading...</div>
      ) : rewards.length === 0 ? (
        <div className="p-8 text-center text-gray-600 font-mono text-xs">
          No activity yet — start earning rewards!
        </div>
      ) : (
        <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
          {rewards.map((item, i) => {
            const val = item.reward_value as Record<string, unknown>;
            const pts = item.reward_type === 'points' ? Number(val['amount'] ?? 0) : 0;
            const timeAgo = new Date(item.issued_at).toLocaleDateString();
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors"
                style={{ animation: `fadeIn 300ms ease-out ${i * 50}ms both` }}
              >
                <span className="text-xl w-8 text-center flex-shrink-0">
                  {rewardIcon(item.reward_type, val)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-['DM_Sans'] text-white text-sm truncate">
                    {item.reason ?? item.reward_type}
                  </p>
                  <p className="font-['DM_Sans'] text-gray-500 text-xs truncate capitalize">
                    {item.reward_type}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {pts > 0 && (
                    <p className="font-['Space_Mono'] text-sm font-bold text-amber-400">+{pts} pts</p>
                  )}
                  {item.reward_type === 'badge' && (
                    <p className="font-['Space_Mono'] text-sm font-bold text-cyan-400">
                      {String(val['badge_name'] ?? val['badge_id'] ?? 'Badge')}
                    </p>
                  )}
                  <p className="text-gray-600 text-xs font-mono">{timeAgo}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
