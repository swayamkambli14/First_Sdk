import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useNavigate } from 'react-router-dom';
import { useChainLoyaltyAuth } from '../hooks/useChainLoyaltyAuth';
import { useEffect } from 'react';

export default function LandingPage() {
  const { isConnected, isAuthenticated, login, isLoading } = useChainLoyaltyAuth();
  const navigate = useNavigate();

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  // Auto-trigger SIWE after wallet connects
  useEffect(() => {
    if (isConnected && !isAuthenticated && !isLoading) {
      login();
    }
  }, [isConnected, isAuthenticated, isLoading, login]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-8">
        <div>
          <h1 className="text-5xl font-bold text-white mb-2">TaskForge</h1>
          <p className="text-purple-400 text-lg">Powered by ChainLoyalty</p>
        </div>

        <p className="text-gray-300 text-xl">
          A project management tool that rewards you for every action — with real blockchain badges and points.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {[
            { icon: '🏆', title: 'Earn Points', desc: 'Every action earns you loyalty points' },
            { icon: '🎖️', title: 'Collect Badges', desc: 'Unlock NFT badges for milestones' },
            { icon: '🎰', title: 'Spin to Win', desc: 'Probabilistic rewards on upgrades' },
          ].map((f) => (
            <div key={f.title} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <ConnectButton label="Connect Wallet to Get Started" />
          {isLoading && (
            <p className="text-purple-400 text-sm animate-pulse">
              Signing in with your wallet...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
