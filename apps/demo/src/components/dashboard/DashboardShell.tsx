import { useState, useCallback } from 'react';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  LayoutDashboard, Trophy, Zap, BarChart2, Users, Settings, LogOut, X,
} from 'lucide-react';
import { useChainLoyaltyAuth } from '../../hooks/useChainLoyaltyAuth';
import { useRewardSocket, RewardEvent } from '../../hooks/useRewardSocket';
import { useNavigate } from 'react-router-dom';
import OverviewTab from '../tabs/OverviewTab';
import RewardsTab from '../tabs/RewardsTab';
import SpendTab from '../tabs/SpendTab';
import LeaderboardTab from '../tabs/LeaderboardTab';
import ReferralsTab from '../tabs/ReferralsTab';
import SettingsTab from '../tabs/SettingsTab';
import MobileNav from './MobileNav';


type Tab = 'overview' | 'rewards' | 'spend' | 'leaderboard' | 'referrals' | 'settings';

const sidebarItems = [
  { id: 'overview' as Tab, icon: LayoutDashboard, label: 'Overview' },
  { id: 'rewards' as Tab, icon: Trophy, label: 'My Rewards' },
  { id: 'spend' as Tab, icon: Zap, label: 'Spend Points' },
  { id: 'leaderboard' as Tab, icon: BarChart2, label: 'Leaderboard' },
  { id: 'referrals' as Tab, icon: Users, label: 'Referrals' },
  { id: 'settings' as Tab, icon: Settings, label: 'Settings' },
];

export default function DashboardShell() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { walletAddress, logout, tier, points } = useChainLoyaltyAuth();

  // Gap #3: real-time reward notifications via WebSocket
  const handleReward = useCallback((reward: RewardEvent) => {
    const msg = reward.type === 'badge'
      ? `🏆 You unlocked the ${reward.badge_name ?? 'Achievement'} badge!`
      : `🎁 You earned ${reward.amount} ${reward.reason?.includes('purchase') ? '— thanks for your purchase!' : reward.reason ?? 'points'}`;
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);
  useRewardSocket(handleReward);
  const navigate = useNavigate();

  // Wagmi — for ETH balance display only
  const { address: wagmiAddress, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ethBalance } = useBalance({ address: wagmiAddress });

  const copyAddress = () => {
    const addr = walletAddress;
    if (addr) {
      navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const NAV = sidebarItems;

  const renderTab = () => {
    const props = { key: activeTab };
    switch (activeTab) {
      case 'overview':    return <OverviewTab {...props} />;
      case 'rewards':     return <RewardsTab {...props} />;
      case 'spend':       return <SpendTab {...props} />;
      case 'leaderboard': return <LeaderboardTab {...props} />;
      case 'referrals':   return <ReferralsTab {...props} />;
      case 'settings':    return <SettingsTab {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#0d0d14]/95 backdrop-blur-md border-b border-white/10 flex items-center px-4 lg:px-6 gap-4">
        <div className="flex items-center gap-2 mr-auto">
          <span className="font-['Space_Mono'] text-cyan-400 font-bold text-base tracking-tight">
            Chain<span className="text-white">Loyalty</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Network badge */}
          <span className="hidden sm:inline font-mono text-[10px] text-gray-400 border border-white/10 px-2 py-0.5 rounded">
            Sepolia
          </span>

          {/* Account: connected state */}
          {isConnected && wagmiAddress ? (
            <div className="flex items-center gap-2">
              <button
                onClick={copyAddress}
                className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-cyan-500/30 px-3 py-1.5 rounded-lg transition-all duration-200 min-h-[36px]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-mono text-xs text-gray-300">
                    {copied ? 'Copied!' : walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ''}
                  </div>
                  {ethBalance && (
                    <div className="font-mono text-[10px] text-cyan-400">
                      {parseFloat(ethBalance.formatted).toFixed(4)} {ethBalance.symbol}
                    </div>
                  )}
                </div>
              </button>
              <button
                onClick={() => disconnect()}
                className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                title="Sign out"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            /* Account: not connected */
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="flex items-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-mono text-xs px-3 py-1.5 rounded-lg transition-all min-h-[36px]"
                >
                  Get Started
                </button>
              )}
            </ConnectButton.Custom>
          )}
        </div>
      </header>

      <div className="flex flex-1 pt-14">
        {/* Sidebar — desktop only */}
        <aside className="hidden lg:flex flex-col fixed left-0 top-14 bottom-0 w-60 bg-[#0d0d14] border-r border-white/10 z-30">
          <nav className="flex-1 p-4 space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 min-h-[44px] ${activeTab === item.id
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  <span className="font-['DM_Sans'] font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer — wallet info + logout */}
          <div className="p-4 border-t border-white/10 space-y-3">
            <div className="px-3">
              <div className="text-xs text-gray-300 font-mono truncate">
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not signed in'}
              </div>
              {tier && (
                <div className="text-[10px] text-cyan-400 font-mono capitalize">{tier} · {points ?? '0'} pts</div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all duration-150 min-h-[44px]"
            >
              <LogOut size={16} className="flex-shrink-0" />
              <span className="font-['DM_Sans']">Log Out</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-60 pb-20 lg:pb-8 overflow-auto">
          <div className="p-4 lg:p-8" style={{ animation: 'tabIn 200ms ease-out' }}>
            {renderTab()}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav active={activeTab} onChange={setActiveTab} />

      {/* Real-time reward toast — Gap #3 */}
      {toast && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0d1a1a] border border-cyan-500/40 text-cyan-300 font-mono text-sm px-5 py-3 rounded-xl shadow-2xl animate-bounce-in whitespace-nowrap">
          {toast}
        </div>
      )}

      <style>{`
        @keyframes tabIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-in {
          0%   { opacity: 0; transform: translateX(-50%) translateY(12px); }
          60%  { transform: translateX(-50%) translateY(-4px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-bounce-in { animation: bounce-in 0.35s ease-out both; }
      `}</style>
    </div>
  );
}
