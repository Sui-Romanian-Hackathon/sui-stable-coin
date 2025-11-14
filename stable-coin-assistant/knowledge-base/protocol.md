# knowledge-base/protocol.md

# Sui Stablecoin Protocol - Complete Documentation

## Protocol Overview
The Sui Stablecoin Protocol allows users to:
- Deposit collateral (SUI, wETH, wBTC, etc.)
- Borrow stablecoins against their collateral
- Maintain positions with health factors
- Avoid liquidation by managing their positions

## Key Parameters (Updated: 2024-11-05)

### Liquidation Threshold
- **Value**: 80% (0.80)
- **Meaning**: Users can borrow up to 80% of their collateral value
- **Example**: $1000 collateral → max $800 borrow at liquidation threshold

### Liquidation Penalty
- **Value**: 10% (0.10)
- **Meaning**: Liquidators receive 10% of the collateral as reward
- **Example**: If liquidated with $1000 collateral, liquidator gets $100 bonus

### Minimum Health Factor
- **Value**: 1.0
- **Meaning**: Positions with HF < 1.0 are eligible for liquidation
- **Recommended**: Keep HF > 1.5 for safety margin

### Collateral Types
1. **SUI**
    - Collateral Factor: 75%
    - Liquidation Threshold: 80%
    - Oracle: Pyth Network

2. **wETH**
    - Collateral Factor: 80%
    - Liquidation Threshold: 85%
    - Oracle: Pyth Network

3. **wBTC**
    - Collateral Factor: 75%
    - Liquidation Threshold: 80%
    - Oracle: Pyth Network

### Interest Rates
- Base Rate: 2% APY
- Utilization-based: Up to 15% APY at 90% utilization
- Updated: Every block

## Core Concepts

### Health Factor (HF)
The health factor measures position safety.

**Formula:**
```
HF = (Collateral Value × Liquidation Threshold) / Borrowed Amount
```

**Interpretation:**
- HF > 2.0: Very safe position
- HF 1.5-2.0: Safe position
- HF 1.2-1.5: Moderate risk
- HF 1.0-1.2: High risk, close to liquidation
- HF < 1.0: Position will be liquidated

**Example:**
- Collateral: $10,000 SUI
- Borrowed: $6,000 stablecoins
- Liquidation Threshold: 80%
- HF = ($10,000 × 0.80) / $6,000 = 1.33

This means the position is 33% away from liquidation.

### Maximum Safe Borrow Amount

To maintain a target health factor, use:

**Formula:**
```
Max Borrow = (Collateral Value × Liquidation Threshold) / Target HF
```

**Example for Target HF = 1.5:**
- Collateral: $10,000
- Liquidation Threshold: 80%
- Max Borrow = ($10,000 × 0.80) / 1.5 = $5,333

**Example for Target HF = 2.0:**
- Max Borrow = ($10,000 × 0.80) / 2.0 = $4,000

### Liquidation Price

The collateral price at which liquidation occurs:

**Formula:**
```
Liquidation Price = (Borrowed Amount / Collateral Amount) / Liquidation Threshold
```

**Example:**
- Borrowed: $6,000
- Collateral: 1,000 SUI (current price $10)
- Liquidation Threshold: 80%
- Liquidation Price = ($6,000 / 1,000) / 0.80 = $7.50

If SUI price drops to $7.50, the position will be liquidated.

## Position Management

### How to Increase Health Factor

#### Option 1: Deposit More Collateral

**Formula:**
```
Additional Collateral Needed = (Borrowed Amount × Target HF / Liquidation Threshold) - Current Collateral Value
```

**Example:**
- Current Collateral: $10,000
- Borrowed: $6,000
- Current HF: 1.33
- Target HF: 1.5
- Additional Collateral = ($6,000 × 1.5 / 0.80) - $10,000 = $11,250 - $10,000 = $1,250

**Deposit $1,250 more collateral to reach HF of 1.5**

#### Option 2: Repay Debt

**Formula:**
```
Amount to Repay = Current Debt - (Current Collateral Value × Liquidation Threshold / Target HF)
```

**Example:**
- Current Collateral: $10,000
- Current Debt: $6,000
- Current HF: 1.33
- Target HF: 1.5
- Amount to Repay = $6,000 - ($10,000 × 0.80 / 1.5) = $6,000 - $5,333 = $667

**Repay $667 to reach HF of 1.5**

#### Option 3: Combination Strategy

Users can also use a combination:
- Deposit some collateral
- Repay some debt
- The effect is additive

### How to Calculate Available to Borrow

**Formula:**
```
Available to Borrow = (Current Collateral Value × Liquidation Threshold / Target HF) - Current Debt
```

**Example:**
- Collateral: $10,000
- Current Debt: $4,000
- Target HF: 1.5
- Available = ($10,000 × 0.80 / 1.5) - $4,000 = $5,333 - $4,000 = $1,333

**Can safely borrow an additional $1,333 while maintaining HF of 1.5**

## Safety Guidelines

### Recommended Practices
1. **Maintain HF > 1.5**: Provides buffer against market volatility
2. **Monitor liquidation price**: Set alerts when collateral price approaches this level
3. **Diversify collateral**: Use multiple collateral types to reduce risk
4. **Watch utilization**: High protocol utilization can spike interest rates
5. **Keep reserves**: Always have funds available to add collateral in emergencies

### Risk Scenarios

#### Market Crash Scenario
If collateral price drops 20%:
- Original Collateral Value: $10,000 → $8,000
- Borrowed: $6,000
- New HF = ($8,000 × 0.80) / $6,000 = 1.07
- Position is now at high risk

**Action**: Deposit more collateral or repay debt immediately

#### Flash Crash Scenario
Rapid price movements can liquidate positions before users react.

**Mitigation**:
- Keep HF > 2.0 during volatile markets
- Set up automated alerts
- Consider stop-loss mechanisms

### Warning Thresholds
The protocol should warn users when:
- HF < 1.5: "Your position is approaching moderate risk"
- HF < 1.3: "⚠️ Warning: Your position has elevated risk"
- HF < 1.1: "🚨 URGENT: Your position is at high risk of liquidation"

## Liquidation Process

### When Liquidation Occurs
- Position HF drops below 1.0
- Liquidators can repay user's debt
- Liquidators receive collateral + 10% penalty

### Liquidation Example
- User Collateral: $10,000
- User Debt: $8,500
- HF = ($10,000 × 0.80) / $8,500 = 0.94 (below 1.0)
- Liquidator repays $8,500 debt
- Liquidator receives: $8,500 + ($8,500 × 0.10) = $9,350 in collateral
- User loses: $9,350 (keeps $650 of collateral)

### How to Avoid Liquidation
1. Monitor health factor daily
2. Set price alerts on collateral assets
3. Keep emergency funds ready
4. React quickly to HF warnings
5. Don't over-leverage

## Advanced Topics

### Multiple Collateral Types

When using multiple collateral types:

**Formula:**
```
Total Collateral Value = Σ(Collateral_i × Price_i × Collateral_Factor_i)
HF = Total Collateral Value / Total Debt
```

**Example:**
- 100 SUI @ $10 with 75% factor = $750
- 0.5 wETH @ $2,000 with 80% factor = $800
- Total Weighted Collateral = $1,550
- Debt: $1,000
- HF = $1,550 / $1,000 = 1.55

### Interest Accrual

Debt increases over time due to interest:

**Formula:**
```
New Debt = Initial Debt × (1 + Annual Rate × Time in Years)
```

For continuous compounding:
```
New Debt = Initial Debt × e^(Annual Rate × Time)
```

**Example:**
- Borrowed: $10,000
- Interest Rate: 5% APY
- After 1 year: $10,000 × 1.05 = $10,500
- After 1 month: $10,000 × (1 + 0.05/12) ≈ $10,041.67

### Utilization Rate Impact

Protocol utilization affects borrow rates:

**Formula:**
```
Utilization = Total Borrowed / Total Supplied
```

**Rate Model:**
- 0-80% utilization: Base rate + (Utilization × 0.1)
- 80-100% utilization: Exponential increase

**Example:**
- At 50% utilization: 2% + (0.50 × 0.1) = 7% APY
- At 90% utilization: ~15% APY (steep curve)