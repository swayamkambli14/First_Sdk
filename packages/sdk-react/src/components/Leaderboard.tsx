import React, { useState } from 'react';
import { useChainLoyalty } from '../context.js';
import { useLeaderboard } from '../hooks/useLeaderboard.js';
import type { LeaderboardPeriod } from '@chainloyalty/sdk';

export interface LeaderboardProps {
  currentWalletAddress?: string;
  limit?: number;
  defaultPeriod?: LeaderboardPeriod;
  showPeriodTabs?: boolean;
}

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'all_time', label: 'All Time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
];

function abbrevWallet(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function Leaderboard({
  currentWalletAddress,
  limit = 10,
  defaultPeriod = 'all_time',
  showPeriodTabs = true,
}: LeaderboardProps) {
  const { theme } = useChainLoyalty();
  const [period, setPeriod] = useState<LeaderboardPeriod>(defaultPeriod);
  const { leaderboard, isLoading } = useLeaderboard(period, limit);

  const primaryColor = theme.primaryColor ?? '#06b6d4';
  const isDark = theme.mode === 'dark' || (theme.mode !== 'light' && typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const bg = isDark ? '#0d0d14' : '#ffffff';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const text = isDark ? '#ffffff' : '#111827';
  const subtext = isDark ? '#9ca3af' : '#6b7280';

  const containerStyle: React.CSSProperties = {
    fontFamily: theme.fontFamily ?? 'system-ui, sans-serif',
    backgroundColor: bg,
    borderRadius: theme.borderRadius ?? '16px',
    border: `1px solid ${border}`,
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, color: text, fontSize: '15px' }}>Leaderboard</span>
        {showPeriodTabs && (
          <div style={{ display: 'flex', gap: '4px', background: cardBg, borderRadius: '8px', padding: '3px' }}>
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  cursor: 'pointer',
                  background: period === p.value ? `${primaryColor}20` : 'transparent',
                  color: period === p.value ? primaryColor : subtext,
                  fontWeight: period === p.value ? 600 : 400,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      {isLoading && !leaderboard ? (
        <div style={{ padding: '40px', textAlign: 'center', color: subtext, fontSize: '13px' }}>
          Loading...
        </div>
      ) : !leaderboard || leaderboard.entries.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: subtext, fontSize: '13px' }}>
          No entries yet — be the first on the leaderboard!
        </div>
      ) : (
        <div>
          {leaderboard.entries.map((entry, i) => {
            const isMe = currentWalletAddress &&
              entry.walletAddress.toLowerCase() === currentWalletAddress.toLowerCase();
            const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;

            return (
              <div
                key={entry.rank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  borderBottom: i < leaderboard.entries.length - 1 ? `1px solid ${border}` : 'none',
                  background: isMe ? `${primaryColor}08` : 'transparent',
                  gap: '12px',
                }}
              >
                <span style={{ width: '28px', fontFamily: 'monospace', fontSize: '12px', color: subtext, flexShrink: 0 }}>
                  {medal ?? `#${entry.rank}`}
                </span>
                <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px', color: text }}>
                  {abbrevWallet(entry.walletAddress)}
                  {isMe && (
                    <span style={{ marginLeft: '6px', fontSize: '10px', background: `${primaryColor}20`, color: primaryColor, padding: '1px 6px', borderRadius: '10px' }}>
                      You
                    </span>
                  )}
                </span>
                <span style={{ fontSize: '11px', color: subtext, textTransform: 'capitalize', marginRight: '8px' }}>
                  {entry.tier}
                </span>
                <span style={{ fontWeight: 700, color: primaryColor, fontSize: '13px', fontFamily: 'monospace' }}>
                  {entry.points.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
