import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useChainLoyaltyAuth } from '../../hooks/useChainLoyaltyAuth';

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isAuthenticated } = useChainLoyaltyAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  // Dot-grid canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const spacing = 28;
      const cols = Math.ceil(canvas.width / spacing) + 1;
      const rows = Math.ceil(canvas.height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;
          const dist = Math.sqrt(
            Math.pow(x - canvas.width / 2, 2) + Math.pow(y - canvas.height / 2, 2)
          );
          const wave = Math.sin(dist / 60 - t * 0.8) * 0.5 + 0.5;
          const alpha = 0.06 + wave * 0.12;
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
          ctx.fill();
        }
      }
      t += 0.016;
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0a0a0f]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.9 }}
      />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/4 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Text */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 text-xs font-mono tracking-widest uppercase">
              Web3 Loyalty Infrastructure
            </span>
          </div>

          <h1 className="font-['Space_Mono'] text-5xl lg:text-6xl font-bold text-white leading-tight">
            Your Loyalty.<br />
            Your Wallet.<br />
            <span className="text-cyan-400">Your Rules.</span>
          </h1>

          <p className="font-['DM_Sans'] text-gray-400 text-lg leading-relaxed max-w-lg">
            ChainLoyalty turns every user action into a verifiable on-chain reward.
            Sign up with email, then connect your wallet on the dashboard.
          </p>

          <div className="flex flex-wrap gap-4">
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-['Space_Mono'] font-bold text-sm rounded-lg transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] active:scale-[0.97]"
                >
                  Connect Wallet
                </button>
              )}
            </ConnectButton.Custom>
            <a
              href="#how-it-works"
              className="px-6 py-3 border border-white/20 hover:border-cyan-500/50 text-white font-['Space_Mono'] text-sm rounded-lg transition-all duration-200 hover:bg-white/5 active:scale-[0.97]"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Right: Floating mockup card */}
        <div className="hidden lg:flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-3xl scale-110" />
            <div
              className="relative backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 w-80 shadow-2xl"
              style={{ animation: 'float 4s ease-in-out infinite' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-gray-500 text-xs font-mono">WALLET</p>
                  <p className="text-white text-sm font-mono">0x1A2b...9A0b</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-green-400 text-xs font-mono">Sepolia</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-gray-500 text-xs font-mono mb-1">POINTS</p>
                  <p className="text-amber-400 text-2xl font-['Space_Mono'] font-bold">2,450</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-gray-500 text-xs font-mono mb-1">TIER</p>
                  <p className="text-gray-300 text-2xl font-['Space_Mono'] font-bold">Silver</p>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5 mb-4">
                <p className="text-gray-500 text-xs font-mono mb-2">BADGES</p>
                <div className="flex gap-2">
                  {['🔥', '⚡', '🛒', '👥', '🎯'].map((b, i) => (
                    <span key={i} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm border border-white/10">{b}</span>
                  ))}
                </div>
              </div>              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-gray-500">Silver → Gold</span>
                  <span className="text-cyan-400">60%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </section>
  );
}
