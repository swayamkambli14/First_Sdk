/**
 * useChainData — reads live on-chain state from all deployed contracts.
 * Uses ethers.js with a public Alchemy RPC (read-only, no wallet needed).
 *
 * Contracts:
 *   CLoyaltyToken  — CLP balance, totalBurned, totalMinted, burnRateBps
 *   BurnTracker    — allTimeBurned, burnEventsCount, window stats, recent burns
 *   BadgeNFT       — badge ownership per tokenId
 *   ReferralRegistry — referral count on-chain
 */
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const RPC_URL = import.meta.env['VITE_BLOCKCHAIN_RPC_URL'] ?? 'https://eth-sepolia.g.alchemy.com/v2/YZtc-AuzXiZkr2BOVIvER';

const CLP_ADDRESS       = '0xC272844F17f4ce599474373c05A6B1AD98A7B8b4';
const BURN_TRACKER_ADDR = '0x0F7bBf6bdDEa66c1705A25a76c7bA3eed504c29A';
const BADGE_NFT_ADDR    = '0x78c7B78F3ef9f1d5216B74CDd3f56D74862DA9ab';
const REFERRAL_REG_ADDR = '0x4183CBf823E347651bEaAd15546ea1c74BF09D86';

// Minimal ABIs — only what we need
const CLP_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function totalBurned() view returns (uint256)',
  'function totalMinted() view returns (uint256)',
  'function totalRedeemed() view returns (uint256)',
  'function burnRateBps() view returns (uint256)',
  'function MAX_SUPPLY() view returns (uint256)',
  'function userBurnedAmount(address) view returns (uint256)',
];

const BURN_TRACKER_ABI = [
  'function allTimeBurned() view returns (uint256)',
  'function burnEventsCount() view returns (uint256)',
  'function getBurnedLast24Hours() view returns (uint256)',
  'function getBurnedLast7Days() view returns (uint256)',
  'function getBurnedLast30Days() view returns (uint256)',
  'function getBurnByType() view returns (uint256[5])',
  'function getRecentBurns(uint256) view returns (tuple(address wallet, uint256 amount, uint256 timestamp, uint8 burnType)[])',
];

const BADGE_NFT_ABI = [
  'function balanceOf(address, uint256) view returns (uint256)',
  'function isValidBadge(address, uint256) view returns (bool)',
];

const REFERRAL_ABI = [
  'function getReferralCount(address) view returns (uint256)',
  'function referredBy(address) view returns (address)',
];

export interface ChainStats {
  // CLP token
  clpBalance: string;        // formatted, e.g. "1,234.56"
  clpBalanceRaw: bigint;
  totalSupply: string;
  totalBurned: string;
  totalMinted: string;
  totalRedeemed: string;
  burnRatePct: string;       // e.g. "1.00%"
  maxSupply: string;
  userBurned: string;
  circulatingPct: string;    // totalSupply / maxSupply * 100

  // BurnTracker
  allTimeBurned: string;
  burnEventsCount: number;
  burned24h: string;
  burned7d: string;
  burned30d: string;
  burnByType: [string, string, string, string, string]; // [transfer, redemption, fraud, decay, badge]
  recentBurns: Array<{
    wallet: string;
    amount: string;
    timestamp: number;
    burnType: number;
    burnTypeLabel: string;
  }>;

  // Referral
  onChainReferralCount: number;
  referredBy: string | null;
}

const BURN_TYPE_LABELS = ['Transfer Tax', 'Redemption', 'Fraud Penalty', 'Tier Decay', 'Badge Mint'];

function fmt(wei: bigint, decimals = 18): string {
  const n = Number(ethers.formatUnits(wei, decimals));
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function useChainData(walletAddress?: string | null) {
  const [data, setData] = useState<ChainStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const clp     = new ethers.Contract(CLP_ADDRESS, CLP_ABI, provider);
      const tracker = new ethers.Contract(BURN_TRACKER_ADDR, BURN_TRACKER_ABI, provider);
      const referral = new ethers.Contract(REFERRAL_REG_ADDR, REFERRAL_ABI, provider);

      const addr = walletAddress ?? ethers.ZeroAddress;

      const [
        clpBal, totalSupply, totalBurned, totalMinted, totalRedeemed,
        burnRateBps, maxSupply, userBurned,
        allTimeBurned, burnEventsCount,
        burned24h, burned7d, burned30d,
        burnByType, recentBurnsRaw,
        refCount, refBy,
      ] = await Promise.all([
        clp.balanceOf(addr),
        clp.totalSupply(),
        clp.totalBurned(),
        clp.totalMinted(),
        clp.totalRedeemed(),
        clp.burnRateBps(),
        clp.MAX_SUPPLY(),
        clp.userBurnedAmount(addr),
        tracker.allTimeBurned(),
        tracker.burnEventsCount(),
        tracker.getBurnedLast24Hours(),
        tracker.getBurnedLast7Days(),
        tracker.getBurnedLast30Days(),
        tracker.getBurnByType(),
        tracker.getRecentBurns(10),
        referral.getReferralCount(addr),
        referral.referredBy(addr),
      ]);

      const circulatingPct = maxSupply > 0n
        ? ((Number(totalSupply) / Number(maxSupply)) * 100).toFixed(1)
        : '0';

      const recentBurns = (recentBurnsRaw as Array<{ wallet: string; amount: bigint; timestamp: bigint; burnType: number }>).map((b) => ({
        wallet: b.wallet,
        amount: fmt(b.amount),
        timestamp: Number(b.timestamp),
        burnType: Number(b.burnType),
        burnTypeLabel: BURN_TYPE_LABELS[Number(b.burnType)] ?? 'Unknown',
      }));

      setData({
        clpBalance: fmt(clpBal),
        clpBalanceRaw: clpBal,
        totalSupply: fmt(totalSupply),
        totalBurned: fmt(totalBurned),
        totalMinted: fmt(totalMinted),
        totalRedeemed: fmt(totalRedeemed),
        burnRatePct: `${(Number(burnRateBps) / 100).toFixed(2)}%`,
        maxSupply: fmt(maxSupply),
        userBurned: fmt(userBurned),
        circulatingPct,
        allTimeBurned: fmt(allTimeBurned),
        burnEventsCount: Number(burnEventsCount),
        burned24h: fmt(burned24h),
        burned7d: fmt(burned7d),
        burned30d: fmt(burned30d),
        burnByType: (burnByType as bigint[]).map(fmt) as [string, string, string, string, string],
        recentBurns,
        onChainReferralCount: Number(refCount),
        referredBy: refBy === ethers.ZeroAddress ? null : refBy as string,
      });
    } catch (err) {
      setError('Failed to load on-chain data');
      console.error('useChainData error:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    void fetch();
    // Refresh every 30s
    const interval = setInterval(() => void fetch(), 30_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
