/**
 * Onboarding — 4-step flow for first-time users.
 * Zero blockchain language. Plain English throughout.
 * Shown once, then marked complete via API.
 */
import { useState } from 'react';
import { Gift, Star, Users, ChevronRight, Copy, Check } from 'lucide-react';
import { useUserStats } from '../hooks/useRewardsData';
import { useChainLoyaltyAuth } from '../hooks/useChainLoyaltyAuth';
import axios from 'axios';

const APP_ID = import.meta.env['VITE_APP_ID'] ?? 'demo-app-id';

interface OnboardingProps {
  businessName?: string;
  currencyName?: string;
  onComplete: () => void;
}

export default function Onboarding({ businessName = 'ChainLoyalty', currencyName = 'Stars', onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [animBalance, setAnimBalance] = useState(0);
  const { stats } = useUserStats();
  const { walletAddress } = useChainLoyaltyAuth();

  const referralLink = stats?.referralCode
    ? `${window.location.origin}?ref=${stats.referralCode}`
    : `${window.location.origin}?ref=YOUR_CODE`;

  const handleNext = () => {
    if (step === 1) {
      // Animate balance counter
      let count = 0;
      const target = 50;
      const interval = setInterval(() => {
        count += 5;
        setAnimBalance(count);
        if (count >= target) clearInterval(interval);
      }, 60);
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await axios.post('/v1/user-auth/complete-onboarding', {}, { withCredentials: true });
    } catch { /* non-fatal */ }
    onComplete();
  };

  const copyLink = () => {
    void navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      icon: <Gift size={48} className="text-cyan-400" />,
      title: `Welcome to ${businessName} Rewards! 🎉`,
      body: `You're now earning ${currencyName} for everything you do. The more you engage, the more you earn — and the better your rewards get.`,
      cta: "Let's Go",
    },
    {
      icon: null,
      title: 'This is your rewards balance',
      body: `Watch it grow as you earn ${currencyName}. It shows up at the top of your screen so you always know where you stand.`,
      cta: 'Got it!',
    },
    {
      icon: <Star size={48} className="text-amber-400" />,
      title: 'Here\'s how to earn',
      body: null,
      cta: 'Sounds great!',
    },
    {
      icon: <Users size={48} className="text-green-400" />,
      title: 'Invite friends, earn together',
      body: `Share your link. When your friends join and make their first purchase, you both earn bonus ${currencyName}.`,
      cta: 'Start Earning',
    },
  ];

  const current = steps[step]!;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-[#0d0d14] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-cyan-400' : i < step ? 'w-4 bg-cyan-400/40' : 'w-4 bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="text-center space-y-6">
          {/* Step 0 — Welcome */}
          {step === 0 && (
            <>
              <div className="flex justify-center">{current.icon}</div>
              <h2 className="font-['Space_Mono'] text-white text-2xl font-bold">{current.title}</h2>
              <p className="font-['DM_Sans'] text-gray-400 text-base leading-relaxed">{current.body}</p>
            </>
          )}

          {/* Step 1 — Balance demo */}
          {step === 1 && (
            <>
              <h2 className="font-['Space_Mono'] text-white text-xl font-bold">{current.title}</h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mx-auto max-w-xs">
                <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">Your Balance</p>
                <p className="font-['Space_Mono'] text-5xl font-bold text-amber-400 mb-1">
                  {animBalance > 0 ? `+${animBalance}` : (stats?.currentPointsBalance ?? 0).toLocaleString()}
                </p>
                <p className="text-gray-500 text-sm">{currencyName}</p>
              </div>
              <p className="font-['DM_Sans'] text-gray-400 text-sm leading-relaxed">{current.body}</p>
            </>
          )}

          {/* Step 2 — How to earn */}
          {step === 2 && (
            <>
              <div className="flex justify-center">{current.icon}</div>
              <h2 className="font-['Space_Mono'] text-white text-xl font-bold">{current.title}</h2>
              <div className="space-y-3 text-left">
                {[
                  { icon: '🛒', action: 'Make a purchase', reward: `Earn ${currencyName}` },
                  { icon: '👥', action: 'Refer a friend', reward: `Both earn bonus ${currencyName}` },
                  { icon: '🎰', action: 'Spin the wheel', reward: `Win surprise ${currencyName}` },
                ].map((item) => (
                  <div key={item.action} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-['DM_Sans'] text-white text-sm font-medium">{item.action}</p>
                      <p className="font-['DM_Sans'] text-cyan-400 text-xs">{item.reward}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Step 3 — Referral */}
          {step === 3 && (
            <>
              <div className="flex justify-center">{current.icon}</div>
              <h2 className="font-['Space_Mono'] text-white text-xl font-bold">{current.title}</h2>
              <p className="font-['DM_Sans'] text-gray-400 text-sm leading-relaxed">{current.body}</p>
              <div className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-cyan-400 truncate">{referralLink}</span>
                <button onClick={copyLink} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white flex-shrink-0">
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* CTA button */}
        <button
          onClick={handleNext}
          className="w-full mt-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-['Space_Mono'] font-bold text-sm rounded-xl transition-all active:scale-[0.97] flex items-center justify-center gap-2"
        >
          {current.cta}
          {step < 3 && <ChevronRight size={16} />}
        </button>

        {step < 3 && (
          <button onClick={handleComplete} className="w-full mt-3 text-gray-600 text-xs hover:text-gray-400 transition-colors">
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
