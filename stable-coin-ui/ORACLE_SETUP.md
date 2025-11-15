# Oracle Setup Instructions

## Problem

The error `EOracleNotSupported` occurs because the Oracle Holder ID hasn't been registered in the DSC Config smart contract yet.

## Root Cause

When the DSC contract is deployed, the `supported_oracle_holder_id` field in `DSCConfig` is initialized as `None`. This means:
1. No oracle is configured by default
2. Any function that needs oracle prices (like `get_user_position_info`) will fail
3. An admin must register the oracle holder before these functions work

## Solution

You need to register the Oracle Holder by calling the `change_oracle_holder` function with the `AdminCap`.

### Step 1: Find Your AdminCap Object ID

When you deployed the contract, an `AdminCap` object was created and transferred to your address. You need to find its object ID.

Run this command (replace `YOUR_ADDRESS` with your wallet address):

```bash
sui client objects --address YOUR_ADDRESS
```

Look for an object of type `AdminCap` or `0x...::dsc_config::AdminCap`.

### Step 2: Register the Oracle

Create a transaction to register the oracle holder:

```typescript
import { Transaction } from '@mysten/sui/transactions'

const tx = new Transaction()

tx.moveCall({
    target: `${PACKAGE_ID}::dsc_config::change_oracle_holder`,
    arguments: [
        tx.object(ADMIN_CAP_ID),  // Your AdminCap object ID
        tx.object(DSC_CONFIG_ID),
        tx.pure.id(ORACLE_HOLDER_ID),
    ],
})

// Sign and execute with your wallet
```

### Step 3: Verify

After registering, you can verify by calling `get_supported_oracle_holder_id` on the DSC Config object.

## Current Configuration

```typescript
PACKAGE_ID: '0x2b26d3186b5f84c0ec9918221e2b6d057c670df89e4ade29c992ea4a09c72b03'
DSC_CONFIG_ID: '0xc8989ea334a0355d6af339d0353525c2ca2b02a955688e6349c0cee500d027a5'
DSC_LEDGER_ID: '0x83abdfff6f113f4b626807679acb8dd67fb8b46114662b7fc390a6fbaf1c62bd'
ORACLE_HOLDER_ID: '0x87ef65b543ecb192e89d1e6afeaf38feeb13c3a20c20ce413b29a9cbfbebd570'
```

## Temporary Workaround

The frontend now handles this error gracefully by returning an empty position with `u128::max` health factor when the oracle isn't registered. However, for full functionality, you should register the oracle holder.
