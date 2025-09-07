# Equal.fun - Fair Token Launches on Base / farcaster

Equal.fun is a decentralized token launch platform on Base chain that ensures fair distribution of rewards to holders, creators, and the platform. Built as a pump.fun clone with unique features for equitable reward distribution.

## Features

- **Fair Launch Mechanism**: No presale, no team allocation - everyone gets equal opportunity
- **Bonding Curve**: Tokens start on a bonding curve for price discovery
- **Automatic Liquidity**: At $55k market cap, liquidity is automatically added to Aerodrome and locked forever
- **Reward Distribution**: 1% fee on all trades:
  - 40% to holders (must hold for 24 hours minimum)
  - 40% to token creators
  - 20% to platform
- **24-Hour Holding Requirement**: Holders must hold tokens for at least 24 hours to be eligible for rewards
- **On-Chain Trading**: After liquidity is locked, all trading moves to Aerodrome DEX

## Tech Stack

- **Smart Contracts**: Solidity 0.8.20, Hardhat, OpenZeppelin
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Web3**: Wagmi, Viem, RainbowKit
- **Chain**: Base (Ethereum L2)

## Contract Architecture

1. **EqualFunFactory.sol**: Main factory contract for creating tokens and managing bonding curves
2. **EqualFunToken.sol**: ERC20 token contract with fee mechanism and holder tracking
3. **EqualFunTreasury.sol**: Treasury contract for managing and distributing collected fees

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/equalfun.git
cd equalfun
```

2. Install dependencies:
```bash
npm install
cd frontend && npm install
cd ..
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your private key and RPC URLs
```

### Deploy Contracts

1. Deploy to Base Sepolia testnet:
```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

2. Deploy to Base mainnet:
```bash
npx hardhat run scripts/deploy.js --network baseMainnet
```

3. Update contract addresses in `frontend/lib/config.ts`

### Run Frontend

1. Navigate to frontend:
```bash
cd frontend
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Add your WalletConnect project ID
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## How It Works

### Token Creation
1. Users can create new tokens with custom name, symbol, and description
2. Total supply is fixed at 1 billion tokens
3. 80% allocated to bonding curve, 20% reserved for liquidity

### Trading on Bonding Curve
1. Initial trading happens on the bonding curve
2. Price increases as more tokens are bought
3. 1% fee applied on all trades

### Automatic Liquidity
1. When market cap reaches ~$55k, liquidity is automatically added to Aerodrome
2. Liquidity is locked forever (sent to dead address)
3. Trading transitions from bonding curve to DEX

### Reward System
1. All trades incur a 1% fee
2. Fees are distributed: 40% holders, 40% creators, 20% platform
3. Holders must hold tokens for 24 hours to be eligible
4. If a holder sells and buys again, the 24-hour timer resets
5. Rewards can be claimed through the treasury contract

## Security Considerations

- Smart contracts should be audited before mainnet deployment
- Use a hardware wallet for deploying contracts
- Test thoroughly on testnet first
- Monitor contract interactions after deployment

## License

MIT License

## Contact

For questions or support, please open an issue on GitHub.
