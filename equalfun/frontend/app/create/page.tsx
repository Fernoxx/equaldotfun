'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { FACTORY_ABI } from '@/lib/abis';
import { CONTRACTS } from '@/lib/config';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function CreateToken() {
  const router = useRouter();
  const { address, chainId } = useAccount();
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: ''
  });

  const { data: hash, writeContract, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !chainId) return;
    
    const factoryAddress = CONTRACTS.factory[chainId as keyof typeof CONTRACTS.factory];
    
    writeContract({
      address: factoryAddress as `0x${string}`,
      abi: FACTORY_ABI,
      functionName: 'createToken',
      args: [formData.name, formData.symbol, formData.description],
    });
  };

  if (isSuccess) {
    router.push('/tokens');
  }

  return (
    <main className="min-h-screen bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-4">Launch Your Token</h1>
          <p className="text-xl text-white/70 mb-8">
            Create a fair-launch token with automatic liquidity and rewards distribution
          </p>
          
          {!address ? (
            <div className="glass-effect rounded-xl p-8 text-center">
              <p className="text-white/70 mb-4">Connect your wallet to create a token</p>
              <ConnectButton />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="glass-effect rounded-xl p-8 space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">Token Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Equal Token"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Token Symbol</label>
                  <input
                    type="text"
                    required
                    placeholder="EQUAL"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Description</label>
                  <textarea
                    required
                    placeholder="Describe your token and its purpose..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="glass-effect rounded-xl p-6 space-y-4">
                <h3 className="text-xl font-semibold text-white">Token Details</h3>
                <div className="space-y-2 text-white/70">
                  <p>• Total Supply: 1,000,000,000 tokens</p>
                  <p>• Initial Liquidity: 80% on bonding curve</p>
                  <p>• Reserved for LP: 20% (locked at $55k market cap)</p>
                  <p>• Trading Fee: 1% (40% holders, 40% creator, 20% platform)</p>
                  <p>• Holder Requirement: 24 hours minimum holding period</p>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isPending || isConfirming}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold text-lg hover:scale-[1.02] transition-transform duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Confirming...' : isConfirming ? 'Creating Token...' : 'Launch Token'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}