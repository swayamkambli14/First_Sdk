import { useState } from 'react';
import { useBadges } from '../../hooks/useRewardsData';

const RARITY_COLORS: Record<string, string> = {
  common: 'border-white/10',
  uncommon: 'border-green-500/30',
  rare: 'border-blue-500/30',
  epic: 'border-purple-500/30',
  legendary: 'border-amber-500/40',
};

const BADGE_EMOJIS: Record<string, string> = {
  power_buyer: '💎',
  first_purchase: '🛒',
  top_referrer: '👥',
  power_user: '⚡',
  lucky_subscriber: '🍀',
  tier_silver: '🥈',
  tier_gold: '🥇',
  tier_platinum: '🏆',
};

export default function BadgeGrid() {
  const { badges, loading } = useBadges();
  const [tooltip, setTooltip] = useState<string | null>(null);

  if (loading && badges.length === 0) {
    return (
      <div>
        <h3 className="font-['Space_Mono'] text-white font-bold text-sm mb-4">Earned Badges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 animate-pulse h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div>
        <h3 className="font-['Space_Mono'] text-white font-bold text-sm mb-4">Earned Badges</h3>
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-gray-600 font-mono text-xs">No badges yet — keep earning to unlock them!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-['Space_Mono'] text-white font-bold text-sm mb-4">Earned Badges</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.badge_id}
            className={`relative backdrop-blur-md bg-white/5 border rounded-2xl p-4 transition-all duration-200 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(0,229,255,0.08)] hover:scale-[1.02] cursor-default ${RARITY_COLORS[badge.rarity] ?? 'border-white/10'}`}
            onMouseEnter={() => setTooltip(badge.badge_id)}
            onMouseLeave={() => setTooltip(null)}
          >
            {tooltip === badge.badge_id && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 bg-[#1a1a2e] border border-white/20 rounded-lg px-3 py-1.5 text-xs text-gray-300 font-mono whitespace-nowrap shadow-xl capitalize">
                {badge.rarity} · {new Date(badge.issued_at).toLocaleDateString()}
              </div>
            )}

            <div className="text-3xl mb-3">
              {BADGE_EMOJIS[badge.badge_id] ?? '🏅'}
            </div>
            <p className="font-['Space_Mono'] text-white text-xs font-bold mb-1 leading-tight">
              {badge.badge_name}
            </p>
            <p className="text-gray-500 text-[10px] font-mono mb-2 capitalize">{badge.rarity}</p>
            {badge.on_chain_tx_hash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${badge.on_chain_tx_hash}`}
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
