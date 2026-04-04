import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Key, Star, LogOut, ChevronRight, Loader2 } from 'lucide-react';
import { useChainLoyaltyAuth } from '../hooks/useChainLoyaltyAuth';
import { useUserStats, useRewardHistory, useBadges } from '../hooks/useRewardsData';
import { useAurumToast } from '../components/aurum/AurumToast';
import AurumNav from '../components/aurum/AurumNav';
import WalletGate from '../components/dashboard/WalletGate';
import Onboarding from '../components/Onboarding';
import {
  AURUM_TIER_NAMES, AURUM_BADGE_NAMES, EARN_ACTIONS,
} from '../config/aurum';
import axios from 'axios';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, walletAddress, logout } = useChainLoyaltyAuth();
  const { stats, refetch: refetchStats } = useUserStats();
  const { rewards } = useRewardHistory();
  const { badges } = useBadges();
  const { showToast, ToastContainer } = useAurumToast();

  const [custodialAuth, setCustodialAuth] = useState<boolean | null>(null);
  const [custodialWallet, setCustodialWallet] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [earningId, setEarningId] = useState<string | null>(null);
  const [ratingId, setRatingId] = useState<string | null>(null);

  // Check custodial session
  useEffect(() => {
    axios.get('/v1/user-auth/me', { withCredentials: true })
      .then((res) => {
        const d = res.data as { onboarding_complete?: boolean; wallet_address?: string };
        setCustodialAuth(true);
        if (d.wallet_address) setCustodialWallet(d.wallet_address);
        if (d.onboarding_complete === false) setShowOnboarding(true);
      })
      .catch(() => setCustodialAuth(false));
  }, []);

  const isSignedIn = isAuthenticated || custodialAuth === true;
  // Effective wallet — SIWE takes priority, fall back to custodial
  const effectiveWallet = walletAddress ?? custodialWallet;

  // Loading state
  if (custodialAuth === null && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-aurum-ivory flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-aurum-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) return <WalletGate />;

  const tier = (stats?.tier ?? 'bronze').toLowerCase();
  const tierName = AURUM_TIER_NAMES[tier] ?? 'Silver Key';
  const balance = stats?.currentPointsBalance ?? 0;

  const handleEarnGold = async (action: typeof EARN_ACTIONS[0]) => {
    if (!effectiveWallet) return;
    setEarningId(action.id);
    try {
      await axios.post('/v1/events', {
        wallet_address: effectiveWallet,
        event_type: action.eventType,
        metadata: action.metadata,
      }, { headers: { Authorization: `Bearer ${import.meta.env['VITE_API_KEY'] ?? ''}` } });
      showToast(`🥂 You earned ${action.goldAmount} Gold!`, action.title);
      setTimeout(() => void refetchStats(), 1500);
    } catch {
      showToast('Something went wrong. Please try again.');
    } finally {
      setEarningId(null);
    }
  };

  const handleRateStay = async (rewardId: string) => {
    if (!effectiveWallet) return;
    setRatingId(rewardId);
    try {
      await axios.post('/v1/events', {
        wallet_address: effectiveWallet,
        event_type: 'feature_usage',
        metadata: { feature_name: 'rate_stay', reward_id: rewardId },
      }, { headers: { Authorization: `Bearer ${import.meta.env['VITE_API_KEY'] ?? ''}` } });
      showToast('🌟 Thank you! You earned 25 Gold for your review.');
      setTimeout(() => void refetchStats(), 1500);
    } catch {
      showToast('Something went wrong. Please try again.');
    } finally {
      setRatingId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    try { await axios.post('/v1/user-auth/logout', {}, { withCredentials: true }); } catch {}
    navigate('/');
  };

  // Tier progress
  const TIER_THRESHOLDS: Record<string, { next: string; max: number }> = {
    bronze: { next: 'Gold Key', max: 500 },
    silver: { next: 'Platinum Key', max: 2000 },
    gold:   { next: 'Diamond Key', max: 10000 },
    platinum: { next: 'Diamond Key', max: 10000 },
  };
  const tierInfo = TIER_THRESHOLDS[tier] ?? TIER_THRESHOLDS['bronze']!;
  const progress = Math.min(100, Math.round((balance / tierInfo.max) * 100));
  const toNext = Math.max(0, tierInfo.max - balance);

  // Derive "stays" from real reward history (purchase/subscription events that earned points)
  const stayRewards = rewards
    .filter((r) => r.reward_type === 'points' && (
      r.reason?.toLowerCase().includes('purchase') ||
      r.reason?.toLowerCase().includes('stay') ||
      r.reason?.toLowerCase().includes('subscription') ||
      r.reason?.toLowerCase().includes('suite') ||
      r.reason?.toLowerCase().includes('dining')
    ))
    .slice(0, 3);

  const STAY_IMAGES = [
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80',
  ];
  const STAY_ROOM_NAMES = ['Grand Suite', 'Junior Suite', 'Presidential Suite'];

  return (
    <div className="min-h-screen bg-aurum-ivory">
      <ToastContainer />

      {/* Aurum Dashboard Nav */}
      <header className="bg-aurum-midnight sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-xl text-aurum-gold font-semibold">AURUM</Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-aurum-ivory/70">
            {[['/', 'Home'], ['/rooms', 'Rooms'], ['/dining', 'Dining']].map(([p, l]) => (
              <Link key={p} to={p} className="hover:text-aurum-gold transition-colors">{l}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            {/* LoyaltyTopBar inline */}
            <div className="flex items-center gap-2 bg-aurum-gold/10 border border-aurum-gold/30 px-3 py-1.5 rounded-lg">
              <Key size={13} className="text-aurum-gold" />
              <span className="text-aurum-gold font-semibold text-sm">{balance.toLocaleString()} Gold</span>
              <span className="text-aurum-ivory/30 text-xs">·</span>
              <span className="text-aurum-ivory/60 text-xs">{tierName}</span>
            </div>
            <button onClick={handleLogout} className="text-aurum-ivory/40 hover:text-aurum-ivory transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-display text-4xl text-aurum-midnight font-light">
            Welcome back, <em className="text-aurum-gold">Valued Guest</em>
          </h1>
          <p className="text-aurum-text-secondary mt-1">Your Aurum Circle dashboard</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left column (65%) ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Your Stays — derived from real reward history */}
            <section>
              <h2 className="font-display text-2xl text-aurum-midnight mb-4">Your Stays</h2>
              {stayRewards.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 shadow-card text-center">
                  <p className="text-aurum-text-secondary text-sm">No stays recorded yet — book your first stay to start earning Gold.</p>
                  <Link to="/join" className="btn-gold px-6 py-2 rounded-lg text-xs inline-block mt-4">Book a Stay</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {stayRewards.map((reward, idx) => {
                    const val = reward.reward_value as Record<string, unknown>;
                    const goldEarned = Number(val['amount'] ?? 0);
                    const roomName = STAY_ROOM_NAMES[idx % STAY_ROOM_NAMES.length]!;
                    const image = STAY_IMAGES[idx % STAY_IMAGES.length]!;
                    const date = new Date(reward.issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    return (
                      <div key={reward.id} className="bg-white rounded-2xl overflow-hidden shadow-card flex gap-0">
                        <img src={image} alt={roomName} className="w-32 h-full object-cover flex-shrink-0" />
                        <div className="p-5 flex-1 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-display text-xl text-aurum-midnight">{roomName}</p>
                            <p className="text-aurum-text-secondary text-sm">{date}</p>
                            <p className="text-aurum-gold text-sm font-semibold mt-1">✦ You earned {goldEarned.toLocaleString()} Gold for this stay</p>
                          </div>
                          <button
                            onClick={() => void handleRateStay(reward.id)}
                            disabled={ratingId === reward.id}
                            className="btn-outline-gold px-4 py-2 rounded-lg text-xs flex-shrink-0 flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {ratingId === reward.id ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />}
                            Rate Stay
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Earn More Gold */}
            <section>
              <h2 className="font-display text-2xl text-aurum-midnight mb-1">Ways to Earn Today</h2>
              <p className="text-aurum-text-secondary text-sm mb-4">Every action earns you Gold toward your next tier</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {EARN_ACTIONS.map((action) => (
                  <div key={action.id} className="bg-white rounded-2xl p-5 shadow-card hover:shadow-gold transition-all">
                    <span className="text-3xl mb-3 block">{action.icon}</span>
                    <h3 className="font-semibold text-aurum-midnight text-sm mb-1">{action.title}</h3>
                    <p className="text-aurum-text-secondary text-xs mb-3">{action.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-aurum-gold text-sm font-semibold">+{action.goldAmount} Gold</span>
                      <button
                        onClick={() => void handleEarnGold(action)}
                        disabled={earningId === action.id}
                        className="btn-gold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {earningId === action.id ? <Loader2 size={11} className="animate-spin" /> : null}
                        Earn Gold
                      </button>
                    </div>
                  </div>
                ))}
                {/* Refer a friend */}
                <div className="bg-aurum-midnight rounded-2xl p-5 hover:shadow-gold transition-all">
                  <span className="text-3xl mb-3 block">🤝</span>
                  <h3 className="font-semibold text-aurum-ivory text-sm mb-1">Refer a Friend</h3>
                  <p className="text-aurum-ivory/50 text-xs mb-3">You earn 200 Gold, they earn 100 Gold welcome bonus</p>
                  <Link to="/referral" className="btn-gold px-4 py-1.5 rounded-lg text-xs inline-block">Share Link</Link>
                </div>
              </div>
            </section>
          </div>

          {/* ── Right column (35%) ────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Aurum Circle status card */}
            <div className="bg-aurum-midnight rounded-2xl p-6 text-aurum-ivory">
              <div className="flex items-center gap-2 mb-4">
                <Key size={16} className="text-aurum-gold" />
                <span className="text-aurum-gold text-xs tracking-widest uppercase font-semibold">Aurum Circle</span>
              </div>
              <p className="font-display text-5xl text-aurum-gold mb-1">{balance.toLocaleString()}</p>
              <p className="text-aurum-ivory/50 text-sm mb-4">Gold · {tierName}</p>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-aurum-gold rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-aurum-ivory/40 text-xs">{toNext.toLocaleString()} Gold to {tierInfo.next}</p>
              <Link to="/spin" className="mt-4 block text-center btn-gold py-2.5 rounded-xl text-sm font-semibold">
                🎰 Spin for Rewards
              </Link>
            </div>

            {/* Badges */}
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <h3 className="font-display text-xl text-aurum-midnight mb-4">Your Exclusive Badges</h3>
              {badges.length === 0 ? (
                <p className="text-aurum-text-secondary text-sm text-center py-4">Complete your first stay to unlock badges</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {badges.map((badge) => {
                    const info = AURUM_BADGE_NAMES[badge.badge_id] ?? { name: badge.badge_name, icon: '🏅', desc: '' };
                    return (
                      <div key={badge.badge_id} className="text-center p-3 bg-aurum-ivory rounded-xl">
                        <span className="text-2xl block mb-1">{info.icon}</span>
                        <p className="text-aurum-midnight text-[10px] font-semibold leading-tight">{info.name}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              <Link to="/rewards" className="flex items-center justify-center gap-1 mt-4 text-aurum-gold text-xs hover:text-aurum-gold-dark transition-colors">
                View all badges <ChevronRight size={12} />
              </Link>
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <h3 className="font-display text-xl text-aurum-midnight mb-4">Recent Activity</h3>
              {rewards.length === 0 ? (
                <p className="text-aurum-text-secondary text-sm">No activity yet — start earning Gold!</p>
              ) : (
                <div className="space-y-3">
                  {rewards.slice(0, 5).map((r) => {
                    const val = r.reward_value as Record<string, unknown>;
                    const pts = r.reward_type === 'points' ? Number(val['amount'] ?? 0) : 0;
                    return (
                      <div key={r.id} className="flex justify-between items-center text-sm">
                        <span className="text-aurum-text-secondary truncate max-w-[160px]">{r.reason ?? r.reward_type}</span>
                        {pts > 0 && <span className="text-aurum-gold font-semibold flex-shrink-0">+{pts} Gold</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showOnboarding && (
        <Onboarding
          businessName="Aurum Hotels"
          currencyName="Gold"
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}
