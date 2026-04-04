import { useState, useCallback } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import axios from 'axios';

const API_BASE = '/v1';
const APP_ID = import.meta.env['VITE_APP_ID'] ?? 'demo-app-id';

interface AuthState {
  isAuthenticated: boolean;
  walletAddress: string | null;
  tier: string | null;
  points: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook implementing the complete SIWE (Sign In With Ethereum) flow.
 * 1. GET /v1/auth/nonce with wallet address
 * 2. Sign the returned message with signMessageAsync()
 * 3. POST /v1/auth/verify — server sets httpOnly JWT cookie
 */
export function useChainLoyaltyAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    walletAddress: null,
    tier: null,
    points: null,
    isLoading: false,
    error: null,
  });

  const login = useCallback(async () => {
    if (!address) return;

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Get nonce
      const nonceRes = await axios.post(`${API_BASE}/auth/nonce`, {
        wallet_address: address,
      }, { headers: { 'x-app-id': APP_ID } });

      const { message } = nonceRes.data as { nonce: string; message: string };

      // Step 2: Sign the message with MetaMask
      const signature = await signMessageAsync({ message });

      // Step 3: Verify signature — server sets httpOnly cookie
      const verifyRes = await axios.post(
        `${API_BASE}/auth/verify`,
        { wallet_address: address, signature },
        { withCredentials: true, headers: { 'x-app-id': APP_ID } }
      );

      const userData = verifyRes.data as { walletAddress: string; tier: string; points: string };

      setAuthState({
        isAuthenticated: true,
        walletAddress: userData.walletAddress,
        tier: userData.tier,
        points: userData.points,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      // Plain-English error messages — no blockchain jargon
      let message = 'Something went wrong. Please try again.';
      if (err instanceof Error) {
        const raw = err.message.toLowerCase();
        if (raw.includes('user rejected') || raw.includes('user denied') || raw.includes('cancelled')) {
          message = 'No problem — you cancelled the sign-in.';
        } else if (raw.includes('nonce expired') || raw.includes('nonce')) {
          message = 'Your session expired. Please try again.';
        } else if (raw.includes('signature') || raw.includes('mismatch')) {
          message = 'Verification failed. Please try again.';
        } else if (raw.includes('network') || raw.includes('fetch')) {
          message = 'Connection issue. Check your internet and try again.';
        }
      }
      setAuthState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, [address, signMessageAsync]);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true });
    } catch {
      // Ignore logout errors — clear state regardless
    }
    disconnect();
    setAuthState({
      isAuthenticated: false,
      walletAddress: null,
      tier: null,
      points: null,
      isLoading: false,
      error: null,
    });
  }, [disconnect]);

  return {
    isConnected,
    isAuthenticated: authState.isAuthenticated,
    walletAddress: authState.walletAddress ?? address,
    tier: authState.tier,
    points: authState.points,
    login,
    logout,
    isLoading: authState.isLoading,
    error: authState.error,
  };
}
