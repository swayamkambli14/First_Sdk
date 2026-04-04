type Tab = 'overview' | 'rewards' | 'spend' | 'leaderboard' | 'referrals' | 'settings';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const navItems: { id: Tab; icon: string; label: string }[] = [
  { id: 'overview', icon: '⊞', label: 'Overview' },
  { id: 'rewards', icon: '🏆', label: 'Rewards' },
  { id: 'spend', icon: '⚡', label: 'Spend' },
  { id: 'leaderboard', icon: '📊', label: 'Board' },
  { id: 'referrals', icon: '👥', label: 'Refer' },
];

export default function MobileNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0d0d14]/95 backdrop-blur-md border-t border-white/10">
      <div className="flex">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 min-h-[56px] transition-colors ${
              active === item.id ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className="text-lg leading-none mb-0.5">{item.icon}</span>
            <span className="text-[10px] font-mono">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
