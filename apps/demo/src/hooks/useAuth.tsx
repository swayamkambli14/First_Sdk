/**
 * Gap #1 fix: Replace Supabase email/password auth with wallet-native SIWE auth.
 * This re-exports useChainLoyaltyAuth as the primary auth hook so all existing
 * components that call useAuth() continue to work without changes.
 */
export { useChainLoyaltyAuth as useAuth } from './useChainLoyaltyAuth';

// Re-export AuthProvider as a no-op wrapper — wagmi/RainbowKit handle the
// wallet provider layer; no separate AuthProvider is needed.
import { ReactNode } from 'react';
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
