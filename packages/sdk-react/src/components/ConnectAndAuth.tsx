import React from 'react';
import { useChainLoyalty } from '../context.js';

export interface ConnectAndAuthProps {
  onConnect?: () => void;
  isConnected?: boolean;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  error?: string | null;
  walletAddress?: string | null;
}

/**
 * A minimal connect + SIWE auth button component.
 * Designed to be composed with wagmi's ConnectButton or any wallet library.
 * Renders the appropriate state: disconnected → connected (needs sign) → authenticated.
 */
export function ConnectAndAuth({
  onConnect,
  isConnected = false,
  isAuthenticated = false,
  isLoading = false,
  error = null,
  walletAddress,
}: ConnectAndAuthProps) {
  const { theme } = useChainLoyalty();
  const primaryColor = theme.primaryColor ?? '#06b6d4';
  const isDark = theme.mode === 'dark' || (theme.mode !== 'light' && typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const bg = isDark ? '#0d0d14' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const text = isDark ? '#ffffff' : '#111827';
  const subtext = isDark ? '#9ca3af' : '#6b7280';

  const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    borderRadius: theme.borderRadius ?? '10px',
    border: 'none',
    background: primaryColor,
    color: '#000',
    fontWeight: 700,
    fontSize: '14px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.7 : 1,
    fontFamily: theme.fontFamily ?? 'system-ui, sans-serif',
  };

  const containerStyle: React.CSSProperties = {
    fontFamily: theme.fontFamily ?? 'system-ui, sans-serif',
    backgroundColor: bg,
    borderRadius: theme.borderRadius ?? '16px',
    border: `1px solid ${border}`,
    padding: '24px',
    textAlign: 'center',
    color: text,
  };

  if (isAuthenticated && walletAddress) {
    return (
      <div style={containerStyle}>
        <div style={{ fontSize: '20px', marginBottom: '8px' }}>✅</div>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Connected</div>
        <div style={{ fontFamily: 'monospace', fontSize: '12px', color: subtext }}>
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>🦊</div>
      <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>
        {isConnected ? 'Sign to Continue' : 'Connect Wallet'}
      </div>
      <div style={{ fontSize: '13px', color: subtext, marginBottom: '20px' }}>
        {isConnected
          ? 'Sign a message to verify wallet ownership. No gas fees.'
          : 'Connect MetaMask or WalletConnect to access your rewards.'}
      </div>
      {error && (
        <div style={{ background: '#ef444420', border: '1px solid #ef444440', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#ef4444', marginBottom: '12px' }}>
          {error}
        </div>
      )}
      <button onClick={onConnect} disabled={isLoading} style={btnStyle}>
        {isLoading ? 'Signing...' : isConnected ? 'Sign Message' : 'Connect Wallet'}
      </button>
    </div>
  );
}
