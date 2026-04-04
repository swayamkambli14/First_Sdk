import { useState } from 'react';
import SpinWheel from '../widgets/SpinWheel';
import RedeemGrid from '../widgets/RedeemGrid';
import { DEMO_USER } from '../../lib/mockData';

type SubTab = 'spin' | 'redeem' | 'transfer';

export default function SpendTab() {
  const [sub, setSub] = useState<SubTab>('spin');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [transferred, setTransferred] = useState(false);

  const abbrev = (addr: string) =>
    addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

  const handleTransfer = () => {
    setShowConfirm(false);
    setTransferred(true);
    setTimeout(() => setTransferred(false), 3000);
    setRecipient('');
    setAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-['Space_Mono'] text-white text-xl font-bold">Spend Points</h2>
        <span className="font-mono text-[10px] text-amber-400/70 border border-amber-400/20 px-2 py-0.5 rounded tracking-widest uppercase">
          Demo Data
        </span>
      </div>

      {/* Sub-tab pills */}
      <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 w-fit gap-1">
        {(['spin', 'redeem', 'transfer'] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSub(t)}
            className={`px-4 py-2 rounded-lg font-['Space_Mono'] text-xs capitalize transition-all duration-150 min-h-[36px] ${
              sub === t
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t === 'spin' ? 'Spin Wheel' : t === 'redeem' ? 'Redeem' : 'Transfer'}
          </button>
        ))}
      </div>

      {/* Spin */}
      {sub === 'spin' && (
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-10">
          <SpinWheel />
        </div>
      )}

      {/* Redeem */}
      {sub === 'redeem' && <RedeemGrid />}

      {/* Transfer */}
      {sub === 'transfer' && (
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 max-w-lg">
          <h3 className="font-['Space_Mono'] text-white font-bold text-sm mb-6">Transfer Points</h3>

          <div className="space-y-4">
            <div>
              <label className="font-mono text-xs text-gray-500 uppercase tracking-widest block mb-2">
                Recipient Wallet Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full bg-black/30 border border-white/10 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none transition-colors placeholder-gray-700 min-h-[44px]"
              />
            </div>

            <div>
              <label className="font-mono text-xs text-gray-500 uppercase tracking-widest block mb-2">
                Amount (max {DEMO_USER.points.toLocaleString()} pts)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                min={1}
                max={DEMO_USER.points}
                className="w-full bg-black/30 border border-white/10 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none transition-colors placeholder-gray-700 min-h-[44px]"
              />
            </div>

            {/* Live preview */}
            {recipient && amount && (
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-4 py-3">
                <p className="font-mono text-xs text-cyan-400">
                  Sending {parseInt(amount).toLocaleString()} pts to {abbrev(recipient)}
                </p>
              </div>
            )}

            {/* Warning */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex gap-2">
              <span className="text-amber-400 flex-shrink-0">⚠️</span>
              <p className="font-['DM_Sans'] text-amber-400/80 text-xs leading-relaxed">
                Transfers are permanent and irreversible. Double-check the recipient address.
              </p>
            </div>

            {transferred && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <p className="font-mono text-xs text-green-400">✓ Transfer simulated successfully (demo)</p>
              </div>
            )}

            <button
              onClick={() => recipient && amount && setShowConfirm(true)}
              disabled={!recipient || !amount}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/5 disabled:text-gray-600 disabled:cursor-not-allowed text-black font-['Space_Mono'] font-bold text-sm rounded-xl transition-all active:scale-[0.97] min-h-[44px]"
            >
              Review Transfer
            </button>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="font-['Space_Mono'] text-white text-lg font-bold mb-4">Confirm Transfer</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm font-mono">Amount</span>
                <span className="text-amber-400 font-['Space_Mono'] font-bold text-sm">{parseInt(amount).toLocaleString()} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm font-mono">To</span>
                <span className="text-white font-mono text-sm">{abbrev(recipient)}</span>
              </div>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 mb-6">
              <p className="font-['DM_Sans'] text-amber-400/80 text-xs">⚠️ This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 border border-white/20 text-white font-['Space_Mono'] text-sm rounded-xl hover:bg-white/5 transition-all min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-['Space_Mono'] font-bold text-sm rounded-xl transition-all active:scale-[0.97] min-h-[44px]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
