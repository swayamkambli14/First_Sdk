import { Key, Zap, Award, Dices, Users, Link } from 'lucide-react';

const features = [
  { icon: Key,   title: 'Your Identity, Your Rewards',  desc: 'Sign up with email. Your rewards are tied to your account — no passwords to remember.' },
  { icon: Zap,   title: 'Instant Reward Engine',        desc: 'Every action evaluated in real-time. Earn rewards the moment you take action.' },
  { icon: Award, title: 'Collectible Achievements',     desc: 'Unlock special badges as you hit milestones. Each one is uniquely yours.' },
  { icon: Dices, title: 'Spin & Win',                   desc: 'Hit milestones, spin the wheel. Transparent odds, real rewards.' },
  { icon: Users, title: 'Refer & Earn',                 desc: 'Share your link. When friends join and make their first purchase, you both earn bonus rewards.' },
  { icon: Link,  title: 'Works Everywhere',             desc: 'One account across every app using ChainLoyalty. Your rewards follow you.' },
];

export default function Features() {
  return (
    <section className="bg-[#0a0a0f] py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-cyan-400 font-mono text-xs tracking-widest uppercase mb-3">What You Get</p>
          <h2 className="font-['Space_Mono'] text-3xl lg:text-4xl font-bold text-white">Built for the on-chain era</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-200 hover:border-cyan-500/40 hover:bg-white/[0.07] hover:shadow-[0_0_30px_rgba(0,229,255,0.06)] cursor-default"
              >
                <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-cyan-400" />
                </div>
                <h3 className="font-['Space_Mono'] text-white font-bold text-base mb-2">{f.title}</h3>
                <p className="font-['DM_Sans'] text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
