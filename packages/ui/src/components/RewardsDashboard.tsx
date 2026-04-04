import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Reward {
  id?: string;
  reward_type: string;
  reward_value: Record<string, unknown>;
  reason?: string;
  issued_at?: string;
  rule_id?: string;
}

interface Badge {
  badge_id: string;
  name: string;
  description?: string;
  image_url?: string;
  rarity: string;
  earned_at: string;
}

interface UserProfile {
  wallet_address: string;
  tier: string;
  current_points: string;
  total_points_earned: string;
  badge_count: number;
  referral_code: string;
}

interface TierConfig {
  name: string;
  min_points: number;
  next_min?: number;
}

const TIERS: TierConfig[] = [
  { name: 'bronze', min_points: 0, next_min: 500 },
  { name: 'silver', min_points: 500, next_min: 2000 },
  { name: 'gold', min_points: 2000, next_min: 10000 },
  { name: 'platinum', min_points: 10000 },
];

const TIER_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#00e5ff',
};

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#34d399',
  rare: '#60a5fa',
  epic: '#a78bfa',
  legendary: '#f59e0b',
};

export interface RewardsDashboardProps {
  appId: string;
  walletAddress: string;
  apiBaseUrl: string;
  theme?: {
    primaryColor?: string;
    borderRadius?: string;
    fontFamily?: string;
  };
  onRewardEarned?: (reward: Reward) => void;
}

export function RewardsDashboard({
  appId,
  walletAddress,
  apiBaseUrl,
  theme,
  onRewardEarned,
}: RewardsDashboardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [toasts, setToasts] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  const showToast = (msg: string) => {
    setToasts((prev) => [...prev, msg]);
    setTimeout(() => setToasts((prev) => prev.slice(1)), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, badgesRes, rewardsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/v1/users/${walletAddress}/profile`, { credentials: 'include' }),
        fetch(`${apiBaseUrl}/v1/users/${walletAddress}/badges`, { credentials: 'include' }),
        fetch(`${apiBaseUrl}/v1/users/${walletAddress}/rewards?limit=10`, { credentials: 'include' }),
      ]);

      if (profileRes.ok) setProfile(await profileRes.json() as UserProfile);
      if (badgesRes.ok) setBadges((await badgesRes.json() as { badges: Badge[] }).badges);
      if (rewardsRes.ok) setRewards((await rewardsRes.json() as { rewards: Reward[] }).rewards);
    } catch {
      // Silently fail — component degrades gracefully
    }
  }, [apiBaseUrl, walletAddress]);

  // WebSocket for real-time reward updates
  useEffect(() => {
    const s = io(apiBaseUrl, { withCredentials: true });
    setSocket(s);

    s.on('reward_earned', (reward: Reward) => {
      setRewards((prev) => [reward, ...prev.slice(0, 9)]);
      if (reward.reward_type === 'points') {
        const amount = (reward.reward_value as { amount?: number }).amount ?? 0;
        showToast(`🎉 You earned ${amount} points!`);
        // Refresh profile to get updated balance
        void fetchData();
      } else if (reward.reward_type === 'badge') {
        showToast(`🎖️ New badge unlocked!`);
        void fetchData();
      }
      onRewardEarned?.(reward);
    });

    return () => { s.disconnect(); };
  }, [apiBaseUrl, fetchData, onRewardEarned]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const tierInfo = TIERS.find((t) => t.name === profile?.tier) ?? TIERS[0]!;
  const currentPoints = parseInt(profile?.current_points ?? '0');
  const tierProgress = tierInfo.next_min
    ? Math.min(100, ((currentPoints - tierInfo.min_points) / (tierInfo.next_min - tierInfo.min_points)) * 100)
    : 100;

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      void navigator.clipboard.writeText(profile.referral_code);
      showToast('📋 Referral code copied!');
    }
  };

  const primaryColor = theme?.primaryColor ?? '#7c3aed';
  const borderRadius = theme?.borderRadius ?? '12px';

  return (
    <div
      style={{
        fontFamily: theme?.fontFamily ?? 'system-ui, sans-serif',
        borderRadius,
        background: '#111827',
        color: '#f9fafb',
        padding: '20px',
        maxWidth: '400px',
        border: '1px solid #1f2937',
      }}
    >
      {/* Points balance */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: primaryColor }}>
          {currentPoints.toLocaleString()}
        </div>
        <div style={{ color: '#9ca3af', fontSize: '14px' }}>points</div>
      </div>

      {/* Tier + progress */}
      {profile && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span
              style={{
                background: TIER_COLORS[profile.tier] + '33',
                color: TIER_COLORS[profile.tier],
                padding: '2px 10px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {profile.tier}
            </span>
            {tierInfo.next_min && (
              <span style={{ color: '#6b7280', fontSize: '12px' }}>
                {tierInfo.next_min - currentPoints} pts to next tier
              </span>
            )}
          </div>
          <div style={{ background: '#1f2937', borderRadius: '999px', height: '6px' }}>
            <div
              style={{
                background: TIER_COLORS[profile.tier] ?? primaryColor,
                width: `${tierProgress}%`,
                height: '100%',
                borderRadius: '999px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Badges</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {badges.map((badge) => (
              <div
                key={badge.badge_id}
                title={`${badge.name}: ${badge.description ?? ''}`}
                style={{
                  background: '#1f2937',
                  border: `1px solid ${RARITY_COLORS[badge.rarity] ?? '#374151'}`,
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  color: RARITY_COLORS[badge.rarity] ?? '#9ca3af',
                }}
              >
                🎖️ {badge.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent rewards */}
      {rewards.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Recent Rewards</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {rewards.slice(0, 5).map((r, i) => (
              <div
                key={i}
                style={{
                  background: '#1f2937',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ color: '#d1d5db' }}>{r.reason ?? r.reward_type}</span>
                <span style={{ color: primaryColor, fontWeight: 600 }}>
                  {r.reward_type === 'points'
                    ? `+${(r.reward_value as { amount?: number }).amount ?? 0} pts`
                    : '🎖️'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral code */}
      {profile?.referral_code && (
        <div
          style={{
            background: '#1f2937',
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>Referral Code</div>
            <div style={{ fontFamily: 'monospace', color: '#a78bfa', fontWeight: 600 }}>
              {profile.referral_code}
            </div>
          </div>
          <button
            onClick={copyReferralCode}
            style={{
              background: primaryColor,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Copy
          </button>
        </div>
      )}

      {/* Toast notifications */}
      <div style={{ position: 'fixed', bottom: '16px', right: '16px', zIndex: 9999 }}>
        {toasts.map((msg, i) => (
          <div
            key={i}
            style={{
              background: '#065f46',
              color: '#d1fae5',
              padding: '10px 16px',
              borderRadius: '8px',
              marginTop: '8px',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}
