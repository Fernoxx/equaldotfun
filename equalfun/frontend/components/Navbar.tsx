'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">=</span>
            </div>
            <span className="text-2xl font-bold gradient-text">Equal.fun</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link href="/create" className="text-white/70 hover:text-white transition-colors">
              Launch Token
            </Link>
            <Link href="/tokens" className="text-white/70 hover:text-white transition-colors">
              Explore
            </Link>
            <Link href="/rewards" className="text-white/70 hover:text-white transition-colors">
              Rewards
            </Link>
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}