import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ChainLoyaltyClient } from '@chainloyalty/sdk';
import type { ChainLoyaltyConfig } from '@chainloyalty/sdk';

export interface ChainLoyaltyTheme {
  primaryColor?: string;
  backgroundColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  mode?: 'light' | 'dark' | 'auto';
}

export interface ChainLoyaltyContextValue {
  client: ChainLoyaltyClient;
  appId: string;
  theme: ChainLoyaltyTheme;
}

const ChainLoyaltyContext = createContext<ChainLoyaltyContextValue | null>(null);

export interface ChainLoyaltyProviderProps {
  appId: string;
  baseUrl?: string;
  apiKey?: string;
  theme?: ChainLoyaltyTheme;
  children: ReactNode;
}

/**
 * ChainLoyaltyProvider — wrap your app with this to configure the SDK once.
 * All hooks and components inside automatically inherit appId, baseUrl, and theme.
 *
 * <ChainLoyaltyProvider appId="..." baseUrl="..." theme={{ primaryColor: '#6366f1' }}>
 *   <YourApp />
 * </ChainLoyaltyProvider>
 */
export function ChainLoyaltyProvider({
  appId,
  baseUrl,
  apiKey,
  theme = {},
  children,
}: ChainLoyaltyProviderProps) {
  const client = useMemo(() => {
    const config: ChainLoyaltyConfig = { appId, baseUrl, apiKey };
    return new ChainLoyaltyClient(config);
  }, [appId, baseUrl, apiKey]);

  const value = useMemo<ChainLoyaltyContextValue>(
    () => ({ client, appId, theme }),
    [client, appId, theme]
  );

  return (
    <ChainLoyaltyContext.Provider value={value}>
      {children}
    </ChainLoyaltyContext.Provider>
  );
}

export function useChainLoyalty(): ChainLoyaltyContextValue {
  const ctx = useContext(ChainLoyaltyContext);
  if (!ctx) {
    throw new Error('useChainLoyalty must be used inside <ChainLoyaltyProvider>');
  }
  return ctx;
}
