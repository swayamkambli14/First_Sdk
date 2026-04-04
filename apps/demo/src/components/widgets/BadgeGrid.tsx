import { useState } from 'react';
import { DEMO_BADGES } from '../../lib/mockData';

export default function BadgeGrid() {
  const [tooltip, setTooltip] = useState<string | null>(null);

  return (
    <div>
      <h3 className="font-['Space_Mono'] text-white font-bold text-sm mb-4">Earned Badges</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {DEMO_BADGES.map((badge) => (
          <div
            key={badge.id}
            className={`relative backdrop-blur-md border rounded-2xl p-4 transition-all duration-200 ${
              badge.locked
                ? 'bg-white/[0.02] border-white/5 grayscale opacity-50'
                : 'bg-white/5 border-white/10 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(0,229,255,0.08)] hover:scale-[1.02] cursor-default'
            }`}
            onMouseEnter={() => badge.locked && setTooltip(badge.id)}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Locked overlay */}
            {badge.locked && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/40 z-10">
                <div className="text-center">
                  <span className="text-2xl">🔒</span>
                  <p className="text-gray-400 text-xs font-mono mt-1">Locked</p>
                </div>
              </div>
            )}

            {/* Tooltip */}
            {badge.locked && tooltip === badge.id && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 bg-[#1a1a2e] border border-white/20 rounded-lg px-3 py-1.5 text-xs text-gray-300 font-mono whitespace-nowrap shadow-xl">
                How to earn: {badge.howToEarn}
              </div>
            )}

            <div className="text-3xl mb-3">{badge.emoji}</div>
            <p className="font-['Space_Mono'] text-white text-xs font-bold mb-1 leading-tight">
              {badge.name}
            </p>
            {badge.earnedAt && (
              <p className="text-gray-500 text-[10px] font-mono mb-2">{badge.earnedAt}</p>
            )}
            {badge.onChain && badge.txHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${badge.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 text-[10px] font-mono hover:text-cyan-300 transition-colors"
              >
                View on Chain →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
