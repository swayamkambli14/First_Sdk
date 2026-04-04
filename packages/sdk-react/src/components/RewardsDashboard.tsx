/**
 * RewardsDashboard — non-tech-first rewards UI.
 * Zero blockchain language. Readable by anyone.
 * Sections: Hero Balance → How to Earn → Achievements → Activity → Refer Friends
 */
import React, { useState } from 'react';
import { useChainLoyalty } from '../context.js';
import { useRewards } from '../hooks/useRewards.js';
import { useReferral } from '../hooks/useReferral.js';
import type { Badge, RewardRecord } from '@chainloyalty/sdk';

export interface RewardsDashboardProps {
  walletAddress: string | null | undefined;
  currencyName?: string;
  tierName?: string;
  nextTierName?: string;
  pointsToNextTier?: number;
  nextTierProgress?: number;
  onInviteFriends?: () => void;
  theme?: 'dark' | 'light';
}

const RARITY_COLORS: Record<string, string> = {
  common: 'border-white/10',
  uncommon: 'border-green-500/30',
  rare: 'border-blue-500/30',
  epic: 'border-purple-500/30',
  legendary: 'border-amber-500/40',
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary',
};

function rewardDescription(r: RewardRecord, currencyName: string): string {
  const val = r.rewardValue as Record<string, unknown>;
  if (r.rewardType === 'points') {
    const amt = Number(val['amount'] ?? 0);
    if (r.reason?.toLowerCase().includes('purchase')) return `🛒 You earned ${amt} ${currencyName} for your purchase`;
    if (r.reason?.toLowerCase().includes('referral')) return `👥 Referral bonus: ${amt} ${currencyName}`;
    if (r.reason?.toLowerCase().includes('spin')) return `🎰 Lucky spin! You won ${amt} ${currencyName}`;
    if (r.reason?.toLowerCase().includes('tier')) return `⭐ Level up bonus: ${amt} ${currencyName}`;
    return `🎁 You earned ${amt} ${currencyName}`;
  }
  if (r.rewardType === 'badge') {
    const name = String(val['badge_name'] ?? val['badge_id'] ?? 'Achievement');
    return `🏆 You unlocked the ${name} achievement`;
  }
  return `🎁 ${r.reason ?? 'Reward received'}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function RewardsDashboard({
  walletAddress,
  currencyName = 'Points',
  tierName = 'Bronze',
  nextTierName,
  pointsToNextTier = 0,
  nextTierProgress = 0,
  onInviteFriends,
  theme = 'dark',
}: RewardsDashboardProps) {
  const { balance, badges, history, isLoading } = useRewards(walletAddress);
  const { stats: referralStats } = useReferral(walletAddress);
  const [copied, setCopied] = useState(false);

  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50';
  const card = isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const muted = isDark ? 'text-gray-400' : 'text-gray-500';

  const currentBalance = balance?.currentBalance ?? 0;
  const referralLink = referralStats
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join?ref=${referralStats.referralCode}`
    : '';

  const copyLink = () => {
    if (referralLink) {
      void navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading && !balance) {
    return (
      <div className={`${bg} min-h-screen p-6 space-y-4`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`${card} border rounded-2xl h-32 animate-pulse`} />
        ))}
      </div>
    );
  }

  return (
    <div className={`${bg} min-h-screen p-4 lg:p-8 space-y-6 font-sans`}>

      {/* ── Section 1: Hero Balance ─────────────────────────────────────────── */}
      <div className={`${card} border rounded-2xl p-6`}>
        <p className={`${muted} text-xs uppercase tracking-widest mb-2`}>Your Balance</p>
        <p className="text-5xl font-bold text-amber-400 mb-1">
          {currentBalance.toLocaleString()}
        </p>
        <p className={`${muted} text-sm mb-4`}>{currencyName} · {tierName}</p>

        {nextTierName && (
          <>
            <div className={`h-2 ${isDark ? 'bg-white/10' : 'bg-gray-100'} rounded-full overflow-hidden mb-2`}>
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-1000"
                style={{ width: `${nextTierProgress}%` }}
              />
            </div>
            <p className={`${muted} text-xs`}>
              {pointsToNextTier.toLocaleString()} more {currencyName} until {nextTierName}
            </p>
          </>
        )}
      </div>

      {/* ── Section 2: How to Earn More ─────────────────────────────────────── */}
      <div>
        <h2 className={`${text} font-bold text-lg mb-3`}>How to earn more {currencyName}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '🛒', title: 'Make a purchase', desc: `Earn ${currencyName} every time you buy` },
            { icon: '👥', title: 'Invite a friend', desc: `You both earn bonus ${currencyName}` },
            { icon: '🎰', title: 'Spin the wheel', desc: `Win surprise ${currencyName} rewards` },
          ].map((item) => (
            <div key={item.title} className={`${card} border rounded-xl p-4`}>
              <span className="text-2xl mb-2 block">{item.icon}</span>
              <p className={`${text} font-semibold text-sm mb-1`}>{item.title}</p>
              <p className={`${muted} text-xs`}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Achievements ─────────────────────────────────────────── */}
      <div>
        <h2 className={`${text} font-bold text-lg mb-3`}>Your Achievements</h2>
        {badges.length === 0 ? (
          <div className={`${card} border rounded-2xl p-8 text-center`}>
            <p className="text-4xl mb-3">🏅</p>
            <p className={`${text} font-semibold mb-1`}>No achievements yet</p>
            <p className={`${muted} text-sm`}>Keep earning {currencyName} to unlock special badges</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {badges.map((badge: Badge) => (
              <div
                key={badge.badgeId}
                className={`${card} border ${RARITY_COLORS[badge.rarity] ?? 'border-white/10'} rounded-xl p-4 text-center`}
              >
                <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'} flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-2xl">🏅</span>
                </div>
                <p className={`${text} font-semibold text-xs mb-1 leading-tight`}>{badge.badgeName}</p>
                <p className={`${muted} text-[10px] capitalize`}>{RARITY_LABELS[badge.rarity] ?? badge.rarity}</p>
                {badge.onChainTxHash && (
                  <p className="text-cyan-400 text-[10px] mt-1">✓ Verified</p>
                )}
              </div>
            ))}
            {/* Locked placeholder badges for aspiration */}
            {badges.length < 6 && [...Array(Math.min(3, 6 - badges.length))].map((_, i) => (
              <div key={`locked-${i}`} className={`${card} border border-dashed ${isDark ? 'border-white/10' : 'border-gray-200'} rounded-xl p-4 text-center opacity-40`}>
                <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'} flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-2xl">🔒</span>
                </div>
                <p className={`${muted} text-xs`}>Keep earning to unlock</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 4: Activity Feed ─────────────────────────────────────────── */}
      <div>
        <h2 className={`${text} font-bold text-lg mb-3`}>Recent Activity</h2>
        <div className={`${card} border rounded-2xl overflow-hidden`}>
          {!history || history.rewards.length === 0 ? (
            <div className="p-8 text-center">
              <p className={`${muted} text-sm`}>No activity yet — start earning {currencyName}!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {history.rewards.slice(0, 8).map((r: RewardRecord) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                  <p className={`${text} text-sm`}>{rewardDescription(r, currencyName)}</p>
                  <p className={`${muted} text-xs ml-4 flex-shrink-0`}>{timeAgo(r.issuedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 5: Refer Friends ─────────────────────────────────────────── */}
      <div>
        <h2 className={`${text} font-bold text-lg mb-3`}>Invite Friends, Earn Together</h2>
        <div className={`${card} border rounded-2xl p-6`}>
          <p className={`${muted} text-sm mb-4`}>
            Share your link. When friends join and make their first purchase, you both earn bonus {currencyName}.
          </p>
          {referralStats && (
            <div className="flex items-center gap-2 mb-4">
              <div className={`flex-1 ${isDark ? 'bg-black/30 border-white/10' : 'bg-gray-50 border-gray-200'} border rounded-xl px-4 py-3 font-mono text-sm text-cyan-400 truncate`}>
                {referralLink}
              </div>
              <button
                onClick={copyLink}
                className="px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl transition-all"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          )}
          <div className="flex gap-4 text-center">
            <div>
              <p className={`${text} font-bold text-xl`}>{referralStats?.confirmedReferrals ?? 0}</p>
              <p className={`${muted} text-xs`}>Friends joined</p>
            </div>
            <div>
              <p className="text-amber-400 font-bold text-xl">{(referralStats?.confirmedReferrals ?? 0) * 100}</p>
              <p className={`${muted} text-xs`}>{currencyName} earned from referrals</p>
            </div>
          </div>
          {onInviteFriends && (
            <button
              onClick={onInviteFriends}
              className="mt-4 w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm rounded-xl transition-all"
            >
              Share & Earn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
