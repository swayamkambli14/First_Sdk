import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'TaskForge — ChainLoyalty Demo',
  projectId: import.meta.env['VITE_WALLETCONNECT_PROJECT_ID'] ?? 'd0a634c9fecffe9510eb01c1d1169c7d',
  chains: [sepolia],
  ssr: false,
});
