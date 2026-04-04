import { useState } from 'react';
import { useReferralStats } from '../../hooks/useRewardsData';

export default function ReferralsTab() {
  const { stats, loading } = useReferralStats();
  const [copied, setCopied] = useState(false);

  const referralLink = stats
    ? `${window.location.origin}?ref=${stats.referral_code}`
    : '';

  const copyLink = () => {
    void navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnX = () => {
    const text = encodeURIComponent(
      `Join me on ChainLoyalty — earn on-chain rewards for every action! Use my link: ${referralLink}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const STATUS_COLORS: Record<string, string> = {
    confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    fraudulent: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <h2 className="font-['Space_Mono'] text-white text-xl font-bold">Referrals</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="h-20 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-['Space_Mono'] text-white text-xl font-bold">Referrals</h2>

      {/* Referral link card */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="font-['Space_Mono'] text-white font-bold text-sm mb-4">Your Referral Link</h3>

        {stats ? (
          <>
            <div className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-cyan-400 break-all mb-4">
              {referralLink}
            </div>
            <div className="flex flex-wrap gap-3">
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
          </>
        ) : (
          <p className="text-gray-600 font-mono text-xs">Connect wallet to get your referral link</p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Referred', value: stats?.total_referrals ?? 0 },
          { label: 'Confirmed', value: stats?.confirmed_referrals ?? 0 },
          { label: 'Pending', value: stats?.pending_referrals ?? 0 },
        ].map((s) => (
          <div key={s.label} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="font-['Space_Mono'] text-2xl font-bold text-white mb-1">{s.value}</p>
            <p className="font-['DM_Sans'] text-gray-500 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Referred wallets table */}
      {stats && stats.referrals.length > 0 && (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.referrals.map((r, i) => (
                  <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 font-mono text-sm text-gray-300">{r.referee_wallet}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${STATUS_COLORS[r.status] ?? 'bg-white/5 text-gray-500 border-white/10'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
