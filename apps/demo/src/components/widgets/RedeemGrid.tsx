import { useState } from 'react';
import { DEMO_REWARDS, DEMO_USER } from '../../lib/mockData';

const MOCK_CODES: Record<string, string> = {
  discount_10: 'CHAIN-D10-X7K2',
  free_shipping: 'CHAIN-FS-M9P4',
  mystery_box: 'CHAIN-MB-Q3R8',
  early_access: 'CHAIN-EA-W5T1',
};

export default function RedeemGrid() {
  const [balance] = useState(DEMO_USER.points);
  const [modal, setModal] = useState<typeof DEMO_REWARDS[0] | null>(null);
  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DEMO_REWARDS.map((reward) => {
          const canAfford = balance >= reward.cost;
          return (
            <div
              key={reward.id}
              className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-200"
            >
              <div className="text-3xl mb-3">{reward.icon}</div>
              <h4 className="font-['Space_Mono'] text-white font-bold text-sm mb-1">{reward.name}</h4>
              <p className="font-['DM_Sans'] text-gray-400 text-xs mb-4">{reward.description}</p>
              <div className="flex items-center justify-between gap-3">
                <span className="font-['Space_Mono'] text-amber-400 text-sm font-bold">
                  {reward.cost.toLocaleString()} pts
                </span>
                <button
                  onClick={() => canAfford && setModal(reward)}
                  className={`px-4 py-2 rounded-lg font-['Space_Mono'] text-xs font-bold transition-all duration-200 min-h-[36px] ${
                    canAfford
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-black hover:shadow-[0_0_16px_rgba(0,229,255,0.3)] active:scale-[0.97]'
                      : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/10'
                  }`}
                >
                  {canAfford ? 'Redeem' : `Need ${(reward.cost - balance).toLocaleString()} more pts`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coupon modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="text-4xl mb-4 text-center">{modal.icon}</div>
            <h3 className="font-['Space_Mono'] text-white text-lg font-bold text-center mb-1">
              {modal.name}
            </h3>
            <p className="font-['DM_Sans'] text-gray-400 text-sm text-center mb-6">
              Your coupon code:
            </p>

            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3 mb-4">
              <code className="font-['Space_Mono'] text-cyan-400 text-sm tracking-widest">
                {MOCK_CODES[modal.id]}
              </code>
              <button
                onClick={() => copyCode(MOCK_CODES[modal.id])}
                className="text-gray-400 hover:text-white transition-colors text-xs font-mono min-h-[32px] px-2"
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>

            <p className="text-gray-600 text-xs font-mono text-center mb-6">
              Expires: Dec 31, 2025
            </p>

            <button
              onClick={() => { setModal(null); setCopied(false); }}
              className="w-full py-3 border border-white/20 hover:border-cyan-500/30 text-white font-['Space_Mono'] text-sm rounded-xl transition-all active:scale-[0.97] min-h-[44px]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
