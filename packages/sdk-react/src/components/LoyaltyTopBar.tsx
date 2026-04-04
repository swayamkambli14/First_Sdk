/**
 * LoyaltyTopBar — embeddable balance widget for any nav bar.
 * Zero blockchain language. Works for both custodial and web3 users.
 * Requires only an API key + userId (email, wallet, or UUID).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface LoyaltyTopBarProps {
  appId: string;
  userId: string;
  apiKey: string;
  apiBaseUrl?: string;
  onRewardsClick?: () => void;
  position?: 'top-right' | 'inline';
  theme?: {
    background?: string;
    textColor?: string;
    accentColor?: string;
    borderRadius?: string;
  };
}

interface Summary {
  displayName: string;
  tier: string;
  tierDisplayName: string;
  balance: number;
  currencyName: string;
  nextTierName: string | null;
  pointsToNextTier: number;
  nextTierProgress: number;
  badgeCount: number;
  recentRewards: Array<{ id: string; description: string; issuedAt: string }>;
}

const TIER_ICONS: Record<string, string> = {
  bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎', default: '⭐',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function LoyaltyTopBar({
  appId, userId, apiKey, apiBaseUrl = 'http://localhost:3000',
  onRewardsClick, position = 'top-right', theme = {},
}: LoyaltyTopBarProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [open, setOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [prevBalance, setPrevBalance] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevBalanceRef = useRef<number | null>(null);

  const bg = theme.background ?? '#0d0d14';
  const text = theme.textColor ?? '#ffffff';
  const accent = theme.accentColor ?? '#06b6d4';
  const radius = theme.borderRadius ?? '12px';

  const fetchSummary = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${apiBaseUrl}/v1/users/${encodeURIComponent(userId)}/summary`, {
        headers: { Authorization: `Bearer ${apiKey}`, 'x-app-id': appId },
      });
      if (!res.ok) return;
      const data = await res.json() as Summary;

      // Animate balance tick-up if it increased
      if (prevBalanceRef.current !== null && data.balance > prevBalanceRef.current) {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 1200);
      }
      prevBalanceRef.current = data.balance;
      setSummary(data);
    } catch { /* silent — widget should never crash the host page */ }
  }, [userId, apiKey, appId, apiBaseUrl]);

  // Initial load + 30s refresh
  useEffect(() => {
    void fetchSummary();
    const interval = setInterval(() => void fetchSummary(), 30_000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!summary) return null;

  const tierIcon = TIER_ICONS[summary.tier] ?? TIER_ICONS.default;
  const initials = summary.displayName.slice(0, 2).toUpperCase();

  const widgetStyle: React.CSSProperties = {
    position: position === 'top-right' ? 'fixed' : 'relative',
    top: position === 'top-right' ? 12 : undefined,
    right: position === 'top-right' ? 16 : undefined,
    zIndex: position === 'top-right' ? 99999 : undefined,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  return (
    <div style={widgetStyle} ref={panelRef}>
      {/* Top bar pill */}
      <button
        onClick={() => onRewardsClick ? onRewardsClick() : setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: bg, color: text, border: `1px solid ${accent}33`,
          borderRadius: radius, padding: '6px 12px', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, height: 40,
          boxShadow: `0 0 12px ${accent}22`,
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: 16 }}>{tierIcon}</span>
        <span style={{
          color: accent,
          transition: 'transform 0.3s',
          transform: animating ? 'scale(1.15)' : 'scale(1)',
          display: 'inline-block',
        }}>
          {summary.balance.toLocaleString()}
        </span>
        <span style={{ color: `${text}99`, fontSize: 12 }}>{summary.currencyName}</span>
        <span style={{
          width: 1, height: 16, background: `${text}22`, margin: '0 4px',
        }} />
        <span style={{
          width: 26, height: 26, borderRadius: '50%',
          background: `${accent}22`, color: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700,
        }}>
          {initials}
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 48, right: 0,
          width: 320, background: bg, border: `1px solid ${accent}33`,
          borderRadius: radius, boxShadow: `0 16px 40px rgba(0,0,0,0.5)`,
          overflow: 'hidden', zIndex: 100000,
          animation: 'cl-slide-down 0.15s ease-out',
        }}>
          {/* Tier progress */}
          <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${text}11` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>
                {tierIcon} {summary.tierDisplayName}
              </span>
              <span style={{ color: accent, fontWeight: 700, fontSize: 14 }}>
                {summary.balance.toLocaleString()} {summary.currencyName}
              </span>
            </div>
            {summary.nextTierName && (
              <>
                <div style={{
                  height: 6, background: `${text}15`, borderRadius: 3, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${summary.nextTierProgress}%`,
                    background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                    borderRadius: 3, transition: 'width 0.8s ease',
                  }} />
                </div>
                <p style={{ color: `${text}66`, fontSize: 11, marginTop: 6 }}>
                  {summary.pointsToNextTier.toLocaleString()} more {summary.currencyName} to reach {summary.nextTierName}
                </p>
              </>
            )}
          </div>

          {/* Recent rewards */}
          {summary.recentRewards.length > 0 && (
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${text}11` }}>
              <p style={{ color: `${text}55`, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Recent
              </p>
              {summary.recentRewards.map((r) => (
                <div key={r.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  marginBottom: 8,
                }}>
                  <span style={{ color: text, fontSize: 12, flex: 1, lineHeight: 1.4 }}>
                    {r.description}
                  </span>
                  <span style={{ color: `${text}44`, fontSize: 11, marginLeft: 8, flexShrink: 0 }}>
                    {timeAgo(r.issuedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setOpen(false); onRewardsClick?.(); }}
              style={{
                flex: 1, padding: '8px 0', background: `${accent}22`,
                color: accent, border: `1px solid ${accent}44`,
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              View All Rewards
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                flex: 1, padding: '8px 0', background: 'transparent',
                color: `${text}88`, border: `1px solid ${text}22`,
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Invite Friends
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cl-slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
