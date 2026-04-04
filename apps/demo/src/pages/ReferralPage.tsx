import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Users, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useChainLoyaltyAuth } from '../hooks/useChainLoyaltyAuth';
import AurumNav from '../components/aurum/AurumNav';

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

const APP_ID = import.meta.env['VITE_APP_ID'] ?? '';

export default function ReferralPage() {
  const { walletAddress, isAuthenticated } = useChainLoyaltyAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      let wallet = walletAddress;
      if (!wallet || !isAuthenticated) {
        try {
          const me = await axios.get('/v1/user-auth/me', { withCredentials: true });
          wallet = (me.data as { wallet_address?: string }).wallet_address ?? null;
        } catch { setLoading(false); return; }
      }
      if (!wallet) { setLoading(false); return; }
      try {
        const res = await axios.get(`/v1/referrals/${wallet}`, { withCredentials: true });
        setStats(res.data as ReferralStats);
      } catch {}
      setLoading(false);
    };
    void load();
  }, [walletAddress, isAuthenticated]);

  const referralLink = stats ? `${window.location.origin}/join?ref=${stats.referral_code}` : '';

  const copyLink = () => {
    void navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const STATUS_COLORS: Record<string, string> = {
    confirmed: 'text-green-600 bg-green-50',
    pending: 'text-amber-600 bg-amber-50',
    fraudulent: 'text-red-600 bg-red-50',
  };

  return (
    <div className="min-h-screen bg-aurum-ivory">
      <AurumNav />

      <div className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="font-display text-4xl text-aurum-midnight font-light">
            Refer & <em className="text-aurum-gold">Earn</em>
          </h1>
          <p className="text-aurum-text-secondary mt-1">Share Aurum Circle with friends and earn Gold together</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-aurum-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !stats ? (
          <div className="bg-white rounded-2xl p-8 shadow-card text-center">
            <Users size={40} className="text-aurum-gold mx-auto mb-4" />
            <p className="text-aurum-text-secondary mb-4">Sign in to access your referral link</p>
            <Link to="/join" className="btn-gold px-6 py-2.5 rounded-xl text-sm font-semibold inline-block">Sign In</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Referral link card */}
            <div className="bg-aurum-midnight rounded-2xl p-6 text-aurum-ivory">
              <p className="text-aurum-gold text-xs tracking-widest uppercase mb-3">Your Referral Link</p>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 font-mono text-sm text-aurum-ivory/80 break-all mb-4">
                {referralLink}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={copyLink}
                  className="btn-gold px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
                >
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
                </button>
                <button
                  onClick={() => {
                    const text = encodeURIComponent(`Join me at Aurum Hotels and earn Gold rewards! ${referralLink}`);
                    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
                  }}
                  className="btn-outline-gold px-5 py-2.5 rounded-xl text-sm font-semibold"
                >
                  Share on 𝕏
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Referred', value: stats.total_referrals },
                { label: 'Confirmed', value: stats.confirmed_referrals },
                { label: 'Pending', value: stats.pending_referrals },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl p-5 shadow-card text-center">
                  <p className="font-display text-4xl text-aurum-midnight font-light">{s.value}</p>
                  <p className="text-aurum-text-secondary text-sm mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Earnings summary */}
            <div className="bg-white rounded-2xl p-5 shadow-card flex items-center justify-between">
              <div>
                <p className="text-aurum-text-secondary text-sm">Gold earned from referrals</p>
                <p className="font-display text-3xl text-aurum-gold">{(stats.confirmed_referrals * 200).toLocaleString()} Gold</p>
              </div>
              <Link to="/dashboard" className="flex items-center gap-1 text-aurum-gold text-sm hover:text-aurum-gold-dark">
                View dashboard <ChevronRight size={14} />
              </Link>
            </div>

            {/* Referred users list */}
            {stats.referrals.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-display text-xl text-aurum-midnight">Referred Guests</h3>
                </div>
                {stats.referrals.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-mono text-sm text-aurum-midnight">
                        {r.referee_wallet.startsWith('0x')
                          ? `${r.referee_wallet.slice(0, 6)}...${r.referee_wallet.slice(-4)}`
                          : r.referee_wallet.split('@')[0]}
                      </p>
                      <p className="text-aurum-text-secondary text-xs">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[r.status] ?? 'text-gray-500 bg-gray-50'}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
