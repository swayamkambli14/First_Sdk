import { useState } from 'react';
import { useChainLoyaltyAuth } from '../../hooks/useChainLoyaltyAuth';
import MobileNav from './MobileNav';
import OverviewTab from '../tabs/OverviewTab';
import RewardsTab from '../tabs/RewardsTab';
import SpendTab from '../tabs/SpendTab';
import LeaderboardTab from '../tabs/LeaderboardTab';
import ReferralsTab from '../tabs/ReferralsTab';
import SettingsTab from '../tabs/SettingsTab';

type Tab = 'overview' | 'rewards' | 'spend' | 'leaderboard' | 'referrals' | 'settings';

const sidebarItems: { id: Tab; icon: string; label: string }[] = [
  { id: 'overview', icon: '⊞', label: 'Overview' },
  { id: 'rewards', icon: '🏆', label: 'My Rewards' },
  { id: 'spend', icon: '⚡', label: 'Spend Points' },
  { id: 'leaderboard', icon: '📊', label: 'Leaderboard' },
  { id: 'referrals', icon: '👥', label: 'Referrals' },
  { id: 'settings', icon: '⚙', label: 'Settings' },
];

function abbrev(addr: string) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export default function DashboardShell() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [copied, setCopied] = useState(false);
  const { walletAddress, logout } = useChainLoyaltyAuth();

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderTab = () => {
    const props = { key: activeTab };
    switch (activeTab) {
      case 'overview': return <OverviewTab {...props} />;
      case 'rewards': return <RewardsTab {...props} />;
      case 'spend': return <SpendTab {...props} />;
      case 'leaderboard': return <LeaderboardTab {...props} />;
      case 'referrals': return <ReferralsTab {...props} />;
      case 'settings': return <SettingsTab {...props} />;
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
          {/* Demo badge */}
          <span className="hidden sm:inline font-mono text-[10px] text-amber-400 border border-amber-400/30 bg-amber-400/5 px-2 py-0.5 rounded tracking-widest uppercase">
            Demo Data
          </span>

          {/* Network badge */}
          <span className="font-mono text-[10px] text-gray-400 border border-white/10 px-2 py-0.5 rounded">
            Sepolia
          </span>

          {/* Wallet pill */}
          <button
            onClick={copyAddress}
            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-cyan-500/30 px-3 py-1.5 rounded-lg transition-all duration-200 min-h-[36px]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
            <span className="font-mono text-xs text-gray-300">
              {copied ? 'Copied!' : abbrev(walletAddress ?? '0x0000...0000')}
            </span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 pt-14">
        {/* Sidebar — desktop only */}
        <aside className="hidden lg:flex flex-col fixed left-0 top-14 bottom-0 w-60 bg-[#0d0d14] border-r border-white/10 z-30">
          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 min-h-[44px] ${
                  activeTab === item.id
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span className="font-['DM_Sans'] font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all duration-150 min-h-[44px]"
            >
              <span className="text-base w-5 text-center">⏻</span>
              <span className="font-['DM_Sans']">Disconnect</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-60 pb-20 lg:pb-8 overflow-auto">
          <div
            className="p-4 lg:p-8 animate-in"
            style={{ animation: 'tabIn 200ms ease-out' }}
          >
            {renderTab()}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav active={activeTab} onChange={setActiveTab} />

      <style>{`
        @keyframes tabIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
