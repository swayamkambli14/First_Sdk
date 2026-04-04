import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Flame, Coins } from 'lucide-react';
import { useUserStats } from '../../hooks/useRewardsData';
import { useChainData } from '../../hooks/useChainData';
import { useChainLoyaltyAuth } from '../../hooks/useChainLoyaltyAuth';
import { InfoTooltip } from '../ui/Tooltip';

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
  const { walletAddress } = useChainLoyaltyAuth();
  const { data: chain } = useChainData(walletAddress);

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
    <div ref={ref} className="space-y-4">
      {/* Row 1: off-chain stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Points */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-200">
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">Points Balance</p>
          <p className="font-['Space_Mono'] text-3xl font-bold text-amber-400 mb-1">{countPts.toLocaleString()}</p>
          <p className="text-gray-500 text-xs font-['DM_Sans']">Your balance</p>
        </div>

        {/* Badges */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-200">
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2 flex items-center">
            Badges Earned
            <InfoTooltip text="Special achievements you've unlocked. Each one is unique to you." />
          </p>
          <p className="font-['Space_Mono'] text-3xl font-bold text-white mb-1">{countBadges}</p>
          <p className="text-gray-500 text-xs font-['DM_Sans']">Achievements unlocked</p>
        </div>

        {/* Tier */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-200">
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2 flex items-center">
            Current Tier
            <InfoTooltip text="Your loyalty level. Earn more points to level up and get bigger rewards." />
          </p>
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
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2 flex items-center">
            Referral Code
            <InfoTooltip text="Share this link with friends. When they join and make their first purchase, you both earn bonus points." />
          </p>
          <p className="font-['Space_Mono'] text-lg font-bold text-cyan-400 mb-1 break-all">
            {stats?.referralCode ?? '—'}
          </p>
          <p className="text-gray-500 text-xs font-['DM_Sans']">Share to earn 100 pts</p>
        </div>
      </div>

      {/* Row 2: on-chain stats (only shown when wallet connected) */}
      {walletAddress && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CLP balance */}
          <div className="backdrop-blur-md bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-5 hover:border-cyan-500/40 transition-all duration-200">
            <div className="flex items-center gap-1.5 mb-2">
              <Coins size={12} className="text-cyan-400" />
              <p className="font-mono text-xs text-cyan-400/70 uppercase tracking-widest">Verified Balance</p>
            </div>
            <p className="font-['Space_Mono'] text-2xl font-bold text-cyan-400 mb-1">
              {chain?.clpBalance ?? '—'}
            </p>
            <a
              href={`https://sepolia.etherscan.io/token/0xC272844F17f4ce599474373c05A6B1AD98A7B8b4?a=${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-cyan-400/60 hover:text-cyan-400 font-mono transition-colors"
            >
              View verification <ExternalLink size={10} />
            </a>
          </div>

          {/* Redeemed */}
          <div className="backdrop-blur-md bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 hover:border-orange-500/40 transition-all duration-200">
            <div className="flex items-center gap-1.5 mb-2">
              <Flame size={12} className="text-orange-400" />
              <p className="font-mono text-xs text-orange-400/70 uppercase tracking-widest">Redeemed</p>
            </div>
            <p className="font-['Space_Mono'] text-2xl font-bold text-orange-400 mb-1">
              {chain?.userBurned ?? '—'}
            </p>
            <p className="text-gray-500 text-[10px] font-mono">Points used all time</p>
          </div>

          {/* Loyalty level */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-200">
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">Loyalty Level</p>
            <p className="font-['Space_Mono'] text-2xl font-bold text-purple-400 mb-1">
              {chain?.burnRatePct ?? '—'}
            </p>
            <p className="text-gray-500 text-[10px] font-mono">Bonus rate on rewards</p>
          </div>

          {/* Friends referred */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-200">
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">Friends Referred</p>
            <p className="font-['Space_Mono'] text-2xl font-bold text-green-400 mb-1">
              {chain?.onChainReferralCount ?? '—'}
            </p>
            <p className="text-gray-500 text-[10px] font-mono">
              {chain?.referredBy ? `Referred by a friend` : 'Share your link to earn more'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
