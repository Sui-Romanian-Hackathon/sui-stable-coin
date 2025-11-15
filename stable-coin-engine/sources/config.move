module dsc::dsc_config;

use dsc::utils;
use std::string::String;
use std::type_name::{Self, TypeName};
use sui::coin_registry::{Self, Currency};
use sui::vec_map::{Self, VecMap};

// ==================== Events ====================
/// Emitted when a new collateral coin is added
public struct CoinAdded has copy, drop {
    coin_type: TypeName,
    price_feed_index: u32,
    decimals: u8,
    currency_id: ID,
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
#[error]
const EWrongCurrencyObject: vector<u8> = b"Wrong Currency object provided";

// ==================== Structures ====================

//Admin capability object needed for protocol parameters changes
public struct AdminCap has key { id: UID }

// Stores information about a supported collateral coin
public struct SupportedCoinData has copy, drop, store {
    price_feed_index: u32,
    decimals: u8,
    currency_id: ID,
}

// Frontend-facing struct with complete coin information
// This is returned via DevInspect and not stored on-chain
public struct CoinInfo has copy, drop {
    coin_type: TypeName,
    price: u128,
    icon_url: String,
    name: String,
    symbol: String,
    decimals: u8,
}

// DSC config object
public struct DSCConfig has key, store {
    id: UID,
    owner: address,
    supported_collateral_coins: VecMap<TypeName, SupportedCoinData>, // a map of all the supported collateral coins
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
/// - currency_id: The object ID of the Currency<T> object
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
    currency_id: ID,
) {
    let coin_type = get_type<T>();

    assert!(!config.supported_collateral_coins.contains(&coin_type), ECoinAlreadySupported);

    let coin_data = SupportedCoinData {
        price_feed_index,
        decimals,
        currency_id,
    };

    config.supported_collateral_coins.insert(coin_type, coin_data);

    // Emit event
    sui::event::emit(CoinAdded {
        coin_type,
        price_feed_index,
        decimals,
        currency_id,
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

/// Get the complete SupportedCoinData for a specific collateral coin
///
/// Args:
/// - config: Reference to the DSCConfig
/// - coin_type: The TypeName of the coin
///
/// Returns: The SupportedCoinData struct containing price_feed_index, decimals, and currency_id
///
/// Aborts if the coin type is not supported
public fun get_supported_coin_data(config: &DSCConfig, coin_type: &TypeName): SupportedCoinData {
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

/// Get the Currency object ID for a specific collateral coin
///
/// Args:
/// - config: Reference to the DSCConfig
/// - coin_type: The TypeName of the coin
///
/// Returns: The Currency object ID
///
/// Aborts if the coin type is not supported
public fun get_coin_currency_id(config: &DSCConfig, coin_type: &TypeName): ID {
    config.supported_collateral_coins.get(coin_type).currency_id
}

// ==================== Frontend getter functions ====================

/// Get a vector of all supported coin TypeNames
/// Useful for the frontend to iterate through supported coins
///
/// Args:
/// - config: Reference to the DSCConfig
///
/// Returns: Vector of TypeNames for all supported collateral coins
public fun get_supported_coin_types(config: &DSCConfig): vector<TypeName> {
    let mut types = vector::empty<TypeName>();
    let length = config.supported_collateral_coins.length();
    let mut index = 0;

    while (index < length) {
        let (coin_type, _) = config.supported_collateral_coins.get_entry_by_idx(index);
        types.push_back(*coin_type);
        index = index + 1;
    };

    types
}

/// Get complete coin information for a specific coin type
/// Designed to be called via DevInspect from the frontend
///
/// Args:
/// - config: Reference to DSCConfig
/// - currency_obj: The Currency<T> object for this coin type
/// - price: The current price from oracle (caller must fetch this separately)
///
/// Returns:
/// - CoinInfo struct with price, icon_url, name, symbol, decimals
///
/// Aborts:
/// - If the coin type is not supported
/// - If the wrong Currency object is provided
public fun get_coin_info<T: drop>(
    config: &DSCConfig,
    currency_obj: &Currency<T>,
    price: u128,
): CoinInfo {
    let coin_type = get_type<T>();
    let coin_data = *config.supported_collateral_coins.get(&coin_type);

    // Verify it's the right Currency object
    assert!(object::id(currency_obj) == coin_data.currency_id, EWrongCurrencyObject);

    // Fetch metadata from Currency object
    let icon_url = coin_registry::icon_url(currency_obj);
    let name = coin_registry::name(currency_obj);
    let symbol = coin_registry::symbol(currency_obj);

    CoinInfo {
        coin_type,
        price,
        icon_url,
        name,
        symbol,
        decimals: coin_data.decimals,
    }
}

// ==================== SupportedCoinData accessor functions ====================

/// Extract the price feed index from a SupportedCoinData struct
///
/// Args:
/// - coin_data: Reference to a SupportedCoinData struct
///
/// Returns: The price feed index
public fun supported_coin_data_price_feed_index(coin_data: &SupportedCoinData): u32 {
    coin_data.price_feed_index
}

/// Extract the decimals from a SupportedCoinData struct
///
/// Args:
/// - coin_data: Reference to a SupportedCoinData struct
///
/// Returns: The decimal precision
public fun supported_coin_data_decimals(coin_data: &SupportedCoinData): u8 {
    coin_data.decimals
}

/// Extract the currency_id from a SupportedCoinData struct
///
/// Args:
/// - coin_data: Reference to a SupportedCoinData struct
///
/// Returns: The Currency object ID
public fun supported_coin_data_currency_id(coin_data: &SupportedCoinData): ID {
    coin_data.currency_id
}

// ==================== CoinInfo accessor functions ====================

/// Extract the coin_type from a CoinInfo struct
public fun coin_info_coin_type(coin_info: &CoinInfo): TypeName {
    coin_info.coin_type
}

/// Extract the price from a CoinInfo struct
public fun coin_info_price(coin_info: &CoinInfo): u128 {
    coin_info.price
}

/// Extract the icon_url from a CoinInfo struct
public fun coin_info_icon_url(coin_info: &CoinInfo): String {
    coin_info.icon_url
}

/// Extract the name from a CoinInfo struct
public fun coin_info_name(coin_info: &CoinInfo): String {
    coin_info.name
}

/// Extract the symbol from a CoinInfo struct
public fun coin_info_symbol(coin_info: &CoinInfo): String {
    coin_info.symbol
}

/// Extract the decimals from a CoinInfo struct
public fun coin_info_decimals(coin_info: &CoinInfo): u8 {
    coin_info.decimals
}

public fun get_type<T>(): TypeName {
    type_name::with_defining_ids<T>()
}

// ==================== Test-only functions ====================

#[test_only]
/// Test helper to initialize the module
public fun test_init(ctx: &mut TxContext) {
    init(ctx);
}
