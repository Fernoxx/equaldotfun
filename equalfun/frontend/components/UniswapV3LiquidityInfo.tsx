'use client';

import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';

interface LiquidityInfoProps {
  tokenAddress: string;
  poolAddress: string;
}

export function UniswapV3LiquidityInfo({ tokenAddress, poolAddress }: LiquidityInfoProps) {
  // In a real implementation, you'd fetch pool data from Uniswap V3
  
  return (
    <div className="glass-effect rounded-xl p-6 space-y-4">
      <h3 className="text-xl font-bold text-white">How Liquidity Grows on Uniswap V3</h3>
      
      <div className="space-y-3 text-white/80">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-purple-400">1</span>
          </div>
          <div>
            <h4 className="font-semibold text-white">Initial Liquidity (Locked Forever)</h4>
            <p className="text-sm">90% of tokens + your ETH creates the initial pool. LP NFT sent to 0xdead address.</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-purple-400">2</span>
          </div>
          <div>
            <h4 className="font-semibold text-white">Trading Fees (1% on all swaps)</h4>
            <p className="text-sm">Every trade adds 1% fee to the pool, growing liquidity automatically.</p>
            <div className="mt-1 text-xs space-y-1">
              <p>• 40% distributed to holders (24h+ holding)</p>
              <p>• 40% claimable by token creator</p>
              <p>• 20% to Equal.fun platform</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-purple-400">3</span>
          </div>
          <div>
            <h4 className="font-semibold text-white">Additional Liquidity Providers</h4>
            <p className="text-sm">Anyone can add more liquidity to earn trading fees. They can remove their portion anytime.</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-purple-400">4</span>
          </div>
          <div>
            <h4 className="font-semibold text-white">Concentrated Liquidity Benefits</h4>
            <p className="text-sm">V3's capital efficiency means deeper liquidity with less capital locked.</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
        <p className="text-sm text-white/90">
          <span className="font-semibold">Example Growth:</span> A token with $10k daily volume generates $100/day in fees. 
          Over 30 days, that's $3,000 added to liquidity, plus any new LPs joining for fee income.
        </p>
      </div>
    </div>
  );
}