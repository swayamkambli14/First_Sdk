import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useChainLoyaltyAuth } from '../hooks/useChainLoyaltyAuth';

interface ReferralStats {
  referral_code: string;
  total_referrals: number;
  confirmed_referrals: number;
  pending_referrals: number;
  referrals: Array<{
    referee_wallet: string;
    status: string;
    created_at: string;
  }>;
}

export default function ReferralPage() {
  const { walletAddress, isAuthenticated } = useChainLoyaltyAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!walletAddress || !isAuthenticated) return;
    axios
      .get(`/v1/referrals/${walletAddress}`, { withCredentials: true })
      .then((res) => setStats(res.data as ReferralStats))
      .catch(() => null);
  }, [walletAddress, isAuthenticated]);

  const referralLink = stats
    ? `${window.location.origin}?ref=${stats.referral_code}`
    : '';

  const copyLink = () => {
    void navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const STATUS_COLORS: Record<string, string> = {
    confirmed: 'text-green-400',
    pending: 'text-yellow-400',
    fraudulent: 'text-red-400',
  };

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Referrals</h1>
        <Link to="/dashboard" className="text-purple-400 hover:text-purple-300 text-sm">← Dashboard</Link>
      </div>

      {!isAuthenticated ? (
        <div className="text-gray-400">Connect your wallet to see referral info.</div>
      ) : !stats ? (
        <div className="text-gray-500 animate-pulse">Loading...</div>
      ) : (
        <div className="space-y-6">
          {/* Referral code card */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-3">Your Referral Code</h2>
            <div className="flex items-center gap-3">
              <code className="bg-gray-800 text-purple-300 px-4 py-2 rounded-lg text-lg font-mono flex-1">
                {stats.referral_code}
              </code>
              <button
                onClick={copyLink}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {copied ? '✅ Copied!' : 'Copy Link'}
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-2 font-mono break-all">{referralLink}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total', value: stats.total_referrals },
              { label: 'Confirmed', value: stats.confirmed_referrals },
              { label: 'Pending', value: stats.pending_referrals },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
                <div className="text-3xl font-bold text-white">{s.value}</div>
                <div className="text-gray-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Referred users list */}
          {stats.referrals.length > 0 && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h3 className="font-semibold text-white">Referred Users</h3>
              </div>
              {stats.referrals.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-4 border-b border-gray-800 last:border-0">
                  <span className="font-mono text-sm text-gray-300">{r.referee_wallet}</span>
                  <span className={`text-sm capitalize ${STATUS_COLORS[r.status] ?? 'text-gray-400'}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
