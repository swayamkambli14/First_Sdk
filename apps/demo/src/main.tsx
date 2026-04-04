import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { wagmiConfig } from './config/wagmi';
import LandingPage from './pages/LandingPage';
import JoinPage from './pages/JoinPage';
import DashboardPage from './pages/DashboardPage';
import RewardsPage from './pages/RewardsPage';
import SpinPage from './pages/SpinPage';
import ReferralPage from './pages/ReferralPage';
import LeaderboardPage from './pages/LeaderboardPage';
import '@rainbow-me/rainbowkit/styles.css';
import './index.css';

const queryClient = new QueryClient();

// Capture referral code from URL
const urlParams = new URLSearchParams(window.location.search);
const refCode = urlParams.get('ref');
if (refCode) sessionStorage.setItem('referral_code', refCode);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/join" element={<JoinPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/rewards" element={<RewardsPage />} />
              <Route path="/spin" element={<SpinPage />} />
              <Route path="/referral" element={<ReferralPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
