<<<<<<< HEAD
import DashboardShell from '../components/dashboard/DashboardShell';
=======
import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useChainLoyaltyAuth } from '../hooks/useChainLoyaltyAuth';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_BASE = import.meta.env['VITE_API_BASE_URL'] ?? 'http://localhost:3000';
const APP_ID = import.meta.env['VITE_APP_ID'] ?? '9eb29bde-c06e-436f-8fe6-759d2e7c5820';
const API_KEY = import.meta.env['VITE_API_KEY'] ?? 'sk_demo_chainloyalty_development_key_12345';

interface Toast { id: number; message: string; type: 'success' | 'error' | 'reward'; }
interface Badge { badge_id: string; name: string; description?: string; rarity: string; earned_at: string; on_chain_tx_hash?: string; }
interface Reward { id: string; rewardType: string; rewardValue: Record<string, unknown>; reason?: string; issuedAt: string; }
interface Profile { wallet_address: string; tier: string; current_points: string; total_points_earned: string; badge_count: number; referral_code: string; }

const TIER_COLORS: Record<string, string> = { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700', platinum: '#00e5ff' };
const TIER_BG: Record<string, string> = { bronze: 'bg-orange-900/30 border-orange-700', silver: 'bg-gray-700/30 border-gray-500', gold: 'bg-yellow-900/30 border-yellow-600', platinum: 'bg-cyan-900/30 border-cyan-600' };
const RARITY_COLORS: Record<string, string> = { common: 'text-gray-400 border-gray-600', uncommon: 'text-green-400 border-green-600', rare: 'text-blue-400 border-blue-600', epic: 'text-purple-400 border-purple-600', legendary: 'text-yellow-400 border-yellow-500' };
const TIER_THRESHOLDS: Record<string, number> = { bronze: 0, silver: 500, gold: 2000, platinum: 10000 };
const TIER_NEXT: Record<string, number | null> = { bronze: 500, silver: 2000, gold: 10000, platinum: null };
>>>>>>> 8fc7049efa9590d0897ca5583f8fb23e2671d7ee

// Auth check bypassed for UI preview — restore original guard before production
export default function DashboardPage() {
<<<<<<< HEAD
  return <DashboardShell />;
=======
  const { isAuthenticated, walletAddress, logout } = useChainLoyaltyAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const [profileRes, badgesRes, rewardsRes] = await Promise.all([
        axios.get(`${API_BASE}/v1/users/${walletAddress}/profile`, { withCredentials: true }),
        axios.get(`${API_BASE}/v1/users/${walletAddress}/badges`, { withCredentials: true }),
        axios.get(`${API_BASE}/v1/users/${walletAddress}/rewards?limit=10`, { withCredentials: true }),
      ]);
      setProfile(profileRes.data as Profile);
      setBadges((badgesRes.data as { badges: Badge[] }).badges);
      setRewards((rewardsRes.data as { rewards: Reward[] }).rewards);
    } catch { /* silently fail */ }
  }, [walletAddress]);

  // WebSocket for real-time reward updates
  useEffect(() => {
    if (!walletAddress) return;
    const socket = io(API_BASE, { withCredentials: true });
    socketRef.current = socket;
    socket.on('reward_earned', (reward: Record<string, unknown>) => {
      const type = reward['type'] as string;
      const amount = (reward['amount'] as number) ?? 0;
      const badgeId = reward['badge_id'] as string;
      if (type === 'points') {
        showToast(`🎉 +${amount} points earned!`, 'reward');
      } else if (type === 'badge') {
        showToast(`🎖️ New badge unlocked: ${badgeId}!`, 'reward');
      } else if (type === 'probabilistic') {
        showToast(`🎰 Spin wheel reward incoming!`, 'reward');
      }
      // Refresh data after reward
      setTimeout(() => fetchProfile(), 1500);
    });
    return () => { socket.disconnect(); };
  }, [walletAddress, fetchProfile]);

  useEffect(() => {
    if (isAuthenticated && walletAddress) fetchProfile();
  }, [isAuthenticated, walletAddress, fetchProfile]);

  if (!isAuthenticated) { navigate('/'); return null; }

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const fireEvent = useCallback(async (eventType: string, metadata: Record<string, unknown>, label: string) => {
    setLoadingAction(label);
    try {
      await axios.post(`${API_BASE}/v1/events`,
        { wallet_address: walletAddress, event_type: eventType, metadata },
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      );
      showToast(`✅ ${label} — processing rewards...`);
      setTimeout(() => fetchProfile(), 3000);
    } catch {
      showToast(`❌ ${label} failed`, 'error');
    } finally {
      setLoadingAction(null);
    }
  }, [walletAddress, fetchProfile]);

  const currentPoints = parseInt(profile?.current_points ?? '0');
  const tier = profile?.tier ?? 'bronze';
  const nextTierPoints = TIER_NEXT[tier];
  const tierMin = TIER_THRESHOLDS[tier] ?? 0;
  const tierProgress = nextTierPoints
    ? Math.min(100, ((currentPoints - tierMin) / (nextTierPoints - tierMin)) * 100)
    : 100;

  const abbrev = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  const actions = [
    { label: 'Create Project', emoji: '📁', color: 'from-blue-600 to-blue-800', onClick: () => fireEvent('milestone', { milestone_name: 'project_created' }, 'Create Project') },
    { label: 'Upgrade to Pro', emoji: '⭐', color: 'from-purple-600 to-purple-800', onClick: () => fireEvent('subscription', { plan: 'pro', billing_cycle: 'monthly' }, 'Upgrade to Pro') },
    { label: 'Export Report', emoji: '📊', color: 'from-green-600 to-green-800', onClick: () => fireEvent('feature_usage', { feature_name: 'export', count: 1 }, 'Export Report') },
    { label: 'Make Payment ($75)', emoji: '💳', color: 'from-yellow-600 to-yellow-800', onClick: () => fireEvent('purchase', { amount: 75, currency: 'USD' }, 'Make Payment') },
  ];

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 p-5 flex flex-col gap-1 shrink-0">
        <div className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">⚡</span> TaskForge
        </div>
        {[
          { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
          { to: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
          { to: '/referral', icon: '🔗', label: 'Referrals' },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="flex items-center gap-3 text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            <span>{item.icon}</span> {item.label}
          </Link>
        ))}
        <div className="mt-auto pt-4 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-2 px-3">Connected as</div>
          <div className="text-xs text-gray-400 px-3 mb-3 font-mono">{abbrev(walletAddress ?? '')}</div>
          <button onClick={logout} className="w-full text-left text-red-400 hover:text-red-300 text-sm px-3 py-2 rounded-lg hover:bg-red-900/20 transition-colors">
            🚪 Disconnect
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="bg-gray-800 px-3 py-1.5 rounded-full text-gray-300 font-mono text-xs">{abbrev(walletAddress ?? '')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left column — actions + projects */}
          <div className="xl:col-span-2 space-y-6">
            {/* Action buttons */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-4">🎯 Actions — Earn Rewards</h2>
              <div className="grid grid-cols-2 gap-3">
                {actions.map((action) => (
                  <button key={action.label} onClick={action.onClick} disabled={loadingAction !== null}
                    className={`bg-gradient-to-br ${action.color} text-white rounded-xl p-4 text-left transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg`}>
                    <div className="text-3xl mb-2">{action.emoji}</div>
                    <div className="text-sm font-semibold">
                      {loadingAction === action.label ? <span className="animate-pulse">Processing...</span> : action.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Kanban */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-4">📋 Projects</h2>
              <div className="grid grid-cols-3 gap-4">
                {['To Do', 'In Progress', 'Done'].map((col) => (
                  <div key={col} className="bg-gray-800 rounded-xl p-3">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{col}</h3>
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="bg-gray-700 rounded-lg p-2.5 text-xs text-gray-300 border border-gray-600">
                          Task {col.charAt(0)}{i}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent rewards history */}
            {rewards.length > 0 && (
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-4">📜 Recent Rewards</h2>
                <div className="space-y-2">
                  {rewards.slice(0, 6).map((r) => {
                    const val = r.rewardValue as Record<string, unknown>;
                    const isPoints = r.rewardType === 'points';
                    const amount = val['amount'] as number;
                    const badgeId = val['badge_id'] as string;
                    return (
                      <div key={r.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{isPoints ? '⭐' : '🎖️'}</span>
                          <div>
                            <div className="text-sm text-gray-200">{r.reason ?? (isPoints ? `+${amount} points` : badgeId)}</div>
                            <div className="text-xs text-gray-500">{new Date(r.issuedAt).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className={`text-sm font-bold ${isPoints ? 'text-yellow-400' : 'text-purple-400'}`}>
                          {isPoints ? `+${amount} pts` : '🎖️'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right column — loyalty panel */}
          <div className="space-y-6">
            {/* Points + Tier card */}
            <div className={`rounded-2xl p-6 border ${TIER_BG[tier] ?? 'bg-gray-900 border-gray-800'}`}>
              <div className="text-center mb-4">
                <div className="text-5xl font-black text-white mb-1">{currentPoints.toLocaleString()}</div>
                <div className="text-gray-400 text-sm">loyalty points</div>
              </div>

              {/* Tier badge */}
              <div className="flex items-center justify-center mb-4">
                <span className="px-4 py-1.5 rounded-full text-sm font-bold capitalize border"
                  style={{ color: TIER_COLORS[tier], borderColor: TIER_COLORS[tier], background: `${TIER_COLORS[tier]}22` }}>
                  {tier === 'bronze' ? '🥉' : tier === 'silver' ? '🥈' : tier === 'gold' ? '🥇' : '💎'} {tier} tier
                </span>
              </div>

              {/* Progress bar */}
              {nextTierPoints && (
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>{currentPoints} pts</span>
                    <span>{nextTierPoints - currentPoints} to next tier</span>
                  </div>
                  <div className="bg-gray-700 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${tierProgress}%`, background: TIER_COLORS[tier] }} />
                  </div>
                </div>
              )}
              {!nextTierPoints && (
                <div className="text-center text-cyan-400 text-sm font-semibold">✨ Maximum tier reached!</div>
              )}
            </div>

            {/* Badges */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                🎖️ Badges <span className="bg-purple-800 text-purple-300 text-xs px-2 py-0.5 rounded-full">{badges.length}</span>
              </h2>
              {badges.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">🔒</div>
                  <div className="text-gray-500 text-sm">No badges yet</div>
                  <div className="text-gray-600 text-xs mt-1">Complete actions to unlock NFT badges</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {badges.map((badge) => (
                    <div key={badge.badge_id}
                      className={`rounded-xl p-3 border bg-gray-800 ${RARITY_COLORS[badge.rarity] ?? 'text-gray-400 border-gray-600'}`}>
                      <div className="text-2xl mb-1">🎖️</div>
                      <div className="text-xs font-semibold truncate">{badge.name}</div>
                      <div className="text-xs opacity-60 capitalize">{badge.rarity}</div>
                      {badge.on_chain_tx_hash && (
                        <a href={`https://sepolia.etherscan.io/tx/${badge.on_chain_tx_hash}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 mt-1 block truncate">
                          ⛓️ On-chain ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spin wheel */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">🎰 Spin Wheel</h2>
              <p className="text-gray-500 text-xs mb-4">Upgrade to Pro to unlock a spin wheel reward!</p>
              {spinResult && (
                <div className="bg-green-900/30 border border-green-700 rounded-xl p-3 mb-3 text-center">
                  <div className="text-green-400 text-sm font-semibold">🎉 {spinResult}</div>
                </div>
              )}
              <button
                onClick={async () => {
                  setSpinning(true);
                  setSpinResult(null);
                  await fireEvent('subscription', { plan: 'pro', billing_cycle: 'monthly' }, 'Spin Wheel');
                  setTimeout(() => {
                    setSpinResult('Spin triggered! Check your rewards.');
                    setSpinning(false);
                  }, 3000);
                }}
                disabled={spinning || loadingAction !== null}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl py-3 font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100">
                {spinning ? '🌀 Spinning...' : '🎰 Spin to Win!'}
              </button>
            </div>

            {/* Referral code */}
            {profile?.referral_code && (
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">🔗 Referral</h2>
                <div className="bg-gray-800 rounded-xl p-3 flex items-center justify-between gap-2">
                  <code className="text-purple-300 text-sm font-mono">{profile.referral_code}</code>
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(`${window.location.origin}?ref=${profile.referral_code}`);
                      showToast('📋 Referral link copied!');
                    }}
                    className="bg-purple-700 hover:bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0">
                    Copy
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-2">Share your link — earn 100 pts per referral</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 space-y-2 z-50 max-w-sm">
        {toasts.map((toast) => (
          <div key={toast.id}
            className={`px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border transition-all ${
              toast.type === 'reward' ? 'bg-purple-900 border-purple-600 text-purple-100' :
              toast.type === 'success' ? 'bg-green-900 border-green-700 text-green-100' :
              'bg-red-900 border-red-700 text-red-100'
            }`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
>>>>>>> 8fc7049efa9590d0897ca5583f8fb23e2671d7ee
}
