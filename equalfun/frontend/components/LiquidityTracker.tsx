'use client';

import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';

const AERODROME_POOL_ABI = [
  {
    inputs: [],
    name: 'getReserves',
    outputs: [
      { name: 'reserve0', type: 'uint112' },
      { name: 'reserve1', type: 'uint112' },
      { name: 'blockTimestampLast', type: 'uint32' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

interface LiquidityTrackerProps {
  poolAddress: string;
  tokenSymbol: string;
  initialLiquidity: {
    token: bigint;
    eth: bigint;
  };
}

export function LiquidityTracker({ poolAddress, tokenSymbol, initialLiquidity }: LiquidityTrackerProps) {
  const { data: reserves } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: AERODROME_POOL_ABI,
    functionName: 'getReserves',
  });

  const { data: totalSupply } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: AERODROME_POOL_ABI,
    functionName: 'totalSupply',
  });

  if (!reserves) return null;

  const currentTokenReserve = reserves[0]; // Assuming token is token0
  const currentEthReserve = reserves[1];   // Assuming WETH is token1

  const tokenGrowth = ((currentTokenReserve - initialLiquidity.token) * 100n) / initialLiquidity.token;
  const ethGrowth = ((currentEthReserve - initialLiquidity.eth) * 100n) / initialLiquidity.eth;

  return (
    <div className="glass-effect rounded-xl p-6 space-y-4">
      <h3 className="text-xl font-bold text-white">Liquidity Growth on Aerodrome</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <p className="text-white/70 text-sm mb-1">Current {tokenSymbol} Liquidity</p>
          <p className="text-xl font-bold text-white">
            {formatEther(currentTokenReserve)}
          </p>
          <p className="text-sm text-green-400">
            +{tokenGrowth.toString()}% from initial
          </p>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <p className="text-white/70 text-sm mb-1">Current ETH Liquidity</p>
          <p className="text-xl font-bold text-white">
            {formatEther(currentEthReserve)} ETH
          </p>
          <p className="text-sm text-green-400">
            +{ethGrowth.toString()}% from initial
          </p>
        </div>
      </div>
      
      <div className="bg-white/5 rounded-lg p-4">
        <p className="text-white/70 text-sm mb-1">Total Pool Value (TVL)</p>
        <p className="text-2xl font-bold gradient-text">
          ${((Number(formatEther(currentEthReserve)) * 2) * 3000).toFixed(2)}
        </p>
        <p className="text-xs text-white/50 mt-1">
          *Assuming ETH = $3000
        </p>
      </div>
      
      <div className="text-sm text-white/70 space-y-1">
        <p>• Swap fees (0.3%) continuously add to the pool</p>
        <p>• New LPs can add liquidity anytime</p>
        <p>• Initial liquidity by Equal.fun is locked forever</p>
        <p>• Pool grows with every trade</p>
      </div>
    </div>
  );
}