import { useState } from 'react';
import { useChainLoyaltyAuth } from '../../hooks/useChainLoyaltyAuth';

const NOTIF_KEYS = [
  { id: 'badge', label: 'Badge earned' },
  { id: 'points', label: 'Points received' },
  { id: 'tier', label: 'Tier upgrade' },
  { id: 'weekly', label: 'Weekly summary' },
];

export default function SettingsTab() {
  const { walletAddress, logout } = useChainLoyaltyAuth();
  const [displayName, setDisplayName] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    badge: true, points: true, tier: true, weekly: false,
  });
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const saveProfile = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-lg">
      <h2 className="font-['Space_Mono'] text-white text-xl font-bold">Settings</h2>

      {/* Profile */}
      <section className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="font-['Space_Mono'] text-white font-bold text-sm">Profile</h3>
        <div>
          <label className="font-mono text-xs text-gray-500 uppercase tracking-widest block mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Shown on leaderboard instead of wallet"
            className="w-full bg-black/30 border border-white/10 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-white font-['DM_Sans'] text-sm outline-none transition-colors placeholder-gray-700 min-h-[44px]"
          />
        </div>
        <button
          onClick={saveProfile}
          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-['Space_Mono'] font-bold text-xs rounded-lg transition-all active:scale-[0.97] min-h-[40px]"
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </section>

      {/* Notifications */}
      <section className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="font-['Space_Mono'] text-white font-bold text-sm">Notifications</h3>
        <div className="space-y-3">
          {NOTIF_KEYS.map((n) => (
            <div key={n.id} className="flex items-center justify-between min-h-[44px]">
              <span className="font-['DM_Sans'] text-gray-300 text-sm">{n.label}</span>
              <button
                onClick={() => setNotifs((prev) => ({ ...prev, [n.id]: !prev[n.id] }))}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  notifs[n.id] ? 'bg-cyan-500' : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    notifs[n.id] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Connected Wallet */}
      <section className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
        <h3 className="font-['Space_Mono'] text-white font-bold text-sm">Connected Wallet</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-gray-500">Address</span>
            <button
              onClick={copyAddress}
              className="font-mono text-xs text-gray-300 hover:text-cyan-400 transition-colors"
            >
              {copied ? '✓ Copied' : walletAddress ?? '0x...'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-gray-500">Network</span>
            <span className="font-mono text-xs text-gray-300">Sepolia Testnet</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-gray-500">Status</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="font-mono text-xs text-green-400">Connected</span>
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="border border-red-500/20 rounded-2xl p-6 space-y-4">
        <h3 className="font-['Space_Mono'] text-red-400 font-bold text-sm">Danger Zone</h3>
        <p className="font-['DM_Sans'] text-gray-500 text-xs">
          Disconnecting will sign you out. Your on-chain data is always preserved.
        </p>
        <button
          onClick={() => setConfirmDisconnect(true)}
          className="px-5 py-2.5 border border-red-500/40 hover:border-red-500/70 text-red-400 hover:text-red-300 font-['Space_Mono'] text-xs rounded-lg transition-all active:scale-[0.97] min-h-[40px]"
        >
          Disconnect Wallet
        </button>
      </section>

      {/* Confirm disconnect modal */}
      {confirmDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="font-['Space_Mono'] text-white text-lg font-bold mb-3">Disconnect wallet?</h3>
            <p className="font-['DM_Sans'] text-gray-400 text-sm mb-6">
              You'll be signed out. Your rewards and badges are safe on-chain.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDisconnect(false)}
                className="flex-1 py-3 border border-white/20 text-white font-['Space_Mono'] text-sm rounded-xl hover:bg-white/5 transition-all min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white font-['Space_Mono'] font-bold text-sm rounded-xl transition-all active:scale-[0.97] min-h-[44px]"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
