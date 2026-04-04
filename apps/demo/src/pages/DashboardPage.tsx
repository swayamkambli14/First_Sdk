import { useState, useEffect } from 'react';
import DashboardShell from '../components/dashboard/DashboardShell';
import WalletGate from '../components/dashboard/WalletGate';
import Onboarding from '../components/Onboarding';
import { useChainLoyaltyAuth } from '../hooks/useChainLoyaltyAuth';
import { useAccount } from 'wagmi';
import axios from 'axios';

export default function DashboardPage() {
  const { isAuthenticated } = useChainLoyaltyAuth();
  const { isConnected } = useAccount();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Determine if user is signed in via either path:
  // - SIWE (web3): isAuthenticated from useChainLoyaltyAuth
  // - Email (custodial): check /v1/user-auth/me cookie
  const [custodialAuth, setCustodialAuth] = useState<boolean | null>(null);

  useEffect(() => {
    // Try custodial session check
    axios.get('/v1/user-auth/me', { withCredentials: true })
      .then((res) => {
        const data = res.data as { onboarding_complete?: boolean };
        setCustodialAuth(true);
        if (data.onboarding_complete === false && !onboardingChecked) {
          setShowOnboarding(true);
        }
        setOnboardingChecked(true);
      })
      .catch(() => {
        setCustodialAuth(false);
        setOnboardingChecked(true);
      });
  }, []);

  const isSignedIn = isAuthenticated || custodialAuth === true;

  // Still checking custodial session — show nothing briefly
  if (custodialAuth === null && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not signed in via any method — show the auth gate
  if (!isSignedIn) {
    return <WalletGate />;
  }

  return (
    <>
      <DashboardShell />
      {showOnboarding && onboardingChecked && (
        <Onboarding
          businessName="ChainLoyalty"
          currencyName="Stars"
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </>
  );
}
