// Provider
export { ChainLoyaltyProvider, useChainLoyalty } from './context.js';
export type { ChainLoyaltyProviderProps, ChainLoyaltyTheme, ChainLoyaltyContextValue } from './context.js';

// Hooks
export { useRewards } from './hooks/useRewards.js';
export { useLeaderboard } from './hooks/useLeaderboard.js';
export { useReferral } from './hooks/useReferral.js';
export { useChainLoyaltyAuth } from './hooks/useChainLoyaltyAuth.js';

// Components
export { RewardsDashboard } from './components/RewardsDashboard.js';
export type { RewardsDashboardProps } from './components/RewardsDashboard.js';
export { LoyaltyTopBar } from './components/LoyaltyTopBar.js';
export type { LoyaltyTopBarProps } from './components/LoyaltyTopBar.js';
export { Leaderboard } from './components/Leaderboard.js';
export type { LeaderboardProps } from './components/Leaderboard.js';
export { SpinWheelModal } from './components/SpinWheelModal.js';
export type { SpinWheelModalProps } from './components/SpinWheelModal.js';
export { ConnectAndAuth } from './components/ConnectAndAuth.js';
export type { ConnectAndAuthProps } from './components/ConnectAndAuth.js';

// Re-export core SDK for convenience
export { ChainLoyaltyClient, ChainLoyaltyError } from '@chainloyalty/sdk';
export type {
  ChainLoyaltyConfig,
  BusinessRule,
  BusinessTierConfig,
  TierDefinition,
  SpinPoolEntry,
  LeaderboardPeriod,
  UserProfile,
  Badge,
  RewardHistory,
  ReferralStats,
} from '@chainloyalty/sdk';
