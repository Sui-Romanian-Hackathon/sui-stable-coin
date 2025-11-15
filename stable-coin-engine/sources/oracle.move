module dsc::oracle;

use SupraOracle::SupraSValueFeed::{Self, OracleHolder};
use dsc::dsc_config::{Self, DSCConfig};
use dsc::utils;
use std::type_name::TypeName;
use sui::event;

// ==================== Errors ====================
#[error]
const ECoinNotSupported: vector<u8> = b"Coin type not supported";

// ==================== Events ====================

public struct PriceFetched has copy, drop {
    coin_type: TypeName,
    price: u128,
    decimal: u16,
    round: u64,
}

// ==================== Public functions ====================
// public fun get_sui_price(oracle_holder: &OracleHolder) {
//     let (price, decimal, timestamp, round) = SupraSValueFeed::get_price(oracle_holder, 90);

//     event::emit(PriceFetched {
//         coin
//         price,
//         decimal,
//         timestamp,
//         round,
//     });
// }

/// Gets the price in USD of a supported coin
///
/// # Arguments
/// - T - coin type
/// - coin_type - the TypeName of the coin
/// - oracle_holder: - the oracle object that holds the prices from the oracle network
/// - dsc_config: - the config file of the DSC protocol, contains all the supported collateral coins
///
/// # Returns
/// - price: the price of the given coin type in USD (decimal precision)
/// - decimal: the decimal precision of the price
///
/// # Aborts:
/// - If the provided type coin T is not supported by the DSC protocol
public fun get_coin_price<T: drop>(
    coin_type: TypeName,
    oracle_holder: &OracleHolder,
    dsc_config: &DSCConfig,
): (u128, u16) {
    //Checks
    assert!(dsc_config::is_collateral_coin_supported<T>(dsc_config), ECoinNotSupported);

    // Get coin data (price feed index and decimals)
    let coin_data = dsc_config::get_supported_coin_data(dsc_config, &coin_type);
    let price_lane_index = dsc_config::supported_coin_data_price_feed_index(&coin_data);
    let coin_decimals = dsc_config::supported_coin_data_decimals(&coin_data);

    // Get the price from the oracle
    let (mut price, decimal, _timestamp, round) = SupraSValueFeed::get_price(
        oracle_holder,
        price_lane_index,
    );

    // Adjust price for coin decimal precision
    if (coin_decimals > decimal as u8) {
        let adjustment = coin_decimals - (decimal as u8);
        price = price * utils::pow10(adjustment);
    } else {
        let adjustment = (decimal as u8) - coin_decimals;
        price = price / utils::pow10(adjustment);
    };

    event::emit(PriceFetched {
        coin_type,
        price,
        decimal,
        round,
    });

    (price * 1_000_000, decimal)
}

/// Gets the price in USD of a supported coin using only TypeName
/// This allows getting prices without needing the generic type parameter
///
/// # Arguments
/// - coin_type: The TypeName of the coin to get price for
/// - oracle_holder: The oracle object that holds the prices from the oracle network
/// - dsc_config: The config file of the DSC protocol, contains all the supported collateral coins
///
/// # Returns
/// - price: The price of the given coin type in USD (with precision adjustments)
///
/// # Aborts:
/// - If the provided coin type is not supported by the DSC protocol
public fun get_price_by_typename(
    coin_type: &TypeName,
    oracle_holder: &OracleHolder,
    dsc_config: &DSCConfig,
): u128 {
    // Get coin data (price feed index and decimals)
    let coin_data = dsc_config::get_supported_coin_data(dsc_config, coin_type);
    let price_lane_index = dsc_config::supported_coin_data_price_feed_index(&coin_data);
    let coin_decimals = dsc_config::supported_coin_data_decimals(&coin_data);

    // Get the price from the oracle
    let (mut price, decimal, _timestamp, round) = SupraSValueFeed::get_price(
        oracle_holder,
        price_lane_index,
    );

    // Adjust price for coin decimal precision
    if (coin_decimals > decimal as u8) {
        let adjustment = coin_decimals - (decimal as u8);
        price = price * utils::pow10(adjustment);
    } else {
        let adjustment = (decimal as u8) - coin_decimals;
        price = price / utils::pow10(adjustment);
    };

    event::emit(PriceFetched {
        coin_type: *coin_type,
        price,
        decimal,
        round,
    });

    price * 1_000_000
}
