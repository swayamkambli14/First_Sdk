import { useState } from 'react';
import { Copy, Check, Tag, Truck, Gift, Star, Loader2 } from 'lucide-react';
import { useUserStats, fireEvent } from '../../hooks/useRewardsData';
import { useChainLoyaltyAuth } from '../../hooks/useChainLoyaltyAuth';

interface RewardItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: React.ReactNode;
}

const REWARD_CATALOG: RewardItem[] = [
  { id: 'discount_10',   name: '10% Off Next Purchase', description: 'Valid at partner stores',         cost: 500,  icon: <Tag size={24} className="text-cyan-400" /> },
  { id: 'free_shipping', name: 'Free Shipping',          description: 'On any order above $20',          cost: 300,  icon: <Truck size={24} className="text-green-400" /> },
  { id: 'mystery_box',   name: 'Mystery Box',            description: 'Random premium reward',           cost: 750,  icon: <Gift size={24} className="text-purple-400" /> },
  { id: 'early_access',  name: 'Early Access',           description: 'Try features before anyone else', cost: 1000, icon: <Star size={24} className="text-amber-400" /> },
];

function generateCode(rewardId: string, wallet: string): string {
  const suffix = wallet.slice(2, 6).toUpperCase();
  const map: Record<string, string> = {
    discount_10:   `CHAIN-D10-${suffix}`,
    free_shipping: `CHAIN-FS-${suffix}`,
    mystery_box:   `CHAIN-MB-${suffix}`,
    early_access:  `CHAIN-EA-${suffix}`,
  };
  return map[rewardId] ?? `CHAIN-${suffix}`;
}

export default function RedeemGrid() {
  const { walletAddress, isAuthenticated } = useChainLoyaltyAuth();
  const { stats, refetch } = useUserStats();
  const [modal, setModal] = useState<RewardItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const balance = stats?.currentPointsBalance ?? 0;

  const handleRedeem = async (reward: RewardItem) => {
    if (!walletAddress || !isAuthenticated) return;
    setRedeeming(reward.id);
    setError(null);
    try {
      await fireEvent('redeem', walletAddress, {
        reward_id: reward.id,
        reward_name: reward.name,
        cost: reward.cost,
      });
      setRedeemed((prev) => new Set([...prev, reward.id]));
      setModal(reward);
      setTimeout(() => void refetch(), 1500);
    } catch {
      setError('Redemption failed — please try again');
    } finally {
      setRedeeming(null);
    }
  };

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-xs font-mono">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REWARD_CATALOG.map((reward) => {
          const canAfford = isAuthenticated && balance >= reward.cost;
          const alreadyRedeemed = redeemed.has(reward.id);
          const isRedeeming = redeeming === reward.id;
          return (
            <div
              key={reward.id}
              className={`backdrop-blur-md bg-white/5 border rounded-2xl p-5 transition-all duration-200 ${
                alreadyRedeemed
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-white/10 hover:border-cyan-500/30'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                {reward.icon}
              </div>
              <h4 className="font-['Space_Mono'] text-white font-bold text-sm mb-1">{reward.name}</h4>
              <p className="font-['DM_Sans'] text-gray-400 text-xs mb-4">{reward.description}</p>
              <div className="flex items-center justify-between gap-3">
                <span className="font-['Space_Mono'] text-amber-400 text-sm font-bold">
                  {reward.cost.toLocaleString()} pts
                </span>
                <button
                  onClick={() => { if (!alreadyRedeemed && canAfford) void handleRedeem(reward); }}
                  disabled={!canAfford || alreadyRedeemed || !!redeeming}
                  className={`px-4 py-2 rounded-lg font-['Space_Mono'] text-xs font-bold transition-all duration-200 min-h-[36px] flex items-center gap-1.5 ${
                    alreadyRedeemed
                      ? 'bg-green-500/20 text-green-400 border border-green-500/20 cursor-default'
                      : canAfford
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-black hover:shadow-[0_0_16px_rgba(0,229,255,0.3)] active:scale-[0.97]'
                      : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/10'
                  }`}
                >
                  {isRedeeming && <Loader2 size={12} className="animate-spin" />}
                  {alreadyRedeemed
                    ? 'Redeemed'
                    : !isAuthenticated
                    ? 'Connect Wallet'
                    : canAfford
                    ? 'Redeem'
                    : `Need ${(reward.cost - balance).toLocaleString()} more`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coupon modal */}
      {modal && walletAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              {modal.icon}
            </div>
            <h3 className="font-['Space_Mono'] text-white text-lg font-bold text-center mb-1">{modal.name}</h3>
            <p className="font-['DM_Sans'] text-gray-400 text-sm text-center mb-6">Your coupon code:</p>

            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3 mb-4">
              <code className="font-['Space_Mono'] text-cyan-400 text-sm tracking-widest">
                {generateCode(modal.id, walletAddress)}
              </code>
              <button
                onClick={() => copyCode(generateCode(modal.id, walletAddress))}
                className="text-gray-400 hover:text-white transition-colors min-h-[32px] px-2 flex items-center gap-1"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>

            <p className="text-gray-600 text-xs font-mono text-center mb-6">Valid for 30 days</p>

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
