import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider, useAccount } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { wagmiConfig } from './config/wagmi';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ReferralPage from './pages/ReferralPage';
import { useChainLoyaltyAuth } from './hooks/useChainLoyaltyAuth';
import '@rainbow-me/rainbowkit/styles.css';
import './index.css';

const queryClient = new QueryClient();

// Check for referral code in URL on app load
const urlParams = new URLSearchParams(window.location.search);
const refCode = urlParams.get('ref');
if (refCode) {
  sessionStorage.setItem('referral_code', refCode);
}

/**
 * Gap #1 fix: Auto-trigger SIWE login when wallet connects.
 * Placed inside WagmiProvider so it can access wagmi hooks.
 */
function SiweAutoLogin() {
  const { isConnected } = useAccount();
  const { isAuthenticated, login } = useChainLoyaltyAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected && !isAuthenticated) {
      void login().then(() => navigate('/dashboard'));
    }
  }, [isConnected, isAuthenticated, login, navigate]);

  return null;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <BrowserRouter>
            <SiweAutoLogin />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/referral" element={<ReferralPage />} />
            </Routes>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
