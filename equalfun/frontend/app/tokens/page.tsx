'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useReadContract } from 'wagmi';
import { FACTORY_ABI, TOKEN_ABI } from '@/lib/abis';
import { CONTRACTS } from '@/lib/config';
import Link from 'next/link';
import { formatEther } from 'viem';

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  marketCap: string;
  liquidityLocked: boolean;
  ethReserve: bigint;
  tokenReserve: bigint;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const chainId = 8453; // Base mainnet
  
  const { data: allTokenAddresses } = useReadContract({
    address: CONTRACTS.factory[chainId] as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'getAllTokens',
  });

  useEffect(() => {
    const fetchTokenData = async () => {
      if (!allTokenAddresses) return;
      
      const tokenPromises = allTokenAddresses.map(async (address: string) => {
        // Fetch token data from factory
        const tokenDataResponse = await fetch(`/api/tokens/${address}`);
        const tokenData = await tokenDataResponse.json();
        
        return {
          address,
          name: tokenData.name,
          symbol: tokenData.symbol,
          marketCap: tokenData.marketCap,
          liquidityLocked: tokenData.liquidityLocked,
          ethReserve: tokenData.ethReserve,
          tokenReserve: tokenData.tokenReserve,
        };
      });
      
      const tokensData = await Promise.all(tokenPromises);
      setTokens(tokensData);
    };
    
    fetchTokenData();
  }, [allTokenAddresses]);

  return (
    <main className="min-h-screen bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-5xl font-bold text-white mb-4">Explore Tokens</h1>
              <p className="text-xl text-white/70">
                Discover and trade fair-launch tokens on Equal.fun
              </p>
            </div>
            
            <Link
              href="/create"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold hover:scale-105 transition-transform duration-200"
            >
              Launch Token
            </Link>
          </div>
          
          <div className="grid gap-4">
            {tokens.length === 0 ? (
              <div className="glass-effect rounded-xl p-12 text-center">
                <p className="text-white/70 text-lg">No tokens launched yet. Be the first!</p>
              </div>
            ) : (
              tokens.map((token) => (
                <Link
                  key={token.address}
                  href={`/token/${token.address}`}
                  className="glass-effect rounded-xl p-6 hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white font-bold">{token.symbol[0]}</span>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors">
                          {token.name}
                        </h3>
                        <p className="text-white/70">${token.symbol}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-white font-semibold">
                        ${token.marketCap}
                      </p>
                      <p className="text-sm text-white/70">
                        {token.liquidityLocked ? (
                          <span className="text-green-400">✓ Liquidity Locked</span>
                        ) : (
                          <span className="text-yellow-400">Bonding Curve Active</span>
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}