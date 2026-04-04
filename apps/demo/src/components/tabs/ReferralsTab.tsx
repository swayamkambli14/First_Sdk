import { useState } from 'react';
import { DEMO_REFERRALS, DEMO_USER } from '../../lib/mockData';

export default function ReferralsTab() {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://chainloyalty.xyz/ref/${DEMO_USER.referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnX = () => {
    const text = encodeURIComponent(
      `Join me on ChainLoyalty — earn on-chain rewards for every action! Use my link: ${referralLink}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const active = DEMO_REFERRALS.filter((r) => r.status === 'Active').length;
  const totalEarned = DEMO_REFERRALS.reduce((s, r) => s + r.earned, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-['Space_Mono'] text-white text-xl font-bold">Referrals</h2>
        <span className="font-mono text-[10px] text-amber-400/70 border border-amber-400/20 px-2 py-0.5 rounded tracking-widest uppercase">
          Demo Data
        </span>
      </div>

      {/* Referral link card */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="font-['Space_Mono'] text-white font-bold text-sm mb-4">Your Referral Link</h3>

        <div className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-cyan-400 break-all mb-4">
          {referralLink}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={copyLink}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-['Space_Mono'] font-bold text-xs rounded-lg transition-all active:scale-[0.97] min-h-[40px]"
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={shareOnX}
            className="px-5 py-2.5 border border-white/20 hover:border-cyan-500/30 text-white font-['Space_Mono'] text-xs rounded-lg transition-all hover:bg-white/5 active:scale-[0.97] min-h-[40px]"
          >
            Share on 𝕏
          </button>
        </div>

        {/* QR placeholder */}
        <div className="w-24 h-24 border-2 border-white/20 rounded-xl flex items-center justify-center">
          <span className="font-mono text-xs text-gray-600">QR</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Referred', value: DEMO_REFERRALS.length },
          { label: 'Active', value: active },
          { label: 'Pts Earned', value: totalEarned },
        ].map((s) => (
          <div
            key={s.label}
            className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 text-center"
          >
            <p className="font-['Space_Mono'] text-2xl font-bold text-white mb-1">{s.value}</p>
            <p className="font-['DM_Sans'] text-gray-500 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Referred wallets table */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h3 className="font-['Space_Mono'] text-white font-bold text-sm">Referred Wallets</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Wallet</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Joined</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">Status</th>
                <th className="text-right px-4 py-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">You Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {DEMO_REFERRALS.map((r, i) => (
                <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3 font-mono text-sm text-gray-300">{r.wallet}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.joined}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        r.status === 'Active'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-white/5 text-gray-500 border border-white/10'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-['Space_Mono'] text-sm font-bold text-amber-400">
                    {r.earned > 0 ? `+${r.earned} pts` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
