import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import StatsBar from '../components/landing/StatsBar';

export default function LandingPage() {
  return (
    <div className="bg-[#0a0a0f] min-h-screen">
      <Hero />
      <Features />
      <HowItWorks />
      <StatsBar />

      {/* Footer */}
      <footer className="bg-[#0a0a0f] border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-['Space_Mono'] text-cyan-400 font-bold text-base">
              Chain<span className="text-white">Loyalty</span>
            </p>
            <p className="font-['DM_Sans'] text-gray-600 text-xs mt-1">
              Web3 loyalty infrastructure for the on-chain era
            </p>
          </div>
          <p className="font-mono text-xs text-gray-700">
            Built for ChainLoyalty Hackathon
          </p>
        </div>
      </footer>
    </div>
  );
}
