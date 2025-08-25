'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Hero() {
  const router = useRouter();

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-bg opacity-50" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>
      
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-bold mb-6">
          <span className="gradient-text">Equal Rewards</span>
          <br />
          <span className="text-white">For Everyone</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
          Launch tokens on Base with fair distribution. 40% rewards to holders, 40% to creators, 20% to platform. 
          Hold for 24 hours to earn your share.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => router.push('/create')}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold text-lg hover:scale-105 transition-transform duration-200 shadow-lg"
          >
            Launch Your Token
          </button>
          
          <Link
            href="/tokens"
            className="px-8 py-4 glass-effect rounded-xl text-white font-semibold text-lg hover:scale-105 transition-transform duration-200"
          >
            Explore Tokens
          </Link>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-effect rounded-xl p-6">
            <div className="text-3xl mb-2">💎</div>
            <h3 className="text-xl font-semibold text-white mb-2">Fair Launch</h3>
            <p className="text-white/70">No presale, no team allocation. Everyone gets equal opportunity.</p>
          </div>
          
          <div className="glass-effect rounded-xl p-6">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="text-xl font-semibold text-white mb-2">Auto Liquidity</h3>
            <p className="text-white/70">At $55k market cap, liquidity is locked forever on Aerodrome.</p>
          </div>
          
          <div className="glass-effect rounded-xl p-6">
            <div className="text-3xl mb-2">🎁</div>
            <h3 className="text-xl font-semibold text-white mb-2">Holder Rewards</h3>
            <p className="text-white/70">Hold tokens for 24 hours to claim your share of trading fees.</p>
          </div>
        </div>
      </div>
    </section>
  );
}