import { useEffect, useRef, useState } from 'react';
import { useUserStats } from '../../hooks/useRewardsData';

const TIER_THRESHOLDS: Record<string, { next: string; min: number; max: number }> = {
  bronze:   { next: 'Silver',   min: 0,     max: 500 },
  silver:   { next: 'Gold',     min: 500,   max: 2000 },
  gold:     { next: 'Platinum', min: 2000,  max: 10000 },
  platinum: { next: 'Platinum', min: 10000, max: 10000 },
};

function useCountUp(target: number, active: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, active]);
  return val;
}

export default function StatsRow() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const { stats, loading } = useUserStats();

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const points = stats?.currentPointsBalance ?? 0;
  const tier = (stats?.tier ?? 'bronze').toLowerCase();
  const tierInfo = TIER_THRESHOLDS[tier] ?? TIER_THRESHOLDS['bronze']!;
  const progress = tier === 'platinum' ? 100 :
    Math.min(100, Math.round(((points - tierInfo.min) / (tierInfo.max - tierInfo.min)) * 100));
  const ptsToNext = Math.max(0, tierInfo.max - points);

  const countPts = useCountUp(points, active);
  const countBadges = useCountUp(stats?.badgesCount ?? 0, active);

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Points */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-200">
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">Points Balance</p>
        <p className="font-['Space_Mono'] text-3xl font-bold text-amber-400 mb-1">{countPts.toLocaleString()}</p>
        <p className="text-gray-500 text-xs font-['DM_Sans']">Total Points</p>
      </div>

      {/* Badges */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-200">
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">Badges Earned</p>
        <p className="font-['Space_Mono'] text-3xl font-bold text-white mb-1">{countBadges}</p>
        <p className="text-gray-500 text-xs font-['DM_Sans']">Achievements unlocked</p>
      </div>

      {/* Tier */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-200">
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">Current Tier</p>
        <p className="font-['Space_Mono'] text-3xl font-bold text-gray-300 mb-2 capitalize">{tier}</p>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-1000"
            style={{ width: active ? `${progress}%` : '0%' }}
          />
        </div>
        <p className="text-gray-500 text-xs font-['DM_Sans']">
          {tier === 'platinum' ? 'Max tier reached' : `${ptsToNext.toLocaleString()} pts to ${tierInfo.next}`}
        </p>
      </div>

      {/* Referral code */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-200">
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">Referral Code</p>
        <p className="font-['Space_Mono'] text-lg font-bold text-cyan-400 mb-1 break-all">
          {stats?.referralCode ?? '—'}
        </p>
        <p className="text-gray-500 text-xs font-['DM_Sans']">Share to earn 100 pts</p>
      </div>
    </div>
  );
}
