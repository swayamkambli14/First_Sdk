import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Zap, Trophy, Dices, Users, BarChart2, Plug,
  ChevronLeft, ChevronRight, LogOut, Flame, Building2,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Overview' },
  { to: '/rules',      icon: Zap,             label: 'Rule Builder' },
  { to: '/tiers',      icon: Trophy,          label: 'Tiers & Currency' },
  { to: '/spin-pools', icon: Dices,           label: 'Spin Pools' },
  { to: '/users',      icon: Users,           label: 'Users' },
  { to: '/analytics',  icon: BarChart2,       label: 'Analytics' },
  { to: '/burn',       icon: Flame,           label: 'Burn Dashboard' },
  { to: '/sdk',        icon: Plug,            label: 'SDK & Docs' },
  { to: '/company',    icon: Building2,       label: 'Company' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { logout, appId, company } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className={`flex flex-col bg-slate-900 text-white transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'} flex-shrink-0`}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <span className="text-cyan-400 font-bold text-lg whitespace-nowrap overflow-hidden">
            {collapsed ? 'CL' : 'ChainLoyalty'}
          </span>
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-slate-400 hover:text-white">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-hidden">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon size={16} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          {!collapsed && (
            <div className="px-2 mb-2">
              {company ? (
                <>
                  <div className="text-xs text-slate-500 truncate">Company</div>
                  <div className="text-xs text-slate-300 font-medium truncate">{company.name}</div>
                  <div className="text-xs text-slate-500 truncate">{company.email}</div>
                </>
              ) : (
                <>
                  <div className="text-xs text-slate-500 truncate">App ID</div>
                  <div className="text-xs text-slate-300 font-mono truncate">{appId || '—'}</div>
                </>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && 'Log Out'}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
