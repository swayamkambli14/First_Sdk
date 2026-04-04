import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Key, Sparkles, PartyPopper, Loader2 } from 'lucide-react';
import AurumNav from '../components/aurum/AurumNav';
import { useChainLoyaltyAuth } from '../hooks/useChainLoyaltyAuth';
import { useUserStats, useRewardHistory } from '../hooks/useRewardsData';
import { useAurumToast } from '../components/aurum/AurumToast';
import { AURUM_APP_ID } from '../config/aurum';
import axios from 'axios';

interface SpinSegment { label: string; value: number; color: string; weight: number; isBadge?: boolean }

const DEFAULT_SEGMENTS: SpinSegment[] = [
  { label: '50 Gold',    value: 50,   color: '#2D3148', weight: 40 },
  { label: '200 Gold',   value: 200,  color: '#1C1F2E', weight: 25 },
  { label: '500 Gold',   value: 500,  color: '#A07830', weight: 15 },
  { label: 'Suite Life', value: 0,    color: '#C4622D', weight: 5, isBadge: true },
  { label: '1,000 Gold', value: 1000, color: '#C9A84C', weight: 10 },
  { label: '100 Gold',   value: 100,  color: '#2D3148', weight: 30 },
  { label: '250 Gold',   value: 250,  color: '#1C1F2E', weight: 20 },
  { label: '75 Gold',    value: 75,   color: '#A07830', weight: 35 },
];

export default function SpinPage() {
  const navigate = useNavigate();
  const { isAuthenticated, walletAddress } = useChainLoyaltyAuth();
  const { stats, refetch } = useUserStats();
  const { rewards } = useRewardHistory();
  const { showToast, ToastContainer } = useAurumToast();

  const [segments, setSegments] = useState<SpinSegment[]>(DEFAULT_SEGMENTS);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinSegment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [custodialAuth, setCustodialAuth] = useState<boolean | null>(null);
  const [custodialWallet, setCustodialWallet] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Track spins per day using localStorage
  const getSpinsLeft = () => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('aurum_spins');
    if (!stored) return 3;
    try {
      const { date, used } = JSON.parse(stored) as { date: string; used: number };
      if (date !== today) return 3;
      return Math.max(0, 3 - used);
    } catch { return 3; }
  };
  const consumeSpin = () => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('aurum_spins');
    let used = 1;
    try {
      const parsed = JSON.parse(stored ?? '{}') as { date?: string; used?: number };
      used = parsed.date === today ? (parsed.used ?? 0) + 1 : 1;
    } catch {}
    localStorage.setItem('aurum_spins', JSON.stringify({ date: today, used }));
  };
  const [spinsLeft, setSpinsLeft] = useState(getSpinsLeft);

  const balance = stats?.currentPointsBalance ?? 0;
  const canSpin = !spinning && spinsLeft > 0 && balance >= 100;

  useEffect(() => {
    axios.get('/v1/user-auth/me', { withCredentials: true })
      .then((res) => {
        setCustodialAuth(true);
        const d = res.data as { wallet_address?: string };
        if (d.wallet_address) setCustodialWallet(d.wallet_address);
      })
      .catch(() => setCustodialAuth(false));

    // Load real spin pool
    axios.get('/v1/business/spin-pools', {
      headers: { Authorization: `Bearer ${import.meta.env['VITE_API_KEY'] ?? ''}` },
    }).then((r) => {
      const pools = (r.data as { spin_pools: Record<string, SpinSegment[]> }).spin_pools;
      const pool = pools['default'] ?? pools['subscription_pool'] ?? Object.values(pools)[0];
      if (pool?.length) {
        const colors = ['#2D3148','#1C1F2E','#A07830','#C4622D','#C9A84C','#3D4168','#0C0F1E','#B08840'];
        setSegments(pool.map((e, i) => ({
          label: e.isBadge || e.reward_type === 'badge' ? 'Suite Life' : `${(e.amount ?? e.value ?? 0).toLocaleString()} Gold`,
          value: e.amount ?? e.value ?? 0,
          color: colors[i % colors.length]!,
          weight: e.weight,
          isBadge: e.isBadge || (e as unknown as { reward_type?: string }).reward_type === 'badge',
        })));
      }
    }).catch(() => {});
  }, []);

  const isSignedIn = isAuthenticated || custodialAuth === true;
  const effectiveWallet = walletAddress ?? custodialWallet;

  if (custodialAuth === null && !isAuthenticated) {
    return <div className="min-h-screen bg-aurum-midnight flex items-center justify-center"><div className="w-6 h-6 border-2 border-aurum-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-aurum-midnight flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-display text-3xl text-aurum-ivory mb-4">Sign in to Spin</p>
          <Link to="/join" className="btn-gold px-8 py-3 rounded-xl text-sm font-semibold">Join Aurum Circle</Link>
        </div>
      </div>
    );
  }

  const spin = async () => {
    if (!canSpin || !effectiveWallet) return;
    setSpinning(true);

    const totalWeight = segments.reduce((s, seg) => s + seg.weight, 0);
    let rand = Math.random() * totalWeight;
    let winIndex = 0;
    for (let i = 0; i < segments.length; i++) {
      rand -= segments[i]!.weight;
      if (rand <= 0) { winIndex = i; break; }
    }

    const segAngle = 360 / segments.length;
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = extraSpins * 360 + (segments.length - winIndex) * segAngle - segAngle / 2;
    setRotation((r) => r + targetAngle);
    consumeSpin();
    setSpinsLeft(getSpinsLeft());

    setTimeout(async () => {
      setSpinning(false);
      const won = segments[winIndex]!;
      setResult(won);
      setShowModal(true);

      try {
        await axios.post('/v1/events', {
          wallet_address: effectiveWallet,
          event_type: 'subscription',
          metadata: { plan: 'suite_upgrade', spin_result: won.label },
        }, { headers: { Authorization: `Bearer ${import.meta.env['VITE_API_KEY'] ?? ''}` } });
        setTimeout(() => void refetch(), 1500);
      } catch {}
    }, 4000);
  };

  const segAngle = 360 / segments.length;
  const spinHistory = rewards.filter((r) => r.reward_type === 'probabilistic' || r.reason?.toLowerCase().includes('spin'));

  return (
    <div className="min-h-screen bg-aurum-midnight">
      <ToastContainer />
      <AurumNav />

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-aurum-gold text-xs tracking-[0.3em] uppercase mb-3">Aurum Circle</p>
          <h1 className="font-display text-6xl text-aurum-ivory font-light mb-3">
            Spin for <em className="text-aurum-gold">Rewards</em>
          </h1>
          <p className="text-aurum-ivory/50">Each spin costs 100 Gold. Win up to 1,000 Gold or an exclusive badge.</p>
        </div>

        {/* Balance */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <Key size={16} className="text-aurum-gold" />
          <span className="text-aurum-gold font-semibold text-lg">{balance.toLocaleString()} Gold</span>
          <span className="text-aurum-ivory/30">·</span>
          <span className="text-aurum-ivory/50 text-sm">{spinsLeft} spins remaining today</span>
        </div>

        {/* Wheel */}
        <div className="flex flex-col items-center gap-8">
          <div className="relative flex items-center justify-center">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-20">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-aurum-gold drop-shadow-[0_0_8px_rgba(201,168,76,0.8)]" />
            </div>

            {/* Outer ring */}
            <div className="absolute w-[304px] h-[304px] sm:w-[344px] sm:h-[344px] rounded-full border-4 border-aurum-gold/40 shadow-gold" />

            {/* Wheel */}
            <div
              ref={wheelRef}
              className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full overflow-hidden"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
              }}
            >
              {segments.map((seg, i) => {
                const angle = i * segAngle;
                const midAngle = angle + segAngle / 2;
                const rad = (midAngle * Math.PI) / 180;
                const r = 80;
                const tx = 50 + r * Math.sin(rad);
                const ty = 50 - r * Math.cos(rad);
                return (
                  <div key={i} className="absolute inset-0" style={{ background: `conic-gradient(from ${angle}deg, ${seg.color} 0deg, ${seg.color} ${segAngle}deg, transparent ${segAngle}deg)` }}>
                    <div className="absolute font-sans text-[9px] font-bold text-white/90 text-center leading-tight pointer-events-none"
                      style={{ left: `${tx}%`, top: `${ty}%`, transform: `translate(-50%, -50%) rotate(${midAngle}deg)`, width: '52px' }}>
                      {seg.label}
                    </div>
                  </div>
                );
              })}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-aurum-midnight border-2 border-aurum-gold/40 z-10 flex items-center justify-center">
                  <span className="text-aurum-gold text-xs font-display font-semibold">A</span>
                </div>
              </div>
            </div>
          </div>

          {/* Spin button */}
          <button
            onClick={() => void spin()}
            disabled={!canSpin}
            className={`px-12 py-4 font-sans font-bold text-sm rounded-xl transition-all duration-200 min-h-[52px] flex items-center gap-2 ${
              canSpin
                ? 'btn-gold hover:shadow-gold active:scale-[0.97]'
                : 'bg-white/5 text-aurum-ivory/30 cursor-not-allowed border border-white/10'
            }`}
          >
            {spinning ? <><Loader2 size={16} className="animate-spin" /> Spinning...</>
              : !canSpin && balance < 100 ? 'Not Enough Gold'
              : spinsLeft === 0 ? 'No Spins Left Today'
              : 'SPIN (100 Gold)'}
          </button>
        </div>

        {/* Spin history */}
        {spinHistory.length > 0 && (
          <div className="mt-16">
            <h3 className="font-display text-2xl text-aurum-ivory mb-4">Your Previous Spins</h3>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              {spinHistory.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 last:border-0">
                  <span className="text-aurum-ivory/70 text-sm">{r.reason ?? 'Spin reward'}</span>
                  <span className="text-aurum-gold text-sm font-semibold">
                    {r.reward_type === 'points' ? `+${Number((r.reward_value as Record<string, unknown>)['amount'] ?? 0)} Gold` : 'Badge'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Win modal */}
      {showModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-aurum-midnight border border-aurum-gold/40 rounded-3xl p-10 max-w-sm w-full text-center shadow-gold">
            <div className="flex justify-center gap-3 mb-6">
              <Sparkles size={28} className="text-aurum-gold" style={{ animation: 'bounce 0.5s ease 0ms both' }} />
              <PartyPopper size={28} className="text-aurum-terracotta" style={{ animation: 'bounce 0.5s ease 80ms both' }} />
              <Sparkles size={28} className="text-aurum-gold" style={{ animation: 'bounce 0.5s ease 160ms both' }} />
            </div>
            <p className="text-aurum-gold text-xs tracking-widest uppercase mb-2">Aurum Circle</p>
            <h3 className="font-display text-4xl text-aurum-ivory font-light mb-2">You won!</h3>
            <p className="font-display text-5xl text-aurum-gold font-semibold mb-2">{result.label}</p>
            {result.value > 0 && <p className="text-aurum-ivory/50 text-sm mb-6">Added to your Gold balance</p>}
            {result.isBadge && <p className="text-aurum-gold text-sm mb-6">Your exclusive badge will be issued shortly!</p>}
            <button onClick={() => setShowModal(false)} className="w-full btn-gold py-3.5 rounded-xl text-sm font-semibold">
              Wonderful!
            </button>
          </div>
          <style>{`@keyframes bounce { 0%{transform:translateY(0) scale(0);opacity:0} 60%{transform:translateY(-12px) scale(1.2);opacity:1} 100%{transform:translateY(0) scale(1);opacity:1} }`}</style>
        </div>
      )}
    </div>
  );
}
