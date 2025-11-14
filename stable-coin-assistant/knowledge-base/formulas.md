# knowledge-base/formulas.md

# Quick Reference: All Formulas

## Health Factor
```
HF = (Collateral Value × Liquidation Threshold) / Borrowed Amount
```

## Maximum Borrow (for target HF)
```
Max Borrow = (Collateral Value × Liquidation Threshold) / Target HF
```

## Additional Collateral Needed
```
Additional Collateral = (Borrowed Amount × Target HF / Liquidation Threshold) - Current Collateral Value
```

## Debt to Repay
```
Amount to Repay = Current Debt - (Current Collateral Value × Liquidation Threshold / Target HF)
```

## Liquidation Price
```
Liquidation Price = (Borrowed Amount / Collateral Amount) / Liquidation Threshold
```

## Available to Borrow
```
Available = (Current Collateral Value × Liquidation Threshold / Target HF) - Current Debt
```

## Interest Calculation
```
New Debt = Initial Debt × (1 + Annual Rate × Time in Years)
```

## Utilization Rate
```
Utilization = Total Borrowed / Total Supplied
```