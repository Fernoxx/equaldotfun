# How Liquidity Grows in Equal.fun (Uniswap V3 Version)

## Overview

Equal.fun now uses Uniswap V3 for direct token launches, similar to Clanker but with our unique 24-hour holder reward system. Here's how liquidity grows over time:

## Initial Liquidity (At Token Creation)

1. **Creator provides ETH** (minimum 0.1 ETH)
2. **90% of token supply** is paired with this ETH
3. **LP NFT is sent to 0xdead** (permanently locked)
4. **10% goes to creator** for marketing/community

```
Example:
- Creator provides: 0.5 ETH
- Token allocation: 900M tokens (90% of 1B)
- Initial price: 0.5 ETH / 900M tokens
- Liquidity: Locked forever
```

## Liquidity Growth Mechanisms

### 1. **Trading Fees (Primary Growth)**

Every swap incurs a 1% fee that gets added to the pool:

```
Daily Volume: $10,000
Daily Fees: $100 (1%)
Monthly Growth: $3,000

Distribution:
- 40% ($40/day) → Holders (24h+ requirement)
- 40% ($40/day) → Creator
- 20% ($20/day) → Platform
```

### 2. **Additional Liquidity Providers**

Anyone can add more liquidity to earn trading fees:

```
New LP adds:
- 100M tokens + 0.2 ETH
- Earns proportional share of 1% fees
- Can withdraw anytime (unlike initial liquidity)
```

### 3. **Concentrated Liquidity Benefits**

Uniswap V3's capital efficiency means:
- **Deeper liquidity** with less capital
- **Better prices** for traders
- **Higher fee income** for LPs
- **Full range** positions ensure liquidity at all prices

### 4. **Price Appreciation**

As token price increases, TVL grows:

```
Launch: 0.5 ETH = $1,500 TVL
After growth: 2 ETH = $6,000 TVL
(Without adding any new liquidity)
```

## Real Growth Example

```
Day 1:
- Initial: 0.5 ETH + 900M tokens
- Volume: $5,000 → $50 fees added
- New LPs: +0.2 ETH → Deeper liquidity

Week 1:
- Cumulative fees: $350
- Additional LPs: +1 ETH
- Total liquidity: ~2 ETH + tokens

Month 1:
- Cumulative fees: $1,500
- Multiple LPs joined
- Total liquidity: 5-10x initial
```

## Comparison with Bonding Curve Model

| Feature | Bonding Curve | Uniswap V3 |
|---------|---------------|------------|
| Launch Cost | Free | 0.1+ ETH required |
| Initial Liquidity | Builds gradually | Immediate deep liquidity |
| Price Discovery | Algorithmic curve | Market-driven |
| Liquidity Growth | Only from trades | Trades + new LPs |
| Capital Efficiency | Lower | Higher (concentrated) |

## Benefits of Uniswap V3 Model

1. **Immediate Trading**: No waiting for graduation
2. **Professional Tools**: Traders can use limit orders, charts
3. **Composability**: Works with aggregators, bots
4. **Fee Optimization**: LPs can choose price ranges
5. **Better UX**: Familiar interface for traders

## Our Unique Features Remain

- **24-hour hold requirement** for rewards
- **40% to holders** who diamond hand
- **Timer reset** on sell/rebuy
- **Permanent initial lock** prevents rugs
- **Fair distribution** model

## Summary

While we've moved from bonding curves to direct Uniswap V3 launches, our core value proposition remains: **Equal rewards for holders, creators, and platform**. The V3 model provides better liquidity from day one while maintaining our unique holder incentive system.