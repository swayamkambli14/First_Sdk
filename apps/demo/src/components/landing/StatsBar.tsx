import { useEffect, useRef, useState } from 'react';

const stats = [
  { value: 12400, suffix: '+', label: 'Wallets Connected' },
  { value: 3.2, suffix: 'M', label: 'Points Issued', isDecimal: true },
  { value: 48000, suffix: '', label: 'Badges Minted', format: (v: number) => `${(v / 1000).toFixed(0)}K` },
  { value: 180000, suffix: '', label: 'USD Redeemed', prefix: '$', format: (v: number) => `$${(v / 1000).toFixed(0)}K` },
];

function useCountUp(target: number, duration = 1800, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);
  return count;
}

function StatItem({ stat, active }: { stat: typeof stats[0]; active: boolean }) {
  const count = useCountUp(stat.value, 1800, active);

  const display = () => {
    if (stat.format) return stat.format(count);
    if (stat.isDecimal) return `${count.toFixed(1)}${stat.suffix}`;
    return `${Math.floor(count).toLocaleString()}${stat.suffix}`;
  };

  return (
    <div className="text-center px-8 py-2">
      <div className="font-['Space_Mono'] text-3xl font-bold text-white mb-1">
        {display()}
      </div>
      <div className="font-['DM_Sans'] text-gray-500 text-sm">{stat.label}</div>
    </div>
  );
}

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-[#0d0d14] border-y border-white/5 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-end mb-6">
          <span className="font-mono text-[10px] text-amber-400/70 border border-amber-400/20 px-2 py-0.5 rounded tracking-widest uppercase">
            Demo Data
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-x-0 lg:divide-x divide-white/5">
          {stats.map((s) => (
            <StatItem key={s.label} stat={s} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
