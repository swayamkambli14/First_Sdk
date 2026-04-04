import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useChainLoyaltyAuth } from '../../hooks/useChainLoyaltyAuth';

export default function WalletGate() {
  const { isConnected, isLoading, login } = useChainLoyaltyAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="relative">
        {/* Pulsing glow border */}
        <div className="absolute inset-0 rounded-2xl bg-cyan-500/20 blur-xl animate-pulse" />

        <div
          className="relative backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-10 w-full max-w-sm text-center"
          style={{ boxShadow: '0 0 0 1px rgba(0,229,255,0.15), 0 0 40px rgba(0,229,255,0.08)' }}
        >
          {/* MetaMask fox icon */}
          <div className="flex justify-center mb-6">
            <svg width="80" height="80" viewBox="0 0 318.6 318.6" xmlns="http://www.w3.org/2000/svg">
              <polygon fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round" points="274.1,35.5 174.6,109.4 193,65.8" />
              <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="44.4,35.5 143.1,110.1 125.6,65.8" />
              <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7" />
              <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8" />
              <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1" />
              <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" points="214.9,138.2 175.9,103.4 174.6,164.6 230.8,162.1" />
              <polygon fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" points="106.8,247.4 140.6,230.9 111.4,208.1" />
              <polygon fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" points="177.9,230.9 211.8,247.4 207.1,208.1" />
              <polygon fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" points="211.8,247.4 177.9,230.9 180.6,253 180.3,262.3" />
              <polygon fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" points="106.8,247.4 138.3,262.3 138.1,253 140.6,230.9" />
              <polygon fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round" points="138.8,193.5 110.6,185.2 130.5,176.1" />
              <polygon fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round" points="179.7,193.5 188,176.1 208,185.2" />
              <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="106.8,247.4 111.6,206.8 80.3,207.7" />
              <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="207,206.8 211.8,247.4 238.3,207.7" />
              <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="230.8,162.1 174.6,164.6 179.8,193.5 188.1,176.1 208.1,185.2" />
              <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="110.6,185.2 130.6,176.1 138.8,193.5 144.1,164.6 87.8,162.1" />
              <polygon fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round" points="87.8,162.1 111.4,208.1 110.6,185.2" />
              <polygon fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round" points="208.1,185.2 207.1,208.1 230.8,162.1" />
              <polygon fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round" points="144.1,164.6 138.8,193.5 145.4,227.6 146.9,182.7" />
              <polygon fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round" points="174.6,164.6 171.9,182.6 172.9,227.6 179.8,193.5" />
              <polygon fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" points="179.8,193.5 172.9,227.6 177.9,230.9 207.1,208.1 208.1,185.2" />
              <polygon fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" points="110.6,185.2 111.4,208.1 140.6,230.9 145.4,227.6 138.8,193.5" />
            </svg>
          </div>

          <h2 className="font-['Space_Mono'] text-2xl font-bold text-white mb-3">
            Connect Your Wallet
          </h2>
          <p className="font-['DM_Sans'] text-gray-400 text-sm mb-8 leading-relaxed">
            Sign in with MetaMask or WalletConnect to access your rewards dashboard.
          </p>

          <div className="space-y-3">
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={() => { openConnectModal(); }}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-['Space_Mono'] font-bold text-sm rounded-lg transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] active:scale-[0.97] min-h-[44px]"
                >
                  Connect MetaMask
                </button>
              )}
            </ConnectButton.Custom>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-600 text-xs font-mono">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="w-full py-3 border border-white/20 hover:border-cyan-500/40 text-white font-['Space_Mono'] text-sm rounded-lg transition-all duration-200 hover:bg-white/5 active:scale-[0.97] min-h-[44px]"
                >
                  WalletConnect
                </button>
              )}
            </ConnectButton.Custom>
          </div>

          <p className="text-gray-600 text-xs font-mono mt-6">
            🔒 We never access your private keys
          </p>

          {isConnected && isLoading && (
            <p className="text-cyan-400 text-xs font-mono mt-3 animate-pulse">
              ◈ Signing authentication message...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
