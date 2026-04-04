import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, hardhat } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'TaskForge — ChainLoyalty Demo',
  projectId: import.meta.env['VITE_WALLETCONNECT_PROJECT_ID'] ?? 'demo-project-id',
  chains: [sepolia, hardhat],
  ssr: false,
});
