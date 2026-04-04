import { UserCircle, Zap, Trophy } from 'lucide-react';

const steps = [
  { num: '01', icon: UserCircle, title: 'Create Your Account', desc: 'Sign up with your email in seconds. No special apps or setup required.' },
  { num: '02', icon: Zap,        title: 'Take Actions',        desc: 'Every purchase, referral, or milestone earns you rewards automatically.' },
  { num: '03', icon: Trophy,     title: 'Earn Rewards',        desc: 'Points, achievements, and prizes land in your account instantly.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#0a0a0f] py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-cyan-400 font-mono text-xs tracking-widest uppercase mb-3">The Flow</p>
          <h2 className="font-['Space_Mono'] text-3xl lg:text-4xl font-bold text-white">How it works</h2>
        </div>

        {/* Desktop */}
        <div className="hidden lg:flex items-start gap-0 relative">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="flex-1 flex items-start gap-0">
                <div className="flex flex-col items-center text-center px-8">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Icon size={28} className="text-cyan-400" />
                    </div>
                    <span className="absolute -top-2 -right-2 font-['Space_Mono'] text-xs text-cyan-400 font-bold bg-[#0a0a0f] px-1">{step.num}</span>
                  </div>
                  <h3 className="font-['Space_Mono'] text-white font-bold text-base mb-2">{step.title}</h3>
                  <p className="font-['DM_Sans'] text-gray-400 text-sm leading-relaxed max-w-[200px]">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 flex items-start pt-8 min-w-[40px]">
                    <div className="w-full border-t-2 border-dashed border-cyan-500/25" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile */}
        <div className="flex lg:hidden flex-col gap-0">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Icon size={20} className="text-cyan-400" />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 font-['Space_Mono'] text-[10px] text-cyan-400 font-bold bg-[#0a0a0f] px-0.5">{step.num}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 border-l-2 border-dashed border-cyan-500/25 my-3 min-h-[40px]" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="font-['Space_Mono'] text-white font-bold text-sm mb-1">{step.title}</h3>
                  <p className="font-['DM_Sans'] text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
