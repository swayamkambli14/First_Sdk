import React, { useEffect, useState } from 'react';
import { useChainLoyalty } from '../context.js';
import { useRewards } from '../hooks/useRewards.js';
import { useReferral } from '../hooks/useReferral.js';
import type { BusinessTierConfig } from '@chainloyalty/sdk';

export interface RewardsDashboardProps {
  walletAddress: string;
  onRewardEarned?: (reward: unknown) => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#6b7280',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

function abbrevWallet(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function RewardsDashboard({ walletAddress, onRewardEarned }: RewardsDashboardProps) {
  const { client, theme } = useChainLoyalty();
  const { balance, badges, history, isLoading } = useRewards(walletAddress);
  const { stats: referralStats } = useReferral(walletAddress);
  const [tierConfig, setTierConfig] = useState<BusinessTierConfig | null>(null);
  const [copied, setCopied] = useState(false);

  // Load business tier config for currency name and tier definitions
  useEffect(() => {
    client.rules.getTierConfig()
      .then(setTierConfig)
      .catch(() => null);
  }, [client]);

  const currencyName = tierConfig?.currencyName ?? 'points';
  const primaryColor = theme.primaryColor ?? '#06b6d4';
  const isDark = theme.mode === 'dark' || (theme.mode !== 'light' && typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const bg = isDark ? '#0d0d14' : '#ffffff';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const text = isDark ? '#ffffff' : '#111827';
  const subtext = isDark ? '#9ca3af' : '#6b7280';

  // Tier progress
  const currentTier = balance?.tier ?? 'bronze';
  const tiers = tierConfig?.tiers ?? [];
  const tierIdx = tiers.findIndex((t) => t.name === currentTier);
  const nextTier = tiers[tierIdx + 1];
  const currentTierDef = tiers[tierIdx];
  const progress = nextTier && currentTierDef
    ? Math.min(100, Math.round(
        ((balance?.currentBalance ?? 0) - currentTierDef.min_points) /
        (nextTier.min_points - currentTierDef.min_points) * 100
      ))
    : 100;

  const copyReferral = () => {
    if (referralStats?.referralCode) {
      navigator.clipboard.writeText(referralStats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const containerStyle: React.CSSProperties = {
    fontFamily: theme.fontFamily ?? 'system-ui, sans-serif',
    backgroundColor: bg,
    borderRadius: theme.borderRadius ?? '16px',
    border: `1px solid ${border}`,
    padding: '20px',
    color: text,
    maxWidth: '400px',
    width: '100%',
    boxSizing: 'border-box',
  };

  if (isLoading && !balance) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '40px', color: subtext }}>
          Loading rewards...
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '11px', color: subtext, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>
            Wallet
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '13px', color: text }}>
            {abbrevWallet(walletAddress)}
          </div>
        </div>
        <div style={{
          background: `${primaryColor}20`,
          border: `1px solid ${primaryColor}40`,
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '12px',
          color: primaryColor,
          textTransform: 'capitalize',
        }}>
          {currentTier}
        </div>
      </div>

      {/* Points balance */}
      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: subtext, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
          {currencyName} balance
        </div>
        <div style={{ fontSize: '32px', fontWeight: 700, color: primaryColor }}>
          {(balance?.currentBalance ?? 0).toLocaleString()}
        </div>
        {nextTier && (
          <>
            <div style={{ height: '4px', background: border, borderRadius: '2px', margin: '10px 0 4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: primaryColor, borderRadius: '2px', transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ fontSize: '11px', color: subtext }}>
              {(nextTier.min_points - (balance?.currentBalance ?? 0)).toLocaleString()} {currencyName} to {nextTier.name}
            </div>
          </>
        )}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: subtext, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
            Badges ({badges.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {badges.slice(0, 6).map((badge) => (
              <div
                key={badge.badgeId}
                title={badge.badgeName}
                style={{
                  background: cardBg,
                  border: `1px solid ${RARITY_COLORS[badge.rarity] ?? border}40`,
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  color: RARITY_COLORS[badge.rarity] ?? subtext,
                }}
              >
                🏅 {badge.badgeName}
              </div>
            ))}
            {badges.length > 6 && (
              <div style={{ fontSize: '11px', color: subtext, padding: '6px 0' }}>
                +{badges.length - 6} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {history && history.rewards.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: subtext, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
            Recent Activity
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {history.rewards.slice(0, 4).map((r) => {
              const val = r.rewardValue as Record<string, unknown>;
              const pts = r.rewardType === 'points' ? Number(val['amount'] ?? 0) : 0;
              return (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ color: subtext }}>{r.reason ?? r.rewardType}</span>
                  {pts > 0 && <span style={{ color: primaryColor, fontWeight: 600 }}>+{pts} {currencyName}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Referral code */}
      {referralStats?.referralCode && (
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: subtext, marginBottom: '2px' }}>Referral Code</div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', color: primaryColor }}>{referralStats.referralCode}</div>
          </div>
          <button
            onClick={copyReferral}
            style={{
              background: `${primaryColor}20`,
              border: `1px solid ${primaryColor}40`,
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11px',
              color: primaryColor,
              cursor: 'pointer',
            }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !balance && (
        <div style={{ textAlign: 'center', padding: '20px', color: subtext, fontSize: '13px' }}>
          No rewards yet — start earning {currencyName}!
        </div>
      )}
    </div>
  );
}
