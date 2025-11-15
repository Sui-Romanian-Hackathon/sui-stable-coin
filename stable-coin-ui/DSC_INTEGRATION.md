# DSC Protocol Integration Guide

This guide explains how to use the DSC (Decentralized Stable Coin) protocol integration in your Next.js application.

## Setup

### 1. Update Configuration

After deploying your Move package, update the constants in `app/config/dsc-constants.ts`:

```typescript
export const DSC_CONFIG = {
    PACKAGE_ID: '0xYOUR_PACKAGE_ID_HERE',
    DSC_CONFIG_ID: '0xYOUR_DSC_CONFIG_ID_HERE',
    DSC_LEDGER_ID: '0xYOUR_DSC_LEDGER_ID_HERE',
    ORACLE_HOLDER_ID: '0xYOUR_ORACLE_HOLDER_ID_HERE',
    NETWORK: 'testnet' as const,
}
```

Get these values from your deployment output.

### 2. Provider Setup

The DSC provider is already integrated into `app/lib/providers.tsx`. The provider hierarchy is:

```
DarkModeProvider
  └─ QueryClientProvider
      └─ SuiClientProvider
          └─ WalletProvider
              └─ DSCProvider  ← DSC data available here
```

## Usage

### Using the DSC Context

Import and use the `useDSC` hook in any component:

```typescript
'use client'

import { useDSC } from '@/app/context/DSCContext'

export function MyComponent() {
    const { userPosition, supportedCoins, isLoading, error } = useDSC()

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Error: {error.message}</div>

    return (
        <div>
            <h2>Health Factor: {userPosition?.healthFactor}</h2>
            <h2>Debt: {userPosition?.debt}</h2>
            <h2>Supported Coins: {supportedCoins.length}</h2>
        </div>
    )
}
```

### Available Data

#### `userPosition`
- `id`: Position object ID (null if no position)
- `coins`: Array of deposited collateral coins
  - `coinType`: The coin type (e.g., "0x2::sui::SUI")
  - `amount`: Amount deposited
  - `price`: Current price
- `healthFactor`: Position health factor (infinity if no debt)
- `debt`: Total DSC debt
- `collateralValue`: Total USD value of collateral

#### `supportedCoins`
Array of coins supported as collateral:
- `coinType`: The coin type identifier
- `price`: Current oracle price
- `decimals`: Coin decimal precision

#### Methods
- `refetchPosition()`: Manually refresh position data
- `refetchCoins()`: Manually refresh supported coins

## Example Components

### 1. Display User Position

```typescript
'use client'

import { useDSC } from '@/app/context/DSCContext'

export function PositionDisplay() {
    const { userPosition, isLoading } = useDSC()

    if (isLoading) return <div>Loading...</div>

    if (!userPosition?.id) {
        return <div>No position found. Create one to get started!</div>
    }

    return (
        <div>
            <h3>Your Position</h3>
            <p>Health Factor: {userPosition.healthFactor}</p>
            <p>Debt: {userPosition.debt} DSC</p>
            <p>Collateral Value: ${userPosition.collateralValue}</p>

            <h4>Deposited Collateral:</h4>
            {userPosition.coins.map((coin, i) => (
                <div key={i}>
                    {coin.coinType}: {coin.amount}
                </div>
            ))}
        </div>
    )
}
```

### 2. Display Supported Coins

```typescript
'use client'

import { useDSC } from '@/app/context/DSCContext'

export function SupportedCoinsList() {
    const { supportedCoins, isLoading } = useDSC()

    if (isLoading) return <div>Loading...</div>

    return (
        <div>
            <h3>Supported Collateral</h3>
            {supportedCoins.map((coin) => (
                <div key={coin.coinType}>
                    <p>{coin.coinType}</p>
                    <p>Price: ${coin.price}</p>
                    <p>Decimals: {coin.decimals}</p>
                </div>
            ))}
        </div>
    )
}
```

### 3. Full Dashboard Example

See `app/components/DSCDashboard.tsx` for a complete example with:
- Position display with health factor
- Collateral breakdown
- Supported coins grid
- Loading and error states
- Formatted numbers and health factor

## Using Individual Hooks

You can also use the hooks directly without the context:

```typescript
import { useUserPosition, useSupportedCoins } from '@/app/hooks/useDSCData'

export function MyComponent() {
    const { data: position, refetch } = useUserPosition()
    const { data: coins } = useSupportedCoins()

    return (
        <button onClick={() => refetch()}>
            Refresh Position
        </button>
    )
}
```

## Data Fetching Strategy

### Automatic Refetching
- User position: Refetches every 30 seconds
- Supported coins: Refetches every 2 minutes
- Both: Automatically refetch when wallet reconnects

### Manual Refetching
```typescript
const { refetchPosition, refetchCoins } = useDSC()

// Refetch after a transaction
await myTransaction()
refetchPosition()
```

### Stale Time
- Position data: Fresh for 10 seconds
- Coin data: Fresh for 1 minute

This means React Query won't refetch if data was fetched within this time, even if the component remounts.

## Error Handling

```typescript
const { error, userPosition } = useDSC()

if (error) {
    // Handle error - data will be null/empty
    console.error('DSC Error:', error)
}
```

Errors are caught and logged. The hook returns empty/default data on error rather than throwing.

## TypeScript Types

All types are exported from `app/types/dsc.ts`:

```typescript
import type {
    UserPosition,
    SupportedCoin,
    CoinAmount,
    DSCData
} from '@/app/types/dsc'
```

## Important Notes

1. **Wallet Required**: All data fetching requires a connected wallet
2. **devInspectTransactionBlock**: Uses Sui's devInspect for read-only calls (no gas fees)
3. **BCS Parsing**: The parser functions may need adjustment based on actual BCS encoding
4. **Oracle Prices**: Prices are fetched from the SupraOracle on-chain
5. **Precision**: All amounts use the system precision (default 18 decimals)

## Troubleshooting

### Data not loading
1. Check wallet is connected
2. Verify `DSC_CONFIG` constants are correct
3. Check browser console for errors
4. Ensure oracle holder ID is valid

### Wrong data format
1. Verify BCS parsing in `app/lib/dsc-queries.ts`
2. Check Move function return types match parsers
3. Test with `console.log` in parser functions

### Performance issues
1. Adjust `refetchInterval` in hooks
2. Increase `staleTime` for less frequent updates
3. Use individual hooks instead of context if needed
