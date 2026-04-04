/**
 * Reads live burn analytics directly from BurnTracker + CLoyaltyToken on Sepolia.
 */
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getApiKey } from '../lib/api';

const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/YZtc-AuzXiZkr2BOVIvER';
const CLP_ADDR     = '0xC272844F17f4ce599474373c05A6B1AD98A7B8b4';
const TRACKER_ADDR = '0x0F7bBf6bdDEa66c1705A25a76c7bA3eed504c29A';

const CLP_ABI = [
  'function totalSupply() view returns (uint256)',
  'function totalBurned() view returns (uint256)',
  'function totalMinted() view returns (uint256)',
  'function totalRedeemed() view returns (uint256)',
  'function burnRateBps() view returns (uint256)',
  'function MAX_SUPPLY() view returns (uint256)',
];

const TRACKER_ABI = [
  'function allTimeBurned() view returns (uint256)',
  'function burnEventsCount() view returns (uint256)',
  'function getBurnedLast24Hours() view returns (uint256)',
  'function getBurnedLast7Days() view returns (uint256)',
  'function getBurnedLast30Days() view returns (uint256)',
  'function getBurnByType() view returns (uint256[5])',
  'function getRecentBurns(uint256) view returns (tuple(address wallet, uint256 amount, uint256 timestamp, uint8 burnType)[])',
];

export const BURN_TYPE_LABELS = ['Transfer Tax', 'Redemption', 'Fraud Penalty', 'Tier Decay', 'Badge Mint'];
export const BURN_TYPE_COLORS = ['#06b6d4', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981'];

function fmt(wei: bigint): string {
  const n = Number(ethers.formatEther(wei));
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export interface OnChainBurnData {
  // Token stats
  totalSupply: string;
  totalBurned: string;
  totalMinted: string;
  totalRedeemed: string;
  burnRatePct: string;
  maxSupply: string;
  circulatingPct: number;
  deflationPct: number; // totalBurned / totalMinted * 100

  // Tracker stats
  allTimeBurned: string;
  burnEventsCount: number;
  burned24h: string;
  burned7d: string;
  burned30d: string;

  // Chart data
  burnByType: Array<{ name: string; value: number; color: string }>;
  recentBurns: Array<{
    wallet: string;
    amount: string;
    timestamp: number;
    burnType: number;
    burnTypeLabel: string;
  }>;

  // Contract addresses for links
  clpAddress: string;
  trackerAddress: string;
}

export function useOnChainBurn() {
  const [data, setData] = useState<OnChainBurnData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetch = useCallback(async () => {
    if (!getApiKey() && !localStorage.getItem('cl_company_token')) return; // not logged in
    setLoading(true);
    setError(null);
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const clp     = new ethers.Contract(CLP_ADDR, CLP_ABI, provider);
      const tracker = new ethers.Contract(TRACKER_ADDR, TRACKER_ABI, provider);

      const [
        totalSupply, totalBurned, totalMinted, totalRedeemed, burnRateBps, maxSupply,
        allTimeBurned, burnEventsCount,
        burned24h, burned7d, burned30d,
        burnByTypeRaw, recentBurnsRaw,
      ] = await Promise.all([
        clp.totalSupply(),
        clp.totalBurned(),
        clp.totalMinted(),
        clp.totalRedeemed(),
        clp.burnRateBps(),
        clp.MAX_SUPPLY(),
        tracker.allTimeBurned(),
        tracker.burnEventsCount(),
        tracker.getBurnedLast24Hours(),
        tracker.getBurnedLast7Days(),
        tracker.getBurnedLast30Days(),
        tracker.getBurnByType(),
        tracker.getRecentBurns(20),
      ]);

      const circulatingPct = maxSupply > 0n
        ? (Number(totalSupply) / Number(maxSupply)) * 100
        : 0;

      const deflationPct = totalMinted > 0n
        ? (Number(totalBurned) / Number(totalMinted)) * 100
        : 0;

      const burnByType = (burnByTypeRaw as bigint[]).map((v, i) => ({
        name: BURN_TYPE_LABELS[i] ?? `Type ${i}`,
        value: Number(ethers.formatEther(v)),
        color: BURN_TYPE_COLORS[i] ?? '#888',
      })).filter((b) => b.value > 0);

      const recentBurns = (recentBurnsRaw as Array<{
        wallet: string; amount: bigint; timestamp: bigint; burnType: number;
      }>).map((b) => ({
        wallet: b.wallet,
        amount: fmt(b.amount),
        timestamp: Number(b.timestamp),
        burnType: Number(b.burnType),
        burnTypeLabel: BURN_TYPE_LABELS[Number(b.burnType)] ?? 'Unknown',
      }));

      setData({
        totalSupply: fmt(totalSupply),
        totalBurned: fmt(totalBurned),
        totalMinted: fmt(totalMinted),
        totalRedeemed: fmt(totalRedeemed),
        burnRatePct: `${(Number(burnRateBps) / 100).toFixed(2)}%`,
        maxSupply: fmt(maxSupply),
        circulatingPct: Math.round(circulatingPct * 10) / 10,
        deflationPct: Math.round(deflationPct * 10) / 10,
        allTimeBurned: fmt(allTimeBurned),
        burnEventsCount: Number(burnEventsCount),
        burned24h: fmt(burned24h),
        burned7d: fmt(burned7d),
        burned30d: fmt(burned30d),
        burnByType,
        recentBurns,
        clpAddress: CLP_ADDR,
        trackerAddress: TRACKER_ADDR,
      });
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to load on-chain data — check RPC connection');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch();
    const interval = setInterval(() => void fetch(), 30_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { data, loading, error, lastRefresh, refetch: fetch };
}
