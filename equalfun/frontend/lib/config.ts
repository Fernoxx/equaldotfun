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
  uniswapV3: {
    factory: {
      [base.id]: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
      [baseSepolia.id]: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
    },
    positionManager: {
      [base.id]: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1',
      [baseSepolia.id]: '0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2',
    },
    swapRouter: {
      [base.id]: '0x2626664c2603336E57B271c5C0b26F421741e481',
      [baseSepolia.id]: '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4',
    }
  }
};