import { useEffect, useRef, useState } from 'react';
import { DEMO_USER } from '../../lib/mockData';

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

function StatCard({
  label,
  value,
  sub,
  delta,
  accent,
  active,
}: {
  label: string;
  value: number;
  sub: string;
  delta?: string;
  accent?: string;
  active: boolean;
}) {
  const count = useCountUp(value, active);
  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-200">
      <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">{label}</p>
      <p className={`font-['Space_Mono'] text-3xl font-bold mb-1 ${accent ?? 'text-white'}`}>
        {count.toLocaleString()}
      </p>
      {delta && (
        <p className="text-green-400 text-xs font-mono mb-1">{delta}</p>
      )}
      <p className="text-gray-500 text-xs font-['DM_Sans']">{sub}</p>
    </div>
  );
}

export default function StatsRow() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Points Balance"
        value={DEMO_USER.points}
        sub="Total Points"
        delta="+120 this week"
        accent="text-amber-400"
        active={active}
      />
      <StatCard
        label="Badges Earned"
        value={DEMO_USER.badgesCount}
        sub={`${DEMO_USER.onChainBadges} on-chain NFTs`}
        active={active}
      />
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-200">
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">Current Tier</p>
        <p className="font-['Space_Mono'] text-3xl font-bold text-gray-300 mb-2">{DEMO_USER.tier}</p>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-1000"
            style={{ width: active ? `${DEMO_USER.tierProgress}%` : '0%' }}
          />
        </div>
        <p className="text-gray-500 text-xs font-['DM_Sans']">
          {DEMO_USER.pointsToNextTier} pts to {DEMO_USER.nextTier}
        </p>
      </div>
      <StatCard
        label="Referrals"
        value={DEMO_USER.referralsCount}
        sub={`+${DEMO_USER.referralPointsEarned} pts earned`}
        active={active}
      />
    </div>
  );
}
