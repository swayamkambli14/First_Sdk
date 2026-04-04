import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useChainLoyaltyAuth } from '../hooks/useChainLoyaltyAuth';
import axios from 'axios';

const API_BASE = '/v1';
const API_KEY = import.meta.env['VITE_API_KEY'] ?? 'sk_demo_chainloyalty_development_key_12345';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function DashboardPage() {
  const { isAuthenticated, walletAddress, tier, points, logout } = useChainLoyaltyAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const fireEvent = useCallback(
    async (eventType: string, metadata: Record<string, unknown>, label: string) => {
      setLoadingAction(label);
      try {
        await axios.post(
          `${API_BASE}/events`,
          {
            wallet_address: walletAddress,
            event_type: eventType,
            metadata,
          },
          { headers: { Authorization: `Bearer ${API_KEY}` } }
        );
        showToast(`✅ ${label} — rewards processing!`);
      } catch {
        showToast(`❌ ${label} failed`, 'error');
      } finally {
        setLoadingAction(null);
      }
    },
    [walletAddress]
  );

  const actions = [
    {
      label: 'Create Project',
      emoji: '📁',
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => fireEvent('milestone', { milestone_name: 'project_created' }, 'Create Project'),
    },
    {
      label: 'Upgrade to Pro',
      emoji: '⭐',
      color: 'bg-purple-600 hover:bg-purple-700',
      onClick: () => fireEvent('subscription', { plan: 'pro', billing_cycle: 'monthly' }, 'Upgrade to Pro'),
    },
    {
      label: 'Export Report',
      emoji: '📊',
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => fireEvent('feature_usage', { feature_name: 'export', count: 1 }, 'Export Report'),
    },
    {
      label: 'Make Payment ($75)',
      emoji: '💳',
      color: 'bg-yellow-600 hover:bg-yellow-700',
      onClick: () => fireEvent('purchase', { amount: 75, currency: 'USD' }, 'Make Payment'),
    },
  ];

  const abbrev = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-2">
        <div className="text-xl font-bold text-white mb-4">TaskForge</div>
        <Link to="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800">Dashboard</Link>
        <Link to="/leaderboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800">Leaderboard</Link>
        <Link to="/referral" className="text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800">Referrals</Link>
        <div className="mt-auto">
          <button onClick={logout} className="text-red-400 hover:text-red-300 text-sm px-3 py-2">
            Disconnect
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="bg-gray-800 px-3 py-1 rounded-full text-gray-300">{abbrev(walletAddress ?? '')}</span>
            <span className="bg-purple-900 text-purple-300 px-3 py-1 rounded-full capitalize">{tier ?? 'bronze'}</span>
            <span className="bg-yellow-900 text-yellow-300 px-3 py-1 rounded-full">{points ?? '0'} pts</span>
          </div>
        </div>

        {/* Action buttons — the demo heart */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Actions (fire loyalty events)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                disabled={loadingAction !== null}
                className={`${action.color} text-white rounded-xl p-4 text-left transition-all disabled:opacity-50`}
              >
                <div className="text-2xl mb-1">{action.emoji}</div>
                <div className="text-sm font-medium">
                  {loadingAction === action.label ? (
                    <span className="animate-pulse">Processing...</span>
                  ) : (
                    action.label
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Fake kanban board */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Projects</h2>
          <div className="grid grid-cols-3 gap-4">
            {['To Do', 'In Progress', 'Done'].map((col) => (
              <div key={col} className="bg-gray-800 rounded-lg p-3">
                <h3 className="text-sm font-medium text-gray-400 mb-2">{col}</h3>
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-gray-700 rounded p-2 text-xs text-gray-300">
                      Task {col.charAt(0)}{i}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
              toast.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
