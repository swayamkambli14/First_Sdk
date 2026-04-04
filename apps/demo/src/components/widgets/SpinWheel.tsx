import { useState, useRef, useEffect } from 'react';
import { Sparkles, PartyPopper, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useUserStats, fireEvent } from '../../hooks/useRewardsData';
import { useChainLoyaltyAuth } from '../../hooks/useChainLoyaltyAuth';

const APP_ID = import.meta.env['VITE_APP_ID'] ?? 'demo-app-id';

interface SpinSegment {
  label: string;
  value: number;
  color: string;
  isBadge?: boolean;
  weight: number;
}

// Fallback segments if API pool not loaded
const FALLBACK_SEGMENTS: SpinSegment[] = [
  { label: '50 pts',  value: 50,  color: '#1a3a4a', weight: 30 },
  { label: '100 pts', value: 100, color: '#0a2a3a', weight: 25 },
  { label: '200 pts', value: 200, color: '#003344', weight: 15 },
  { label: 'Badge',   value: 0,   color: '#2a1a00', weight: 5, isBadge: true },
  { label: '500 pts', value: 500, color: '#004455', weight: 10 },
  { label: '50 pts',  value: 50,  color: '#1a3a4a', weight: 30 },
  { label: '100 pts', value: 100, color: '#0a2a3a', weight: 25 },
  { label: '200 pts', value: 200, color: '#003344', weight: 15 },
];

function poolToSegments(pool: Array<{ reward_type: string; amount?: number; badge_id?: string; weight: number }>): SpinSegment[] {
  const colors = ['#1a3a4a', '#0a2a3a', '#003344', '#2a1a00', '#004455', '#1a2a00', '#0d3344', '#002233'];
  return pool.map((entry, i) => ({
    label: entry.reward_type === 'badge'
      ? `Badge`
      : `${(entry.amount ?? 0).toLocaleString()} pts`,
    value: entry.amount ?? 0,
    color: colors[i % colors.length]!,
    isBadge: entry.reward_type === 'badge',
    weight: entry.weight,
  }));
}

export default function SpinWheel() {
  const { walletAddress, isAuthenticated } = useChainLoyaltyAuth();
  const { stats, refetch } = useUserStats();
  const [segments, setSegments] = useState<SpinSegment[]>(FALLBACK_SEGMENTS);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinSegment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [spinsLeft, setSpinsLeft] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const balance = stats?.currentPointsBalance ?? 0;
  const canSpin = !spinning && spinsLeft > 0 && balance >= 100 && isAuthenticated;

  // Load real spin pool from API
  useEffect(() => {
    axios.get('/v1/business/spin-pools', {
      headers: { Authorization: `Bearer ${import.meta.env['VITE_API_KEY'] ?? ''}` },
    }).then((res) => {
      const pools = (res.data as { spin_pools: Record<string, Array<{ reward_type: string; amount?: number; badge_id?: string; weight: number }>> }).spin_pools;
      const defaultPool = pools['default'] ?? Object.values(pools)[0];
      if (defaultPool && defaultPool.length > 0) {
        setSegments(poolToSegments(defaultPool));
      }
    }).catch(() => {
      // Fallback to default segments — no error shown
    });
  }, []);

  const spin = async () => {
    if (!canSpin || !walletAddress) return;
    setSpinning(true);
    setError(null);

    const segCount = segments.length;
    const segAngle = 360 / segCount;

    // Weighted random selection
    const totalWeight = segments.reduce((s, seg) => s + seg.weight, 0);
    let rand = Math.random() * totalWeight;
    let winIndex = 0;
    for (let i = 0; i < segments.length; i++) {
      rand -= segments[i]!.weight;
      if (rand <= 0) { winIndex = i; break; }
    }

    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = extraSpins * 360 + (segCount - winIndex) * segAngle - segAngle / 2;
    setRotation((r) => r + targetAngle);
    setSpinsLeft((s) => s - 1);

    setTimeout(async () => {
      setSpinning(false);
      const won = segments[winIndex]!;
      setResult(won);
      setShowModal(true);

      // Fire real event to API
      try {
        await fireEvent('spin_wheel', walletAddress, {
          spin_pool: 'default',
          result_type: won.isBadge ? 'badge' : 'points',
          result_amount: won.value,
          cost: 100,
        });
        // Refresh balance after spin
        setTimeout(() => void refetch(), 1500);
      } catch {
        setError('Spin recorded locally — API sync failed');
      }
    }, 4000);
  };

  const segAngle = 360 / segments.length;

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <p className="font-['DM_Sans'] text-gray-400 text-sm mb-1">Your balance</p>
        <p className="font-['Space_Mono'] text-amber-400 text-3xl font-bold">
          {balance.toLocaleString()} pts
        </p>
        <p className="text-gray-600 text-xs font-mono mt-1">Each spin costs 100 points</p>
      </div>

      {/* Wheel */}
      <div className="relative flex items-center justify-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-cyan-400 drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
        </div>

        <div
          ref={wheelRef}
          className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-white/20 overflow-hidden shadow-[0_0_40px_rgba(0,229,255,0.15)]"
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
              <div
                key={i}
                className="absolute inset-0"
                style={{ background: `conic-gradient(from ${angle}deg, ${seg.color} 0deg, ${seg.color} ${segAngle}deg, transparent ${segAngle}deg)` }}
              >
                <div
                  className="absolute font-['Space_Mono'] text-[9px] font-bold text-white/90 text-center leading-tight pointer-events-none"
                  style={{
                    left: `${tx}%`, top: `${ty}%`,
                    transform: `translate(-50%, -50%) rotate(${midAngle}deg)`,
                    width: '52px',
                  }}
                >
                  {seg.label}
                </div>
              </div>
            );
          })}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[#0a0a0f] border-2 border-white/20 z-10" />
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="font-mono text-xs text-gray-500 mb-4">
          Spins remaining today: {spinsLeft} / 3
        </p>
        {error && <p className="text-amber-400 text-xs font-mono mb-3">{error}</p>}
        <button
          onClick={() => void spin()}
          disabled={!canSpin}
          className={`px-10 py-3.5 font-['Space_Mono'] font-bold text-sm rounded-xl transition-all duration-200 min-h-[48px] ${
            canSpin
              ? 'bg-cyan-500 hover:bg-cyan-400 text-black hover:shadow-[0_0_24px_rgba(0,229,255,0.4)] active:scale-[0.97]'
              : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/10'
          }`}
        >
          {spinning
            ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> SPINNING...</span>
            : !isAuthenticated ? 'CONNECT WALLET'
            : balance < 100 ? 'NOT ENOUGH PTS'
            : spinsLeft === 0 ? 'NO SPINS LEFT'
            : 'SPIN (100 pts)'}
        </button>
      </div>

      {showModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="flex justify-center gap-3 mb-4">
              <Sparkles size={24} className="text-amber-400" style={{ animation: 'bounce 0.5s ease 0ms both' }} />
              <PartyPopper size={24} className="text-cyan-400" style={{ animation: 'bounce 0.5s ease 80ms both' }} />
              <Sparkles size={24} className="text-purple-400" style={{ animation: 'bounce 0.5s ease 160ms both' }} />
            </div>
            <h3 className="font-['Space_Mono'] text-white text-2xl font-bold mb-2">You won!</h3>
            <p className="font-['Space_Mono'] text-amber-400 text-3xl font-bold mb-2">{result.label}</p>
            {result.value > 0 && (
              <p className="font-['DM_Sans'] text-gray-400 text-sm mb-6">Points added to your balance</p>
            )}
            {result.isBadge && (
              <p className="font-['DM_Sans'] text-cyan-400 text-sm mb-6">Badge will be issued shortly!</p>
            )}
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-['Space_Mono'] font-bold text-sm rounded-xl transition-all active:scale-[0.97] min-h-[44px]"
            >
              Awesome!
            </button>
          </div>
          <style>{`
            @keyframes bounce {
              0% { transform: translateY(0) scale(0); opacity: 0; }
              60% { transform: translateY(-12px) scale(1.2); opacity: 1; }
              100% { transform: translateY(0) scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
