import { DEMO_ACTIVITY } from '../../lib/mockData';

export default function ActivityFeed() {
  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-['Space_Mono'] text-white font-bold text-sm">Recent Activity</h3>
        <span className="font-mono text-[10px] text-gray-600">LIVE FEED</span>
      </div>

      <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
        {DEMO_ACTIVITY.map((item, i) => (
          <div
            key={item.id}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors"
            style={{ animation: `fadeIn 300ms ease-out ${i * 50}ms both` }}
          >
            <span className="text-xl w-8 text-center flex-shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-['DM_Sans'] text-white text-sm truncate">{item.description}</p>
              <p className="font-['DM_Sans'] text-gray-500 text-xs truncate">{item.source}</p>
            </div>
            <div className="text-right flex-shrink-0">
              {item.points !== 0 && (
                <p
                  className={`font-['Space_Mono'] text-sm font-bold ${
                    item.points > 0 ? 'text-amber-400' : 'text-red-400'
                  }`}
                >
                  {item.points > 0 ? '+' : ''}{item.points} pts
                </p>
              )}
              <p className="text-gray-600 text-xs font-mono">{item.time}</p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
