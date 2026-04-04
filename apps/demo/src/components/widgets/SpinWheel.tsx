import { useState, useRef } from 'react';
import { SPIN_SEGMENTS, DEMO_USER } from '../../lib/mockData';

export default function SpinWheel() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<typeof SPIN_SEGMENTS[0] | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [spinsLeft, setSpinsLeft] = useState(3);
  const [balance, setBalance] = useState(DEMO_USER.points);
  const wheelRef = useRef<HTMLDivElement>(null);

  const canSpin = !spinning && spinsLeft > 0 && balance >= 100;

  const spin = () => {
    if (!canSpin) return;
    setSpinning(true);
    setBalance((b) => b - 100);
    setSpinsLeft((s) => s - 1);

    const segCount = SPIN_SEGMENTS.length;
    const segAngle = 360 / segCount;
    const winIndex = Math.floor(Math.random() * segCount);
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = extraSpins * 360 + (segCount - winIndex) * segAngle - segAngle / 2;
    const newRotation = rotation + targetAngle;

    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      const won = SPIN_SEGMENTS[winIndex];
      setResult(won ?? null);
      if (won && won.value > 0) {
        setBalance((b) => b + won.value);
      }
      setShowModal(true);
    }, 4000);
  };

  const segAngle = 360 / SPIN_SEGMENTS.length;

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <p className="font-['DM_Sans'] text-gray-400 text-sm mb-1">Your balance</p>
        <p className="font-['Space_Mono'] text-amber-400 text-3xl font-bold">
          {balance.toLocaleString()} pts
        </p>
        <p className="text-gray-600 text-xs font-mono mt-1">Each spin costs 100 points</p>
      </div>

      {/* Wheel container */}
      <div className="relative flex items-center justify-center">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-cyan-400 drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
        </div>

        {/* Wheel */}
        <div
          ref={wheelRef}
          className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-white/20 overflow-hidden shadow-[0_0_40px_rgba(0,229,255,0.15)]"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
              : 'none',
          }}
        >
          {SPIN_SEGMENTS.map((seg, i) => {
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
                style={{
                  background: `conic-gradient(from ${angle}deg, ${seg.color} 0deg, ${seg.color} ${segAngle}deg, transparent ${segAngle}deg)`,
                }}
              >
                <div
                  className="absolute font-['Space_Mono'] text-[9px] font-bold text-white/90 text-center leading-tight pointer-events-none"
                  style={{
                    left: `${tx}%`,
                    top: `${ty}%`,
                    transform: `translate(-50%, -50%) rotate(${midAngle}deg)`,
                    width: '52px',
                  }}
                >
                  {seg.label}
                </div>
              </div>
            );
          })}

          {/* Center circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[#0a0a0f] border-2 border-white/20 z-10" />
          </div>
        </div>
      </div>

      {/* Spins info */}
      <div className="text-center">
        <p className="font-mono text-xs text-gray-500 mb-4">
          Spins remaining today: {spinsLeft} / 3
        </p>
        <button
          onClick={spin}
          disabled={!canSpin}
          className={`px-10 py-3.5 font-['Space_Mono'] font-bold text-sm rounded-xl transition-all duration-200 min-h-[48px] ${
            canSpin
              ? 'bg-cyan-500 hover:bg-cyan-400 text-black hover:shadow-[0_0_24px_rgba(0,229,255,0.4)] active:scale-[0.97]'
              : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/10'
          }`}
        >
          {spinning ? 'SPINNING...' : !canSpin && balance < 100 ? 'NOT ENOUGH PTS' : spinsLeft === 0 ? 'NO SPINS LEFT' : 'SPIN'}
        </button>
      </div>

      {/* Result modal */}
      {showModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            {/* Confetti dots */}
            <div className="flex justify-center gap-1 mb-4">
              {['🎉', '✨', '🎊', '⭐', '🎉'].map((e, i) => (
                <span key={i} className="text-xl" style={{ animation: `bounce 0.5s ease ${i * 80}ms both` }}>
                  {e}
                </span>
              ))}
            </div>
            <h3 className="font-['Space_Mono'] text-white text-2xl font-bold mb-2">You won!</h3>
            <p className="font-['Space_Mono'] text-amber-400 text-3xl font-bold mb-2">
              {result.label}
            </p>
            {result.value > 0 && (
              <p className="font-['DM_Sans'] text-gray-400 text-sm mb-6">Added to your balance</p>
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
