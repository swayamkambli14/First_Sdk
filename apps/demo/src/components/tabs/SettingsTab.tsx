import { useState } from 'react';
import { Shield, Key, ExternalLink, AlertTriangle, Check, Copy } from 'lucide-react';
import { useChainLoyaltyAuth } from '../../hooks/useChainLoyaltyAuth';
import axios from 'axios';

const NOTIF_KEYS = [
  { id: 'badge', label: 'Achievement unlocked' },
  { id: 'points', label: 'Points received' },
  { id: 'tier', label: 'Level up' },
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

  // Self-custody export flow
  const [showExportInfo, setShowExportInfo] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [exportResult, setExportResult] = useState<{ private_key: string; recovery_phrase: string | null; address: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);

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

  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    try {
      const res = await axios.post('/v1/user-auth/export-wallet',
        { confirmation: 'I understand I am responsible for this key' },
        { withCredentials: true }
      );
      setExportResult(res.data as typeof exportResult);
      setShowExportConfirm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setExportError(msg ?? 'Export failed. You may already be in self-custody mode.');
    } finally {
      setExporting(false);
    }
  };

  const copyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
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
            placeholder="Shown on leaderboard instead of your ID"
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
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${notifs[n.id] ? 'bg-cyan-500' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${notifs[n.id] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Rewards Account */}
      <section className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="font-['Space_Mono'] text-white font-bold text-sm flex items-center gap-2">
          <Shield size={14} className="text-cyan-400" /> Your Rewards Account
        </h3>

        {!exportResult ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-gray-500">Account ID</span>
                <button onClick={copyAddress} className="font-mono text-xs text-gray-300 hover:text-cyan-400 transition-colors flex items-center gap-1">
                  {copied ? <><Check size={10} className="text-green-400" /> Copied</> : <><Copy size={10} /> {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '—'}</>}
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
                  <span className="font-mono text-xs text-green-400">Active</span>
                </div>
              </div>
            </div>

            {/* Custodial info + export */}
            {!showExportInfo ? (
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
                <p className="font-['DM_Sans'] text-gray-300 text-xs leading-relaxed mb-3">
                  Your rewards are safely stored by ChainLoyalty — like a bank keeping your money safe.
                </p>
                <button
                  onClick={() => setShowExportInfo(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
                >
                  <Key size={11} /> Take Full Ownership
                </button>
              </div>
            ) : (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="font-['DM_Sans'] text-amber-300/90 text-xs leading-relaxed">
                    Right now, we keep your rewards safe for you — like a bank. If you'd like to be your own bank and control everything yourself, you can export your account. You'll get a Recovery Key to save somewhere safe. <strong>This is for advanced users. Most people don't need to do this.</strong>
                  </p>
                </div>
                {exportError && <p className="text-red-400 text-xs font-mono">{exportError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowExportConfirm(true)}
                    className="px-4 py-2 border border-amber-500/40 text-amber-400 font-['Space_Mono'] text-xs rounded-lg hover:border-amber-500/70 transition-all min-h-[36px]"
                  >
                    Show My Recovery Key
                  </button>
                  <button
                    onClick={() => setShowExportInfo(false)}
                    className="px-4 py-2 border border-white/10 text-gray-500 font-['Space_Mono'] text-xs rounded-lg hover:bg-white/5 transition-all min-h-[36px]"
                  >
                    Keep it Simple
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Export result — show once */
          <div className="space-y-3">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-xs font-bold mb-2">⚠️ Save this in a safe place. We will never show it again.</p>
              <div className="space-y-2">
                <div>
                  <p className="text-gray-500 text-[10px] font-mono mb-1">RECOVERY KEY</p>
                  <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-2">
                    <code className="text-red-300 text-xs font-mono flex-1 break-all">{exportResult.private_key}</code>
                    <button onClick={() => copyKey(exportResult.private_key)} className="text-gray-400 hover:text-white flex-shrink-0">
                      {keyCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
                {exportResult.recovery_phrase && (
                  <div>
                    <p className="text-gray-500 text-[10px] font-mono mb-1">RECOVERY PHRASE</p>
                    <code className="text-amber-300 text-xs font-mono block bg-black/40 rounded-lg px-3 py-2 break-words">{exportResult.recovery_phrase}</code>
                  </div>
                )}
              </div>
            </div>
            <p className="text-gray-600 text-xs font-mono">You are now in self-custody mode. ChainLoyalty no longer manages your account.</p>
          </div>
        )}
      </section>

      {/* Danger Zone */}
      <section className="border border-red-500/20 rounded-2xl p-6 space-y-4">
        <h3 className="font-['Space_Mono'] text-red-400 font-bold text-sm">Sign Out</h3>
        <p className="font-['DM_Sans'] text-gray-500 text-xs">
          Signing out will end your session. Your rewards and achievements are always preserved.
        </p>
        <button
          onClick={() => setConfirmDisconnect(true)}
          className="px-5 py-2.5 border border-red-500/40 hover:border-red-500/70 text-red-400 hover:text-red-300 font-['Space_Mono'] text-xs rounded-lg transition-all active:scale-[0.97] min-h-[40px]"
        >
          Sign Out
        </button>
      </section>

      {/* Confirm export modal */}
      {showExportConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="font-['Space_Mono'] text-white text-lg font-bold mb-3">Are you sure?</h3>
            <p className="font-['DM_Sans'] text-gray-400 text-sm mb-6">
              You'll receive a Recovery Key. Keep it somewhere safe — if you lose it, no one can recover your account.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowExportConfirm(false)} className="flex-1 py-3 border border-white/20 text-white font-['Space_Mono'] text-sm rounded-xl hover:bg-white/5 transition-all min-h-[44px]">
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-['Space_Mono'] font-bold text-sm rounded-xl transition-all active:scale-[0.97] min-h-[44px] disabled:opacity-50"
              >
                {exporting ? '...' : 'Show Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm sign out modal */}
      {confirmDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="font-['Space_Mono'] text-white text-lg font-bold mb-3">Sign out?</h3>
            <p className="font-['DM_Sans'] text-gray-400 text-sm mb-6">
              You'll be signed out. Your rewards and achievements are safe.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDisconnect(false)} className="flex-1 py-3 border border-white/20 text-white font-['Space_Mono'] text-sm rounded-xl hover:bg-white/5 transition-all min-h-[44px]">
                Cancel
              </button>
              <button onClick={logout} className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white font-['Space_Mono'] font-bold text-sm rounded-xl transition-all active:scale-[0.97] min-h-[44px]">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
