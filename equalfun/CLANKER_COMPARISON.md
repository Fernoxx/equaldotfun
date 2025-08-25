# Clanker vs Equal.fun Comparison

## Overview

Both platforms enable permissionless token creation on Base, but with different approaches to liquidity and rewards.

## Key Differences

### 1. **Liquidity Model**

**Clanker:**
- Direct deployment to Uniswap V3 concentrated liquidity
- No bonding curve phase
- Immediate trading with full liquidity
- Multiple pools possible (up to 7)

**Equal.fun:**
- Starts with bonding curve (like pump.fun)
- Graduates to Aerodrome at $55k market cap
- Permanent liquidity lock on graduation
- Single pool per token

### 2. **Fee Distribution**

**Clanker:**
```
1% swap fee:
- 40% to protocol
- 30% to interface/referrer
- 30% to token creator
```

**Equal.fun:**
```
1% swap fee:
- 40% to holders (24h+ holding)
- 40% to creator
- 20% to platform
```

### 3. **Holder Incentives**

**Clanker:**
- No direct holder rewards
- Creator/protocol focused

**Equal.fun:**
- 40% of fees to holders
- 24-hour minimum hold requirement
- Timer resets on sell/rebuy
- Proportional distribution

### 4. **Advanced Features**

**Clanker v4:**
- Vaulting (lock supply)
- Dev buys
- Airdrops
- MEV protection
- Multiple fee recipients
- Dynamic fee tiers

**Equal.fun:**
- Automatic liquidity lock
- Holder reward tracking
- Bonding curve graduation
- Treasury system

### 5. **Social Integration**

**Clanker:**
- Deploy via Farcaster (@clanker)
- AI-powered assistance
- Social-first approach

**Equal.fun:**
- Web interface
- Direct contract interaction
- Traditional DeFi approach

## Revenue Comparison

**Clanker Performance (5 months):**
- 200,000+ tokens created
- $2.7B trading volume
- $13M protocol revenue

**Equal.fun Projections:**
- Higher holder retention (40% rewards)
- Lower protocol take (20% vs 40%)
- Focus on long-term holders

## Technical Architecture

### Clanker
```
User → Farcaster/Interface → Clanker Contract → Uniswap V3
                                              ↓
                                         Fee Distribution
```

### Equal.fun
```
User → Web Interface → Factory Contract → Bonding Curve → Aerodrome
                                       ↓
                                  Treasury → Holder/Creator/Platform
```

## Which is Better?

**Choose Clanker if:**
- You want immediate Uniswap V3 liquidity
- Social integration is important
- You need advanced features (vaulting, airdrops)
- Protocol revenue is priority

**Choose Equal.fun if:**
- You want pump.fun-style launches
- Holder rewards are important
- You prefer Aerodrome over Uniswap
- Fair distribution is priority

## Hybrid Approach

Equal.fun V2 could incorporate:
1. Optional Uniswap V3 support
2. Vaulting mechanism
3. MEV protection
4. Social integration
5. Multiple fee recipients

While maintaining:
- Bonding curve launches
- 24-hour holder rewards
- Automatic liquidity locks
- Fair distribution model