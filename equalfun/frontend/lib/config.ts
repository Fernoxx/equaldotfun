import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

export const config = getDefaultConfig({
  appName: 'Equal.fun',
  projectId,
  chains: [base, baseSepolia],
  ssr: true,
});

export const CONTRACTS = {
  factory: {
    [base.id]: '0x0000000000000000000000000000000000000000', // To be deployed
    [baseSepolia.id]: '0x0000000000000000000000000000000000000000', // To be deployed
  },
  treasury: {
    [base.id]: '0x0000000000000000000000000000000000000000', // To be deployed
    [baseSepolia.id]: '0x0000000000000000000000000000000000000000', // To be deployed
  },
  weth: {
    [base.id]: '0x4200000000000000000000000000000000000006',
    [baseSepolia.id]: '0x4200000000000000000000000000000000000006',
  },
  aerodrome: {
    [base.id]: '0x827922686190790b37229fd06084350E74485b72', // Aerodrome Router
    [baseSepolia.id]: '0x0000000000000000000000000000000000000000', // Mock for testnet
  }
};