# knowledge-base/examples.md

# Real-World Examples

## Example 1: New User - First Deposit

**Situation:**
- User deposits 1,000 SUI
- Current SUI price: $10
- Collateral value: $10,000

**Question:** "How much can I safely borrow?"

**Answer:**
For a safe health factor of 1.5:
Max Borrow = ($10,000 × 0.80) / 1.5 = $5,333

For a very safe HF of 2.0:
Max Borrow = ($10,000 × 0.80) / 2.0 = $4,000

**Recommendation**: Start with borrowing $4,000-5,000 to maintain a healthy position.

## Example 2: Increasing Health Factor

**Situation:**
- Collateral: $10,000
- Borrowed: $7,000
- Current HF: 1.14
- Target HF: 1.5

**Question:** "What should I do to reach HF of 1.5?"

**Answer:**

**Option 1 - Deposit More:**
Additional Collateral = ($7,000 × 1.5 / 0.80) - $10,000 = $3,125

**Option 2 - Repay Debt:**
Amount to Repay = $7,000 - ($10,000 × 0.80 / 1.5) = $1,667

**Recommendation**: Repaying $1,667 is more capital efficient than depositing $3,125.

## Example 3: Market Volatility

**Situation:**
- Collateral: 1,000 SUI @ $10 = $10,000
- Borrowed: $6,500
- Current HF: 1.23
- Market is volatile

**Question:** "What happens if SUI drops to $9?"

**Answer:**
New collateral value: $9,000
New HF = ($9,000 × 0.80) / $6,500 = 1.11

Your HF would drop to 1.11, which is risky.

**Action needed**: Either deposit more SUI or repay some debt now to prepare for volatility.

## Example 4: Liquidation Avoidance

**Situation:**
- Collateral: $10,000
- Borrowed: $7,500
- Current HF: 1.07
- 🚨 Close to liquidation!

**Question:** "How do I avoid liquidation immediately?"

**Answer:**
You need HF > 1.0 to avoid liquidation, but should target 1.5 minimum.

**Urgent actions:**
To reach HF of 1.5:
- Repay $2,167 immediately, OR
- Deposit $3,906 more collateral

**Recommended**: Repay at least $2,167 right now to move to safety.

## Example 5: Maximizing Borrowing Power

**Situation:**
- Collateral: $20,000
- Current debt: $0
- Want to maximize borrowing

**Question:** "What's the maximum I can borrow while staying safe?"

**Answer:**
At HF = 1.5 (recommended safe minimum):
Max Borrow = ($20,000 × 0.80) / 1.5 = $10,667

At HF = 2.0 (very safe):
Max Borrow = ($20,000 × 0.80) / 2.0 = $8,000

**Recommendation**: Borrow $8,000-9,000 to maintain a comfortable safety margin.