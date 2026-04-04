import { useState, useCallback } from 'react';
import { useChainLoyalty } from '../context.js';
import { ChainLoyaltyError } from '@chainloyalty/sdk';

interface AuthState {
  isAuthenticated: boolean;
  walletAddress: string | null;
  tier: string | null;
  points: string | null;
  isLoading: boolean;
  error: string | null;
}

interface UseChainLoyaltyAuthResult extends AuthState {
  login: (walletAddress: string, signMessage: (msg: string) => Promise<string>) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * SIWE authentication hook.
 * Requires a signMessage function from wagmi or any wallet library.
 *
 * Usage:
 *   const { login, logout, isAuthenticated } = useChainLoyaltyAuth();
 *   const { signMessageAsync } = useSignMessage(); // from wagmi
 *   await login(address, (msg) => signMessageAsync({ message: msg }));
 */
export function useChainLoyaltyAuth(): UseChainLoyaltyAuthResult {
  const { client } = useChainLoyalty();

  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    walletAddress: null,
    tier: null,
    points: null,
    isLoading: false,
    error: null,
  });

  const login = useCallback(async (
    walletAddress: string,
    signMessage: (msg: string) => Promise<string>
  ) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { message } = await client.auth.getNonce(walletAddress);
      const signature = await signMessage(message);
      const result = await client.auth.verify(walletAddress, signature);

      setState({
        isAuthenticated: true,
        walletAddress: result.walletAddress,
        tier: result.tier,
        points: result.points,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const msg = err instanceof ChainLoyaltyError ? err.message : 'Authentication failed';
      setState((prev) => ({ ...prev, isLoading: false, error: msg }));
    }
  }, [client]);

  const logout = useCallback(async () => {
    try { await client.auth.logout(); } catch { /* ignore */ }
    setState({ isAuthenticated: false, walletAddress: null, tier: null, points: null, isLoading: false, error: null });
  }, [client]);

  return { ...state, login, logout };
}
