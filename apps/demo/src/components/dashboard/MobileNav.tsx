import { LayoutDashboard, Trophy, Zap, BarChart2, Users } from 'lucide-react';

type Tab = 'overview' | 'rewards' | 'spend' | 'leaderboard' | 'referrals' | 'settings';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const navItems = [
  { id: 'overview'    as Tab, icon: LayoutDashboard, label: 'Overview' },
  { id: 'rewards'     as Tab, icon: Trophy,          label: 'Rewards' },
  { id: 'spend'       as Tab, icon: Zap,             label: 'Spend' },
  { id: 'leaderboard' as Tab, icon: BarChart2,       label: 'Board' },
  { id: 'referrals'   as Tab, icon: Users,           label: 'Refer' },
];

export default function MobileNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0d0d14]/95 backdrop-blur-md border-t border-white/10">
      <div className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 min-h-[56px] transition-colors ${
                active === item.id ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={20} className="mb-0.5" />
              <span className="text-[10px] font-mono">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
