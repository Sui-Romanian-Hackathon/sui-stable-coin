/// Mock Oracle module for testing
/// This module provides a mock implementation of the SupraOracle interface
/// to enable testing without external dependencies
///
/// WARNING: This is ONLY for testing! In production, use the real SupraOracle package.
#[allow(lint(custom_state_change, share_owned))]
module SupraOracle::SupraSValueFeed;

use sui::table::{Self, Table};

// ==================== Structures ====================

/// Mock OracleHolder that stores price data for testing
public struct OracleHolder has key, store {
    id: UID,
    prices: Table<u32, PriceData>,
}

/// Price data structure matching the real oracle interface
public struct PriceData has copy, drop, store {
    price: u128,
    decimals: u16,
    timestamp: u64,
    round: u64,
}

// ==================== Public Functions ====================

/// Create a new mock oracle holder for testing
public fun create_oracle_holder_for_testing(ctx: &mut TxContext): OracleHolder {
    OracleHolder {
        id: object::new(ctx),
        prices: table::new(ctx),
    }
}

/// Set a price for a specific pair index (for testing)
public fun set_price_for_testing(
    oracle: &mut OracleHolder,
    pair_index: u32,
    price: u128,
    decimals: u16,
    timestamp: u64,
    round: u64,
) {
    let price_data = PriceData {
        price,
        decimals,
        timestamp,
        round,
    };

    if (oracle.prices.contains(pair_index)) {
        oracle.prices.remove(pair_index);
    };
    oracle.prices.add(pair_index, price_data);
}

/// Get price data for a specific pair index
/// This mimics the real oracle's get_price function
/// Returns: (price, decimals, timestamp, round)
public fun get_price(oracle: &OracleHolder, pair_index: u32): (u128, u16, u64, u64) {
    let price_data = oracle.prices.borrow(pair_index);
    (price_data.price, price_data.decimals, price_data.timestamp, price_data.round)
}

/// Share the oracle holder (for testing with shared objects)
public fun share_oracle_holder(oracle: OracleHolder) {
    transfer::share_object(oracle);
}

/// Delete the oracle holder (cleanup for tests)
public fun delete_oracle_holder_for_testing(oracle: OracleHolder) {
    let OracleHolder { id, prices } = oracle;
    prices.destroy_empty();
    id.delete();
}

#[test_only]
/// Get the ID of an oracle holder
public fun get_oracle_id(oracle: &OracleHolder): ID {
    object::id(oracle)
}
