import { useState } from 'react';
import { Award, ShoppingCart, Users, Zap, Clover, Medal, Trophy, ExternalLink, CheckCircle } from 'lucide-react';
import { useBadges } from '../../hooks/useRewardsData';
import { useChainLoyaltyAuth } from '../../hooks/useChainLoyaltyAuth';
import { ethers } from 'ethers';

const RPC_URL = import.meta.env['VITE_BLOCKCHAIN_RPC_URL'] ?? 'https://eth-sepolia.g.alchemy.com/v2/YZtc-AuzXiZkr2BOVIvER';
const BADGE_NFT_ADDR = import.meta.env['VITE_BADGE_NFT_ADDRESS'] ?? '0x78c7B78F3ef9f1d5216B74CDd3f56D74862DA9ab';
const BADGE_NFT_ABI = ['function isValidBadge(address, uint256) view returns (bool)'];

const RARITY_COLORS: Record<string, string> = {
  common:    'border-white/10',
  uncommon:  'border-green-500/30',
  rare:      'border-blue-500/30',
  epic:      'border-purple-500/30',
  legendary: 'border-amber-500/40',
};

const BADGE_ICONS: Record<string, React.ReactNode> = {
  power_buyer:       <Trophy size={28} className="text-amber-400" />,
  first_purchase:    <ShoppingCart size={28} className="text-cyan-400" />,
  top_referrer:      <Users size={28} className="text-green-400" />,
  power_user:        <Zap size={28} className="text-yellow-400" />,
  lucky_subscriber:  <Clover size={28} className="text-emerald-400" />,
  tier_silver:       <Medal size={28} className="text-gray-300" />,
  tier_gold:         <Medal size={28} className="text-amber-400" />,
  tier_platinum:     <Trophy size={28} className="text-cyan-300" />,
};

export default function BadgeGrid() {
  const { badges, loading } = useBadges();
  const { walletAddress } = useChainLoyaltyAuth();
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [onChainValid, setOnChainValid] = useState<Record<string, boolean>>({});

  // Check on-chain validity for badges that have a tx hash (minted on-chain)
  useState(() => {
    if (!walletAddress || badges.length === 0) return;
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(BADGE_NFT_ADDR, BADGE_NFT_ABI, provider);
    badges.forEach((badge, i) => {
      if (!badge.on_chain_tx_hash) return;
      // Use badge index as tokenId approximation
      contract.isValidBadge(walletAddress, i).then((valid: boolean) => {
        setOnChainValid((prev) => ({ ...prev, [badge.badge_id]: valid }));
      }).catch(() => {});
    });
  });

  if (loading && badges.length === 0) {
    return (
      <div>
        <h3 className="font-['Space_Mono'] text-white font-bold text-sm mb-4">Earned Badges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 animate-pulse h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div>
        <h3 className="font-['Space_Mono'] text-white font-bold text-sm mb-4">Earned Badges</h3>
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-gray-600 font-mono text-xs">No badges yet — keep earning to unlock them!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-['Space_Mono'] text-white font-bold text-sm mb-4">Earned Badges</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.badge_id}
            className={`relative backdrop-blur-md bg-white/5 border rounded-2xl p-4 transition-all duration-200 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(0,229,255,0.08)] hover:scale-[1.02] cursor-default ${RARITY_COLORS[badge.rarity] ?? 'border-white/10'}`}
            onMouseEnter={() => setTooltip(badge.badge_id)}
            onMouseLeave={() => setTooltip(null)}
          >
            {tooltip === badge.badge_id && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 bg-[#1a1a2e] border border-white/20 rounded-lg px-3 py-1.5 text-xs text-gray-300 font-mono whitespace-nowrap shadow-xl capitalize">
                {badge.rarity} · {new Date(badge.issued_at).toLocaleDateString()}
              </div>
            )}

            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              {BADGE_ICONS[badge.badge_id] ?? <Award size={28} className="text-cyan-400" />}
            </div>
            <p className="font-['Space_Mono'] text-white text-xs font-bold mb-1 leading-tight">
              {badge.badge_name}
            </p>
            <p className="text-gray-500 text-[10px] font-mono mb-2 capitalize">{badge.rarity}</p>
            {badge.on_chain_tx_hash && (
              <div className="space-y-1">
                {onChainValid[badge.badge_id] !== undefined && (
                  <div className="flex items-center gap-1">
                    <CheckCircle size={10} className="text-green-400" />
                    <span className="text-[10px] font-mono text-green-400">On-chain verified</span>
                  </div>
                )}
                <a
                  href={`https://sepolia.etherscan.io/tx/${badge.on_chain_tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 text-[10px] font-mono hover:text-cyan-300 transition-colors"
                >
                  View on Chain <ExternalLink size={9} />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
