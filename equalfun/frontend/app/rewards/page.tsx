'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAccount, useReadContract } from 'wagmi';
import { FACTORY_ABI, TOKEN_ABI, TREASURY_ABI } from '@/lib/abis';
import { CONTRACTS } from '@/lib/config';
import { formatEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

interface TokenReward {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  balance: bigint;
  isEligible: boolean;
  claimableAmount: bigint;
  holdingDuration: bigint;
}

export default function RewardsPage() {
  const { address, chainId } = useAccount();
  const [rewards, setRewards] = useState<TokenReward[]>([]);
  
  const factoryAddress = chainId ? CONTRACTS.factory[chainId as keyof typeof CONTRACTS.factory] : undefined;
  const treasuryAddress = chainId ? CONTRACTS.treasury[chainId as keyof typeof CONTRACTS.treasury] : undefined;

  const { data: allTokens } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'getAllTokens',
  });

  useEffect(() => {
    const fetchRewards = async () => {
      if (!allTokens || !address) return;
      
      const rewardPromises = allTokens.map(async (tokenAddress: string) => {
        // Simulated data - in production, these would be actual contract calls
        const mockData = {
          tokenAddress,
          tokenName: `Token ${tokenAddress.slice(-4)}`,
          tokenSymbol: `TKN${tokenAddress.slice(-4)}`,
          balance: BigInt(Math.floor(Math.random() * 1000000) * 10**18),
          isEligible: Math.random() > 0.5,
          claimableAmount: BigInt(Math.floor(Math.random() * 1000) * 10**18),
          holdingDuration: BigInt(Math.floor(Math.random() * 48 * 3600)),
        };
        
        return mockData;
      });
      
      const rewardsData = await Promise.all(rewardPromises);
      setRewards(rewardsData.filter(r => r.balance > 0n));
    };
    
    fetchRewards();
  }, [allTokens, address]);

  const totalClaimable = rewards.reduce((acc, r) => acc + (r.isEligible ? r.claimableAmount : 0n), 0n);

  return (
    <main className="min-h-screen bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-4">Your Rewards</h1>
          <p className="text-xl text-white/70 mb-8">
            Track and claim your holder rewards from all Equal.fun tokens
          </p>
          
          {!address ? (
            <div className="glass-effect rounded-xl p-12 text-center">
              <p className="text-white/70 text-lg mb-4">Connect your wallet to view rewards</p>
              <ConnectButton />
            </div>
          ) : (
            <>
              <div className="glass-effect rounded-xl p-8 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-white/70 mb-1">Total Holdings</p>
                    <p className="text-3xl font-bold gradient-text">{rewards.length} Tokens</p>
                  </div>
                  
                  <div>
                    <p className="text-white/70 mb-1">Eligible Rewards</p>
                    <p className="text-3xl font-bold text-green-400">
                      {rewards.filter(r => r.isEligible).length} Tokens
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-white/70 mb-1">Total Claimable</p>
                    <p className="text-3xl font-bold text-purple-400">
                      ~${formatEther(totalClaimable)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {rewards.length === 0 ? (
                  <div className="glass-effect rounded-xl p-8 text-center">
                    <p className="text-white/70">You don't hold any Equal.fun tokens yet</p>
                    <Link
                      href="/tokens"
                      className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold hover:scale-105 transition-transform duration-200"
                    >
                      Explore Tokens
                    </Link>
                  </div>
                ) : (
                  rewards.map((reward) => (
                    <div key={reward.tokenAddress} className="glass-effect rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-bold">{reward.tokenSymbol[0]}</span>
                          </div>
                          
                          <div>
                            <h3 className="text-xl font-semibold text-white">{reward.tokenName}</h3>
                            <p className="text-white/70">Balance: {formatEther(reward.balance)} {reward.tokenSymbol}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-white mb-1">
                            {reward.isEligible ? (
                              <span className="text-green-400">✓ Eligible</span>
                            ) : (
                              <span className="text-yellow-400">
                                {24 - Number(reward.holdingDuration) / 3600}h remaining
                              </span>
                            )}
                          </p>
                          <p className="text-lg font-semibold text-white">
                            {formatEther(reward.claimableAmount)} {reward.tokenSymbol}
                          </p>
                          
                          <Link
                            href={`/token/${reward.tokenAddress}`}
                            className="inline-block mt-2 px-4 py-2 bg-purple-500 rounded-lg text-white text-sm font-semibold hover:bg-purple-600 transition-colors"
                          >
                            {reward.isEligible ? 'Claim' : 'View'}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}