module dsc::dsc_config;

use dsc::utils;
use std::type_name::{Self, TypeName};
use sui::vec_map::{Self, VecMap};

// ==================== Events ====================
/// Emitted when a new collateral coin is added
public struct CoinAdded has copy, drop {
    coin_type: TypeName,
    price_feed_index: u32,
    decimals: u8,
}

/// Emitted when a collateral coin is removed
public struct CoinRemoved has copy, drop {
    coin_type: TypeName,
}

/// Emitted when the oracle holder is changed
public struct OracleHolderChanged has copy, drop {
    old_oracle_holder_id: Option<ID>,
    new_oracle_holder_id: ID,
}

/// Emitted when precision is updated
public struct PrecisionUpdated has copy, drop {
    old_precision: u128,
    new_precision: u128,
}

/// Emitted when liquidation threshold is updated
public struct LiquidationThresholdUpdated has copy, drop {
    old_threshold: u128,
    new_threshold: u128,
}

/// Emitted when minimum health factor is updated
public struct MinHealthFactorUpdated has copy, drop {
    old_min_health_factor: u128,
    new_min_health_factor: u128,
}

/// Emitted when liquidation bonus is updated
public struct LiquidationBonusUpdated has copy, drop {
    old_bonus: u128,
    new_bonus: u128,
}

// ==================== Errors  ====================

#[error]
const ECoinAlreadySupported: vector<u8> = b"Coin already supported";
#[error]
const EOracleAlreadySupported: vector<u8> = b"Oracle holder already supported";

// ==================== Structures ====================

//Admin capability object needed for protocol parameters changes
public struct AdminCap has key { id: UID }

// Stores information about a supported collateral coin
public struct CoinInfo has copy, drop, store {
    price_feed_index: u32, // Oracle price feed index for this coin
    decimals: u8, // Decimal precision of the coin
}

// DSC config object
public struct DSCConfig has key, store {
    id: UID,
    owner: address,
    supported_collateral_coins: VecMap<TypeName, CoinInfo>, // a map of all the supported collateral coins
    precision: u128, // precision for the system
    liquidation_threshold: u128,
    min_health_factor: u128,
    liquidation_bonus: u128,
    supported_oracle_holder_id: Option<ID>,
}

fun init(ctx: &mut TxContext) {
    let config = DSCConfig {
        id: object::new(ctx),
        owner: ctx.sender(),
        supported_collateral_coins: vec_map::empty(),
        precision: utils::pow10(18),
        liquidation_threshold: utils::per_to_precision(50, utils::pow10(18)),
        min_health_factor: utils::pow10(18),
        liquidation_bonus: utils::per_to_precision(10, utils::pow10(18)),
        supported_oracle_holder_id: option::none(),
    };
    transfer::share_object(config); //  make the config public

    transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
}

/// Add a new supported collateral coin type
///
/// Args:
/// - _admin: AdminCap to ensure only admins can add coins
/// - config: Mutable reference to DSCConfig
/// - price_feed_index: The oracle price feed index for this coin
/// - decimals: The decimal precision of the coin
///
/// Generic:
/// - T: The coin type to add (e.g., 0x2::sui::SUI)
///
/// Aborts if the coin is already supported
public fun add_new_supported_coin<T>(
    _admin: &AdminCap,
    config: &mut DSCConfig,
    price_feed_index: u32,
    decimals: u8,
) {
    let coin_type = get_type<T>();

    assert!(!config.supported_collateral_coins.contains(&coin_type), ECoinAlreadySupported);

    let coin_info = CoinInfo {
        price_feed_index,
        decimals,
    };

    config.supported_collateral_coins.insert(coin_type, coin_info);

    // Emit event
    sui::event::emit(CoinAdded {
        coin_type,
        price_feed_index,
        decimals,
    });
}

/// Changes the supported oracle holder ID
///
/// # Arguments
/// - admin_cap - the admin right to change the config object
/// - dsc_config - the dsc config we want to change
/// - new_oracle_holder_id - the updated oracle holder id
public fun change_oracle_holder(
    _admin_cap: &AdminCap,
    dsc_config: &mut DSCConfig,
    new_oracle_holder_id: ID,
) {
    //Checks
    assert!(
        dsc_config.supported_oracle_holder_id.is_none() ||
        dsc_config.supported_oracle_holder_id.borrow() != &new_oracle_holder_id,
        EOracleAlreadySupported,
    );

    // Store old value for event
    let old_oracle_holder_id = dsc_config.supported_oracle_holder_id;

    //Effect
    _ = dsc_config.supported_oracle_holder_id.swap_or_fill(new_oracle_holder_id);

    // Emit event
    sui::event::emit(OracleHolderChanged {
        old_oracle_holder_id,
        new_oracle_holder_id,
    });
}

/// Remove a supported collateral coin type
///
/// Args:
/// - _admin: AdminCap to ensure only admins can remove coins
/// - config: Mutable reference to DSCConfig
///
/// Generic:
/// - T: The coin type to remove
public fun remove_supported_coin<T>(_admin: &AdminCap, config: &mut DSCConfig) {
    let coin_type = get_type<T>();
    config.supported_collateral_coins.remove(&coin_type);

    // Emit event
    sui::event::emit(CoinRemoved {
        coin_type,
    });
}

// ====================Setters======================

/// Set the precision of the system
///
/// Args:
/// - _admin: AdminCap to ensure only admins can change precision
/// - config: Mutable reference to DSCConfig
/// - new_precision: The new precision value (e.g., 1e18)
public fun set_precision(_admin: &AdminCap, config: &mut DSCConfig, new_precision: u128) {
    let old_precision = config.precision;
    config.precision = new_precision;

    // Emit event
    sui::event::emit(PrecisionUpdated {
        old_precision,
        new_precision,
    });
}

/// Set liquidation threshold for the system
///
/// Args:
/// - _admin: AdminCap
/// - config: Mutable reference to DSCConfig
/// - new_threshold: The new liquidation threshold (as a precision value)
public fun set_liquidation_threshold(
    _admin: &AdminCap,
    config: &mut DSCConfig,
    new_threshold: u128,
) {
    let old_threshold = config.liquidation_threshold;
    config.liquidation_threshold = new_threshold;

    // Emit event
    sui::event::emit(LiquidationThresholdUpdated {
        old_threshold,
        new_threshold,
    });
}

/// Set min health factor threshold for the system
///
/// Args:
/// - _admin: AdminCap
/// - config: Mutable reference to DSCConfig
/// - new_min_health_factor: The new minimum health factor
public fun set_min_health_factor(
    _admin: &AdminCap,
    config: &mut DSCConfig,
    new_min_health_factor: u128,
) {
    let old_min_health_factor = config.min_health_factor;
    config.min_health_factor = new_min_health_factor;

    // Emit event
    sui::event::emit(MinHealthFactorUpdated {
        old_min_health_factor,
        new_min_health_factor,
    });
}

/// Set liquidation bonus for the system
///
/// Args:
/// - _admin: AdminCap
/// - config: Mutable reference to DSCConfig
/// - new_liquidation_bonus: The new liquidation bonus (as a precision value)
public fun set_liquidation_bonus(
    _admin: &AdminCap,
    config: &mut DSCConfig,
    new_liquidation_bonus: u128,
) {
    let old_bonus = config.liquidation_bonus;
    config.liquidation_bonus = new_liquidation_bonus;

    // Emit event
    sui::event::emit(LiquidationBonusUpdated {
        old_bonus,
        new_bonus: new_liquidation_bonus,
    });
}

// ==================== GETTERS ====================

/// Get the owner of the config
///
/// Returns: The address of the config owner
public fun get_owner(config: &DSCConfig): address {
    config.owner
}

/// Get the supported oracle holder ID
///
/// Returns: Option containing the oracle holder ID, or none if not set
public fun get_supported_oracle_holder_id(config: &DSCConfig): Option<ID> {
    config.supported_oracle_holder_id
}

/// Get the precision used in the system
///
/// Returns: The precision value (e.g., 1e18 for 18 decimals)
public fun get_precision(config: &DSCConfig): u128 {
    config.precision
}

/// Get the liquidation threshold percentage
///
/// Returns: The liquidation threshold as a precision value
///
/// Example: If returns 5e17, it means 50% (5e17 / 1e18 = 0.5)
public fun get_liquidation_threshold(config: &DSCConfig): u128 {
    config.liquidation_threshold
}

/// Get the minimum health factor required
///
/// Returns: The minimum health factor (typically 1e18 for 100%)
public fun get_min_health_factor(config: &DSCConfig): u128 {
    config.min_health_factor
}

/// Get the liquidation bonus/penalty
///
/// Returns: The bonus as a precision value
///
/// Example: If returns 1e17, it means 10% bonus
public fun get_liquidation_bonus(config: &DSCConfig): u128 {
    config.liquidation_bonus
}

/// Get the number of supported collateral coins
///
/// Returns: The count of supported collateral coins
public fun get_supported_collateral_coins_count(config: &DSCConfig): u64 {
    config.supported_collateral_coins.length()
}

/// Check if a collateral coin type is supported
///
/// Args:
/// - config: Reference to the DSCConfig
/// - coin_type: The TypeName of the coin to check
///
/// Returns: true if the coin type is supported, false otherwise
public fun is_collateral_coin_supported<T: drop>(config: &DSCConfig): bool {
    // consider adding the hole Coin<T> type name
    let coin_type: TypeName = get_type<T>();
    config.supported_collateral_coins.contains(&coin_type)
}

/// Get the price feed index for a specific collateral coin
///
/// Args:
/// - config: Reference to the DSCConfig
/// - coin_type: The TypeName of the coin
///
/// Returns: The price feed index for that coin type
///
/// Aborts if the coin type is not supported
public fun get_collateral_coin_price_feed_index(config: &DSCConfig, coin_type: &TypeName): u32 {
    config.supported_collateral_coins.get(coin_type).price_feed_index
}

/// Check if a collateral coin is supported and get its price feed index
///
/// Args:
/// - config: Reference to the DSCConfig
/// - coin_type: The TypeName of the coin
///
/// Returns: Option containing the price feed index, or none if not supported
public fun get_collateral_coin_price_feed_index_option(
    config: &DSCConfig,
    coin_type: &TypeName,
): std::option::Option<u32> {
    if (config.supported_collateral_coins.contains(coin_type)) {
        std::option::some(config.supported_collateral_coins.get(coin_type).price_feed_index)
    } else {
        std::option::none()
    }
}

/// Get the complete CoinInfo for a specific collateral coin
///
/// Args:
/// - config: Reference to the DSCConfig
/// - coin_type: The TypeName of the coin
///
/// Returns: The CoinInfo struct containing price_feed_index and decimals
///
/// Aborts if the coin type is not supported
public fun get_coin_info(config: &DSCConfig, coin_type: &TypeName): CoinInfo {
    *config.supported_collateral_coins.get(coin_type)
}

/// Get the decimal precision for a specific collateral coin
///
/// Args:
/// - config: Reference to the DSCConfig
/// - coin_type: The TypeName of the coin
///
/// Returns: The decimal precision of that coin type
///
/// Aborts if the coin type is not supported
public fun get_coin_decimals(config: &DSCConfig, coin_type: &TypeName): u8 {
    config.supported_collateral_coins.get(coin_type).decimals
}

// ==================== CoinInfo accessor functions ====================

/// Extract the price feed index from a CoinInfo struct
///
/// Args:
/// - coin_info: Reference to a CoinInfo struct
///
/// Returns: The price feed index
public fun coin_info_price_feed_index(coin_info: &CoinInfo): u32 {
    coin_info.price_feed_index
}

/// Extract the decimals from a CoinInfo struct
///
/// Args:
/// - coin_info: Reference to a CoinInfo struct
///
/// Returns: The decimal precision
public fun coin_info_decimals(coin_info: &CoinInfo): u8 {
    coin_info.decimals
}

// ==================== Private functions ====================

public fun get_type<T>(): TypeName {
    type_name::with_defining_ids<T>()
}

// ==================== Test-only functions ====================

#[test_only]
/// Test helper to initialize the module
public fun test_init(ctx: &mut TxContext) {
    init(ctx);
}
