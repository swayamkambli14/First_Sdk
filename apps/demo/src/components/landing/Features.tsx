const features = [
  {
    icon: '🔑',
    title: 'Wallet-Native Identity',
    desc: 'Your rewards tied to your wallet. No email needed.',
  },
  {
    icon: '⚡',
    title: 'Instant Reward Engine',
    desc: 'Every action evaluated in real-time against reward rules.',
  },
  {
    icon: '🏅',
    title: 'On-Chain Badges',
    desc: 'Achievements minted as NFTs. Provably yours forever.',
  },
  {
    icon: '🎰',
    title: 'Spin & Win',
    desc: 'Hit milestones, spin the wheel. Transparent odds, real rewards.',
  },
  {
    icon: '👥',
    title: 'Refer & Earn',
    desc: 'Share your link. Both wallets get credited automatically.',
  },
  {
    icon: '🔗',
    title: 'Cross-Platform Portable',
    desc: 'One wallet identity across every app using ChainLoyalty.',
  },
];

export default function Features() {
  return (
    <section className="bg-[#0a0a0f] py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-cyan-400 font-mono text-xs tracking-widest uppercase mb-3">
            What You Get
          </p>
          <h2 className="font-['Space_Mono'] text-3xl lg:text-4xl font-bold text-white">
            Built for the on-chain era
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-200 hover:border-cyan-500/40 hover:bg-white/[0.07] hover:shadow-[0_0_30px_rgba(0,229,255,0.06)] cursor-default"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-['Space_Mono'] text-white font-bold text-base mb-2">
                {f.title}
              </h3>
              <p className="font-['DM_Sans'] text-gray-400 text-sm leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
