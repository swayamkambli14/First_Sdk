import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  rank: number;
  wallet_address: string;
  tier: string;
  points: string;
}

export interface LeaderboardProps {
  appId: string;
  apiBaseUrl: string;
  limit?: number;
  period?: 'all_time' | 'monthly' | 'weekly';
  showCurrentUser?: boolean;
  currentWalletAddress?: string;
}

const TIER_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#00e5ff',
};

export function Leaderboard({
  appId,
  apiBaseUrl,
  limit = 10,
  period: initialPeriod = 'all_time',
  showCurrentUser = false,
  currentWalletAddress,
}: LeaderboardProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async (p: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiBaseUrl}/v1/leaderboard?app_id=${appId}&period=${p}&limit=${limit}`
      );
      const data = await res.json() as { leaderboard: LeaderboardEntry[] };
      setEntries(data.leaderboard ?? []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLeaderboard(period);
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => void fetchLeaderboard(period), 60_000);
    return () => clearInterval(interval);
  }, [period, appId, limit]);

  const isCurrentUser = (entry: LeaderboardEntry) =>
    showCurrentUser &&
    currentWalletAddress &&
    entry.wallet_address.toLowerCase().includes(
      currentWalletAddress.slice(2, 6).toLowerCase()
    );

  return (
    <div
      style={{
        background: '#111827',
        borderRadius: '12px',
        border: '1px solid #1f2937',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
        color: '#f9fafb',
      }}
    >
      {/* Period tabs */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', borderBottom: '1px solid #1f2937' }}>
        {(['all_time', 'monthly', 'weekly'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              background: period === p ? '#7c3aed' : '#1f2937',
              color: period === p ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: period === p ? 600 : 400,
            }}
          >
            {p === 'all_time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
      ) : entries.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>No data yet</div>
      ) : (
        entries.map((entry) => (
          <div
            key={entry.rank}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #1f2937',
              background: isCurrentUser(entry) ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
            }}
          >
            <span style={{ width: '32px', color: '#6b7280', fontSize: '13px', fontWeight: 600 }}>
              #{entry.rank}
            </span>
            <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px', color: '#d1d5db' }}>
              {entry.wallet_address}
              {isCurrentUser(entry) && (
                <span
                  style={{
                    marginLeft: '8px',
                    background: '#4c1d95',
                    color: '#c4b5fd',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    fontSize: '11px',
                  }}
                >
                  You
                </span>
              )}
            </span>
            <span
              style={{
                color: TIER_COLORS[entry.tier] ?? '#9ca3af',
                fontSize: '12px',
                textTransform: 'capitalize',
                marginRight: '16px',
                fontWeight: 600,
              }}
            >
              {entry.tier}
            </span>
            <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '14px' }}>
              {parseInt(entry.points).toLocaleString()}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
