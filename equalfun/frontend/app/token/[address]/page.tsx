'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useParams } from 'next/navigation';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { FACTORY_ABI, TOKEN_ABI, TREASURY_ABI } from '@/lib/abis';
import { CONTRACTS } from '@/lib/config';
import { formatEther, parseEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function TokenPage() {
  const params = useParams();
  const tokenAddress = params.address as string;
  const { address, chainId } = useAccount();
  const [amount, setAmount] = useState('');
  const [isBuying, setIsBuying] = useState(true);
  
  const factoryAddress = chainId ? CONTRACTS.factory[chainId as keyof typeof CONTRACTS.factory] : undefined;
  const treasuryAddress = chainId ? CONTRACTS.treasury[chainId as keyof typeof CONTRACTS.treasury] : undefined;

  // Fetch token data
  const { data: tokenData } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'getTokenData',
    args: [tokenAddress as `0x${string}`],
  });

  // Fetch token info
  const { data: tokenName } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'name',
  });

  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'symbol',
  });

  const { data: userBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: isEligible } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'isEligibleForRewards',
    args: address ? [address] : undefined,
  });

  const { data: claimableAmount } = useReadContract({
    address: treasuryAddress as `0x${string}`,
    abi: TREASURY_ABI,
    functionName: 'getHolderClaimableAmount',
    args: address ? [tokenAddress as `0x${string}`, address] : undefined,
  });

  // Buy token
  const { writeContract: buyToken, data: buyHash } = useWriteContract();
  const { isLoading: isBuyConfirming } = useWaitForTransactionReceipt({ hash: buyHash });

  // Sell token
  const { writeContract: sellToken, data: sellHash } = useWriteContract();
  const { isLoading: isSellConfirming } = useWaitForTransactionReceipt({ hash: sellHash });

  // Claim rewards
  const { writeContract: claimRewards, data: claimHash } = useWriteContract();
  const { isLoading: isClaimConfirming } = useWaitForTransactionReceipt({ hash: claimHash });

  const handleTrade = async () => {
    if (!factoryAddress || !amount) return;

    if (isBuying) {
      buyToken({
        address: factoryAddress as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'buyToken',
        args: [tokenAddress as `0x${string}`],
        value: parseEther(amount),
      });
    } else {
      // First approve
      const approveHash = await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'approve',
        args: [factoryAddress as `0x${string}`, parseEther(amount)],
      });
      
      // Then sell
      sellToken({
        address: factoryAddress as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'sellToken',
        args: [tokenAddress as `0x${string}`, parseEther(amount)],
      });
    }
  };

  const handleClaim = () => {
    if (!treasuryAddress) return;
    
    claimRewards({
      address: treasuryAddress as `0x${string}`,
      abi: TREASURY_ABI,
      functionName: 'claimHolderRewards',
      args: [tokenAddress as `0x${string}`],
    });
  };

  const marketCap = tokenData && tokenData.tokenReserve > 0n
    ? (tokenData.ethReserve * tokenData.totalSupply) / tokenData.tokenReserve
    : 0n;

  return (
    <main className="min-h-screen bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Token Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-effect rounded-xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">{tokenSymbol?.[0]}</span>
                  </div>
                  
                  <div>
                    <h1 className="text-3xl font-bold text-white">{tokenName}</h1>
                    <p className="text-xl text-white/70">${tokenSymbol}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/70 text-sm">Market Cap</p>
                    <p className="text-2xl font-bold text-white">
                      ${marketCap ? formatEther(marketCap) : '0'}
                    </p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/70 text-sm">Your Balance</p>
                    <p className="text-2xl font-bold text-white">
                      {userBalance ? formatEther(userBalance) : '0'}
                    </p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/70 text-sm">Liquidity</p>
                    <p className="text-2xl font-bold text-white">
                      {tokenData ? formatEther(tokenData.ethReserve) : '0'} ETH
                    </p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/70 text-sm">Status</p>
                    <p className="text-lg font-semibold">
                      {tokenData?.liquidityLocked ? (
                        <span className="text-green-400">Liquidity Locked</span>
                      ) : (
                        <span className="text-yellow-400">Bonding Curve</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Trading Interface */}
              {!tokenData?.liquidityLocked && (
                <div className="glass-effect rounded-xl p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Trade</h2>
                  
                  {!address ? (
                    <div className="text-center">
                      <p className="text-white/70 mb-4">Connect wallet to trade</p>
                      <ConnectButton />
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2 mb-4">
                        <button
                          onClick={() => setIsBuying(true)}
                          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                            isBuying
                              ? 'bg-green-500 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          Buy
                        </button>
                        <button
                          onClick={() => setIsBuying(false)}
                          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                            !isBuying
                              ? 'bg-red-500 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          Sell
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/70 text-sm mb-2">
                            Amount ({isBuying ? 'ETH' : tokenSymbol})
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            placeholder="0.0"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                          />
                        </div>
                        
                        <button
                          onClick={handleTrade}
                          disabled={!amount || isBuyConfirming || isSellConfirming}
                          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold hover:scale-[1.02] transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isBuyConfirming || isSellConfirming ? 'Processing...' : isBuying ? 'Buy' : 'Sell'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Rewards Section */}
            <div className="space-y-6">
              <div className="glass-effect rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Your Rewards</h3>
                
                {!address ? (
                  <p className="text-white/70">Connect wallet to see rewards</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-white/70 text-sm">Eligibility Status</p>
                      <p className={`font-semibold ${isEligible ? 'text-green-400' : 'text-yellow-400'}`}>
                        {isEligible ? 'Eligible (24h+ holder)' : 'Not Eligible Yet'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-white/70 text-sm">Claimable Amount</p>
                      <p className="text-xl font-bold text-white">
                        {claimableAmount ? formatEther(claimableAmount) : '0'} {tokenSymbol}
                      </p>
                    </div>
                    
                    <button
                      onClick={handleClaim}
                      disabled={!isEligible || !claimableAmount || claimableAmount === 0n || isClaimConfirming}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold hover:scale-[1.02] transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isClaimConfirming ? 'Claiming...' : 'Claim Rewards'}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="glass-effect rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Fee Distribution</h3>
                <div className="space-y-2 text-white/70">
                  <p>• 40% to holders (24h+ holding)</p>
                  <p>• 40% to token creator</p>
                  <p>• 20% to Equal.fun platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}