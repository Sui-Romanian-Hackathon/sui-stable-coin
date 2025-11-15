/// Module: dsc
#[allow(lint(self_transfer))]
module dsc::dsc;

use SupraOracle::SupraSValueFeed::OracleHolder;
use dsc::dsc_config::{Self, DSCConfig};
use dsc::oracle;
use std::string;
use std::type_name::TypeName;
use std::u128;
use sui::coin::{Self, TreasuryCap, Coin};
use sui::coin_registry;
use sui::event;
use sui::object_bag::{Self, ObjectBag};
use sui::table::{Self, Table};
use sui::vec_map::{Self, VecMap};

// ==================== Errors ====================
#[error]
const EAmountIsZero: vector<u8> = b"Amount is zero";
#[error]
const ECoinNotSupported: vector<u8> = b"Coin not supported by protocol";
#[error]
const EUserNotAuthorizedToChangePosition: vector<u8> = b"User not authorized to change position";
#[error]
const EPositionStillHasCollateral: vector<u8> = b"Position still has collateral, can't delete it";
#[error]
const EPositionStillHasDebt: vector<u8> = b"Position still has debt, can't delete it";
#[error]
const ENoOracleSupportedYet: vector<u8> =
    b"No oracle price feed supported yet. Contact the protocol admin!";
#[error]
const EOracleNotSupported: vector<u8> = b"Price feed oracle holder not supported by the protocol";
#[error]
const EHealthFactorToLow: vector<u8> = b"Operation puts you you position in liquidation risk";
#[error]
const EInsufficientCollateral: vector<u8> =
    b"Insufficient collateral to redeem the requested amount";
#[error]
const ECoinTypeNotDeposited: vector<u8> = b"User has not deposited this type of coin";
#[error]
const EInsufficientDscToBurn: vector<u8> = b"Insufficient DSC to burn";
#[error]
const EPositionHOk: vector<u8> = b"The position health factor ok, can't liquidate position";
#[error]
const EInvalidOraclePrice: vector<u8> = b"Oracle price is invalid or zero";

// ==================== Events ====================
public struct NewPositionCreated has copy, drop {
    new_position_id: ID,
}

public struct NewDepositMade has copy, drop {
    coin_type: TypeName,
    amount: u128,
}

public struct CollateralRedeemed has copy, drop {
    coin_type: TypeName,
    amount: u128,
}
public struct DSCBurned has copy, drop {
    user: address,
    amount: u128,
    position_id: ID,
}

public struct PositionLiquidated has copy, drop {
    liquidated_user: address,
    liquidator: address,
    debt_covered: u128,
    collateral_type: TypeName,
    collateral_amount: u128,
}

// ==================== Structures====================

// One time witness used for DSC coin init
public struct DSC has drop {}

//Object that stores the treasury capabilities
public struct DSCLedger has key {
    id: UID,
    treasury_cap: TreasuryCap<DSC>,
    users_positions_index: Table<address, ID>,
}

// Object that stores the position of a user
public struct UserPosition has key {
    id: UID,
    owner: address,
    vault: ObjectBag,
    vault_ledger: VecMap<TypeName, u128>,
    debt: u128,
    last_HF: u128,
}

// Struct to hold coin amount and price data
public struct CoinData has copy, drop, store {
    amount: u128,
    price: u128,
}

// Struct returned by get_position_info for UI consumption
public struct PositionInfo has copy, drop {
    coins_cache: VecMap<TypeName, CoinData>,
    health_factor: u128,
    debt: u128,
    collateral_value: u128,
    position_id: option::Option<ID>,
}

// ==================== Init function ====================
fun init(otw: DSC, ctx: &mut TxContext) {
    let (builder, treasury_cap) = coin_registry::new_currency_with_otw<DSC>(
        otw,
        18, // decimals
        string::utf8(b"DSC"), // symbol
        string::utf8(b"Decentralized Stablecoin"),
        string::utf8(b"Protocol-native pagged to USD"),
        string::utf8(b""), // icon URL
        ctx,
    );

    let metadata_cap = coin_registry::finalize(builder, ctx);

    // 3) Transfer the MetadataCap<DSC> to the sender (for metadata management)
    transfer::public_transfer(metadata_cap, tx_context::sender(ctx));

    // 4) Create and store your DSCLedger with the TreasuryCap
    let dsc_ledger = DSCLedger {
        id: object::new(ctx),
        treasury_cap,
        users_positions_index: table::new(ctx),
    };

    // 5) Share your DSCLedger globally as your protocol engine
    transfer::share_object(dsc_ledger);
}

// ==================== Public functions ====================

/// Create a new user position object, register in in the index and create a User capability object
///
/// # Arguments
/// - dsc_ledger - the ledger of the protocol
/// - ctx: transaction context
///
/// # Returns
/// - Returns the IDs of the usr capability and the id of the new user position
public fun new_position(dsc_ledger: &mut DSCLedger, ctx: &mut TxContext): (ID) {
    let owner = ctx.sender();
    // Create new position object
    let new_position_obj = UserPosition {
        id: object::new(ctx),
        owner,
        vault: object_bag::new(ctx),
        vault_ledger: vec_map::empty(),
        debt: 0,
        last_HF: u128::max_value!(),
    };
    let new_position_id = object::id(&new_position_obj);
    // Update the dsc ledger to include this new object
    dsc_ledger.users_positions_index.add(owner, new_position_id);
    // make the user position shared
    transfer::share_object(new_position_obj);
    // send the user capability to the

    event::emit(NewPositionCreated {
        new_position_id: new_position_id,
    });

    (new_position_id)
}

/// Close the position if it empty
///
/// # Arguments
/// - user_capability - the capability object needed to close the position
/// - user_position - the user position to close
///
/// # Aborts
/// - if hte position has any dept of collateral left
public fun close_position(user_position: UserPosition, ctx: &TxContext) {
    //Checks
    assert!(user_position.owner == ctx.sender(), EUserNotAuthorizedToChangePosition);
    assert!(user_position.debt == 0, EPositionStillHasDebt);

    // Unpack the UserPosition
    let UserPosition {
        id: position_id,
        owner: _,
        vault,
        vault_ledger,
        debt: _,
        last_HF: _,
    } = user_position;
    let vault_ledger_length = vault_ledger.length();
    let mut index = 0;
    while (index < vault_ledger_length) {
        let (_coin_type, coin_amount) = vault_ledger.get_entry_by_idx(index);
        assert!(*coin_amount == 0, EPositionStillHasCollateral);
        index = index + 1;
    };

    vault_ledger.destroy_empty();
    vault.destroy_empty();
    position_id.delete();
}

/// Deposits collateral coin in the user position object
///
/// # Arguments
/// - user_capability: the capability object needed to deposit in one position
/// - coin: The coin object we want to deposit
/// - user: The user position object we are going to deposit int
/// - config: The current config of the DSC system
///
/// # Aborts:
/// - If the user doesn't have the autoright to change the given position
/// - If the deposited value is 0
/// - If teh collateral we try to deposit is not supported by the protocol.
/// - return_description
public fun deposit_collateral<T: drop>(
    user_position: &mut UserPosition,
    coin: Coin<T>,
    config: &DSCConfig,
    ctx: &TxContext,
) {
    //Checks
    assert!(user_position.owner == ctx.sender(), EUserNotAuthorizedToChangePosition);
    assertValueIsGreaterThenZero(coin.value() as u128);
    assertCoinIsSupported<T>(config);

    //Interact
    let key_type_name = dsc_config::get_type<T>();
    let coin_value = coin.value();
    if (user_position.vault.contains(key_type_name)) {
        let mut deposited_coin: Coin<T> = user_position.vault.remove(key_type_name);
        let (_coin, mut coin_amount) = user_position.vault_ledger.remove(&key_type_name);

        coin_amount = coin_amount + (coin_value as u128);
        coin::join(&mut deposited_coin, coin);

        user_position.vault.add(key_type_name, deposited_coin);
        user_position.vault_ledger.insert(key_type_name, coin_amount);
    } else {
        user_position.vault_ledger.insert(key_type_name, coin_value as u128);
        user_position.vault.add(key_type_name, coin);
    };
    event::emit(NewDepositMade { coin_type: key_type_name, amount: coin_value as u128 })
}

/// Redeems collateral if the resulting health factor of the position allows it
///
/// # Arguments
/// - T - generic type of the coin we want to redeem
/// - user_position: -the user position that the user will redeem from
/// - amount_2_redeem - the amount we want to redeem
/// - dsc_config: &DSCConfig,
/// - oracle_holder: &OracleHolder,
///
/// #Aborts
/// - If the sender doesn't have the right to redeem
/// - If the user doesn't store this type of coin
/// - The amount to redeem is 0 or if the amount 2 redeem is larger then the amount stored in the position
/// - By redeeming this amount the position will become eligible for liquidation
public fun redeem_collateral<T: drop>(
    user_position: &mut UserPosition,
    amount_2_redeem: u128,
    dsc_config: &DSCConfig,
    oracle_holder: &OracleHolder,
    ctx: &mut TxContext,
) {
    // Checks
    assert!(user_position.owner == ctx.sender(), EUserNotAuthorizedToChangePosition);
    assertValueIsGreaterThenZero(amount_2_redeem);
    assertCoinIsSupported<T>(dsc_config);

    let key_type_name = dsc_config::get_type<T>();

    assert!(user_position.vault.contains(key_type_name), ECoinTypeNotDeposited);
    assert!(user_position.vault_ledger.contains(&key_type_name), ECoinTypeNotDeposited);

    let (_coin, current_amount) = user_position.vault_ledger.remove(&key_type_name);

    assert!(amount_2_redeem <= current_amount, EInsufficientCollateral);

    let new_amount = current_amount - amount_2_redeem;

    let mut deposited_coin: Coin<T> = user_position.vault.remove(key_type_name);

    let coin_to_redeem = coin::split(&mut deposited_coin, amount_2_redeem as u64, ctx);

    if (new_amount > 0) {
        user_position.vault.add(key_type_name, deposited_coin);
        user_position.vault_ledger.insert(key_type_name, new_amount);
    } else {
        coin::destroy_zero(deposited_coin);
    };

    // Check health factor after redemption
    let updated_HF = get_position_HF(user_position, dsc_config, oracle_holder);
    let min_HF = dsc_config.get_min_health_factor();
    assert!(updated_HF >= min_HF, EHealthFactorToLow);

    // Transfer the redeemed coin to the user
    transfer::public_transfer(coin_to_redeem, ctx.sender());
    event::emit(CollateralRedeemed {
        coin_type: key_type_name,
        amount: amount_2_redeem,
    });
}

/// Redeem deposited collateral for some DSC paid back
///
/// # Arguments
/// - T - generic type of the coin we want to redeem
/// - user_position: the user position that the user will redeem from
/// - dsc_to_burn - the DSC coin to burn
/// - dsc_ledger - the ledger holding the treasury cap
/// - dsc_config: the DSC protocol configuration
/// - oracle_holder: the oracle for price feeds
///
/// # Aborts
/// - If the caller is not authorized to update this position
/// - If the user want to burn more DSC then they owe
/// - If the type of collateral the user wants to redeem is not deposited in the position
/// - If the amount of DSC to burn is 0
/// - If there's insufficient collateral of type T to cover the DSC value being burned
public fun redeem_collateral_for_dsc<T: drop>(
    user_position: &mut UserPosition,
    dsc_to_burn: Coin<DSC>,
    dsc_ledger: &mut DSCLedger,
    dsc_config: &DSCConfig,
    oracle_holder: &OracleHolder,
    ctx: &mut TxContext,
) {
    // Checks
    assert!(user_position.owner == ctx.sender(), EUserNotAuthorizedToChangePosition);
    assertCoinIsSupported<T>(dsc_config);

    let dsc_amount_to_burn = dsc_to_burn.value() as u128;
    assertValueIsGreaterThenZero(dsc_amount_to_burn);

    let current_debt = user_position.debt;
    assert!(dsc_amount_to_burn <= current_debt, EInsufficientDscToBurn);

    let key_type_name = dsc_config::get_type<T>();

    assert!(user_position.vault.contains(key_type_name), ECoinTypeNotDeposited);
    assert!(user_position.vault_ledger.contains(&key_type_name), ECoinTypeNotDeposited);

    // Calculate collateral amount using helper function
    let collateral_amount_to_redeem = get_token_amount_from_usd<T>(
        dsc_amount_to_burn,
        oracle_holder,
        dsc_config,
    );

    let (_coin, current_amount) = user_position.vault_ledger.remove(&key_type_name);
    assert!(collateral_amount_to_redeem <= current_amount, EInsufficientCollateral);

    user_position.debt = current_debt - dsc_amount_to_burn;

    let new_amount = current_amount - collateral_amount_to_redeem;

    let mut deposited_coin: Coin<T> = user_position.vault.remove(key_type_name);
    let coin_to_redeem = coin::split(&mut deposited_coin, collateral_amount_to_redeem as u64, ctx);

    if (new_amount > 0) {
        user_position.vault.add(key_type_name, deposited_coin);
        user_position.vault_ledger.insert(key_type_name, new_amount);
    } else {
        coin::destroy_zero(deposited_coin);
    };

    coin::burn(&mut dsc_ledger.treasury_cap, dsc_to_burn);

    transfer::public_transfer(coin_to_redeem, ctx.sender());

    event::emit(CollateralRedeemed {
        coin_type: key_type_name,
        amount: collateral_amount_to_redeem,
    });
    event::emit(DSCBurned {
        user: ctx.sender(),
        amount: dsc_amount_to_burn,
        position_id: object::id(user_position),
    });
}

/// Get the total value of position collateral
///
/// # Arguments
/// - user_position: the position we want to get the collateral value of
/// - oracle_holder: the oracle object that receives the price updates from the oracle network
/// - dsc_config: The objet that holds the DSC protocol configuration, needed to fetch the prices
///
/// # Returns
/// - Total price of the given position collateral
///
/// # Aborts
/// - If any of the coins from the position is not supported by the DSC protocol
/// - If no oracle is supported yet or the provided oracle is not supported
public fun get_position_collateral_value(
    user_position: &UserPosition,
    oracle_holder: &OracleHolder,
    dsc_config: &DSCConfig,
): u128 {
    //Checks
    let supported_oracle_holder = dsc_config.get_supported_oracle_holder_id();
    assert!(supported_oracle_holder.is_some(), ENoOracleSupportedYet);
    assert!(object::id(oracle_holder) == supported_oracle_holder.borrow(), EOracleNotSupported);

    let coins_ledger = user_position.vault_ledger;
    let coins_ledger_length = coins_ledger.length();
    let mut total_value = 0u128;
    let mut index = 0;
    let precision = dsc_config::get_precision(dsc_config);

    while (index < coins_ledger_length) {
        let (coin_type, amount) = coins_ledger.get_entry_by_idx(index);

        // Get the price for this coin type
        let price = oracle::get_price_by_typename(coin_type, oracle_holder, dsc_config);

        let coin_value = (*amount * price) / precision;
        total_value = total_value + coin_value;

        index = index + 1;
    };

    total_value
}

/// Get the current health factor of a position with live oracle prices
///
/// This function always calculates the latest HF based on current oracle prices
/// and updates the stored last_HF in the position object for monitoring purposes.
/// This ensures arbitrageurs and liquidators always see the most current health factor.
///
/// # Arguments
/// - user_position - the position we want to evaluate the HF of
/// - dsc_config - the configuration object of the DSC system
/// - oracle_holder - the object that holds the update prices from the oracle network
///
/// # Returns
/// - The current HF of the given position based on latest oracle prices
///
/// # Aborts
/// - If no oracle is supported yet or the provided oracle is not supported
public fun get_position_HF(
    user_position: &mut UserPosition,
    dsc_config: &DSCConfig,
    oracle_holder: &OracleHolder,
): u128 {
    //Checks
    let supported_oracle_holder = dsc_config.get_supported_oracle_holder_id();
    assert!(supported_oracle_holder.is_some(), ENoOracleSupportedYet);
    assert!(object::id(oracle_holder) == supported_oracle_holder.borrow(), EOracleNotSupported);

    //Effect - Calculate current HF with live oracle prices
    let user_position_collateral_value_usd = get_position_collateral_value(
        user_position,
        oracle_holder,
        dsc_config,
    );
    let user_debt = user_position.debt;
    let liquidation_threshold = dsc_config.get_liquidation_threshold();

    let position_HF = if (user_debt == 0) {
        u128::max_value!()
    } else {
        // Optimized calculation: (collateral_value * liquidation_threshold) / debt
        (user_position_collateral_value_usd * liquidation_threshold) / user_debt
    };

    // Update the stored HF for monitoring/tracking
    user_position.last_HF = position_HF;

    position_HF
}

/// Mint DSC to a position if the HF allows it
///
/// # Arguments
/// -user_position: - the position we want to mint DSC to
/// - amount_2_mint - the amount of DSC to mint
/// -dsc_ledger: - the ledger of the protocol that has the treasury cap of the DSC coin
/// -oracle_holder - the oracle object needed for HF calculation
/// - dsc_config: - the config of the DSC protocol
///
/// # Aborts
/// - If the HF of the position goes below the threshold
/// # Returns
public fun mint_DSC(
    user_position: &mut UserPosition,
    amount_2_mint: u128,
    dsc_ledger: &mut DSCLedger,
    oracle_holder: &OracleHolder,
    dsc_config: &DSCConfig,
    ctx: &mut TxContext,
) {
    //Checks
    assert!(user_position.owner == ctx.sender(), EUserNotAuthorizedToChangePosition);
    assertValueIsGreaterThenZero(amount_2_mint);

    let current_user_debt = user_position.debt;
    user_position.debt = current_user_debt + amount_2_mint;
    let updated_HF = get_position_HF(user_position, dsc_config, oracle_holder);
    let min_HF = dsc_config.get_min_health_factor();
    assert!(updated_HF >= min_HF, EHealthFactorToLow);

    //Mint DSC
    let minted_coin = coin::mint(&mut dsc_ledger.treasury_cap, amount_2_mint as u64, ctx);
    transfer::public_transfer(minted_coin, ctx.sender());
}

/// Allow an arbitrageur to liquidate a position if its health factor drops bellow the threshold.
/// The arbitrageur will cover some or all the position debt and will receive collaterals and some bonus, in order to improve the health factor of the position
/// Note: The arbitrageur doesn't have to be the owner of the position
///
/// # Arguments
/// - T: generic type of the coin that the arbitrageur will buy at discount
/// - user_position: the position that will be liquidated
/// - dsc_debt_to_cover: the DSC coin to cover the debt
/// - dsc_ledger - the ledger holding the treasury cap
/// - dsc_config: the DSC protocol configuration
/// - oracle_holder: the oracle for price feeds
/// - ctx - transaction context
///
/// # Aborts
/// - If the dsc amount to cover is 0
/// - If the collateral that the arbitrageur will buy is not part of the position
/// - If the HF of the position is not below the min threshold
/// - If the HF did not improve after the liquidation
public fun liquidate<T: drop>(
    user_position: &mut UserPosition,
    dsc_debt_to_cover: Coin<DSC>,
    dsc_ledger: &mut DSCLedger,
    dsc_config: &DSCConfig,
    oracle_holder: &OracleHolder,
    ctx: &mut TxContext,
) {
    let debt_to_cover = dsc_debt_to_cover.value() as u128;
    assertValueIsGreaterThenZero(debt_to_cover);

    // Check if the position can be liquidated (HF below minimum)
    let starting_health_factor = get_position_HF(user_position, dsc_config, oracle_holder);
    let min_HF = dsc_config.get_min_health_factor();
    assert!(starting_health_factor < min_HF, EPositionHOk);

    let key_type_name = dsc_config::get_type<T>();

    // Calculate collateral amount from USD debt covered
    let token_amount_from_debt_covered = get_token_amount_from_usd<T>(
        debt_to_cover,
        oracle_holder,
        dsc_config,
    );

    // Calculate liquidation bonus
    let liquidation_bonus = dsc_config.get_liquidation_bonus();
    let precision = dsc_config.get_precision();
    let bonus_amount = (token_amount_from_debt_covered * liquidation_bonus) / precision;
    let total_collateral_to_redeem = token_amount_from_debt_covered + bonus_amount;

    // Redeem collateral without owner check
    redeem_collateral_internal<T>(
        user_position,
        total_collateral_to_redeem,
        ctx.sender(), // Send to liquidator
        &key_type_name,
        ctx,
    );

    // Burn DSC on behalf of the position owner
    let position_id = object::id(user_position);
    let owner = user_position.owner;
    let current_debt = user_position.debt;
    assert!(debt_to_cover <= current_debt, EInsufficientDscToBurn);
    user_position.debt = current_debt - debt_to_cover;

    coin::burn(&mut dsc_ledger.treasury_cap, dsc_debt_to_cover);

    // Emit event for DSC burn
    event::emit(DSCBurned {
        user: owner,
        amount: debt_to_cover,
        position_id,
    });

    // Check that health factor improved
    let ending_health_factor = get_position_HF(user_position, dsc_config, oracle_holder);
    assert!(ending_health_factor > starting_health_factor, EHealthFactorToLow);

    event::emit(PositionLiquidated {
        liquidated_user: owner,
        liquidator: ctx.sender(),
        debt_covered: debt_to_cover,
        collateral_type: key_type_name,
        collateral_amount: total_collateral_to_redeem,
    });
}

/// Get complete position information for UI display
///
/// This is a read-only function designed to be called via DevInspect from the frontend.
/// It returns all relevant position data including current prices, health factor, and collateral value.
///
/// # Arguments
/// - user_position: the position to get information for
/// - oracle_holder: the oracle for fetching latest prices
/// - dsc_config: the DSC protocol configuration
///
/// # Returns
/// - PositionInfo struct containing:
///   - coins_cache: Map of coin types to their amounts and current prices
///   - health_factor: Current health factor based on live oracle prices
///   - debt: Total DSC debt
///   - collateral_value: Total USD value of all collateral
///   - position_id: The ID of the position
///
/// # Aborts
/// - If no oracle is supported yet or the provided oracle is not supported
public fun get_user_position_info(
    user_position: &mut UserPosition,
    oracle_holder: &OracleHolder,
    dsc_config: &DSCConfig,
): PositionInfo {
    let mut coins_cache = vec_map::empty<TypeName, CoinData>();
    let position_id = object::id(user_position);

    let coins_ledger = &user_position.vault_ledger;
    let coins_ledger_length = coins_ledger.length();
    let mut index = 0;

    while (index < coins_ledger_length) {
        let (coin_type, amount) = coins_ledger.get_entry_by_idx(index);

        let price = oracle::get_price_by_typename(coin_type, oracle_holder, dsc_config);

        let coin_data = CoinData {
            amount: *amount,
            price,
        };
        coins_cache.insert(*coin_type, coin_data);

        index = index + 1;
    };

    let health_factor = get_position_HF(user_position, dsc_config, oracle_holder);

    let collateral_value = get_position_collateral_value(
        user_position,
        oracle_holder,
        dsc_config,
    );

    PositionInfo {
        coins_cache,
        health_factor,
        debt: user_position.debt,
        collateral_value,
        position_id: option::some(position_id),
    }
}

/// Check if a user has a position in the DSC ledger and return its ID
///
/// # Arguments
/// - dsc_ledger: the ledger to check for user positions
/// - user: the address of the user to check
///
/// # Returns
/// - Option<ID>: Some(position_id) if the user has a position, None otherwise
public fun get_user_position_id(dsc_ledger: &DSCLedger, ctx: &mut TxContext): Option<ID> {
    let user = ctx.sender();
    if (dsc_ledger.users_positions_index.contains(user)) {
        option::some(*dsc_ledger.users_positions_index.borrow(user))
    } else {
        option::none()
    }
}

/// CHEAT CODE: Mint DSC without health factor checks (UNSAFE - for demonstration only)
///
/// This function bypasses all health factor and ownership checks, allowing the admin
/// to mint DSC to any position. It requires the AdminCap to ensure only authorized users can call it.
/// USE WITH CAUTION - This can break the protocol's collateralization guarantees.
///
/// # Arguments
/// - _admin: AdminCap from the config module to authorize this operation
/// - user_position: the position to mint DSC to (can be any position, not just caller's)
/// - amount_2_mint: the amount of DSC to mint
/// - dsc_ledger: the ledger of the protocol that has the treasury cap of the DSC coin
/// - ctx: transaction context
///
/// # Aborts
/// - If the amount to mint is zero
public fun mint_dsc_cheat(
    _admin: &dsc_config::AdminCap,
    user_position: &mut UserPosition,
    amount_2_mint: u128,
    dsc_ledger: &mut DSCLedger,
    ctx: &mut TxContext,
) {
    //Checks
    assertValueIsGreaterThenZero(amount_2_mint);

    let current_user_debt = user_position.debt;
    user_position.debt = current_user_debt + amount_2_mint;

    let minted_coin = coin::mint(&mut dsc_ledger.treasury_cap, amount_2_mint as u64, ctx);
    transfer::public_transfer(minted_coin, user_position.owner);
}

// ==================== Private functions ====================

/// Get token amount equivalent from USD value
///
/// # Arguments
/// - T: The coin type
/// - usd_amount: The USD amount (in system precision)
/// - oracle_holder: The oracle for price feeds
/// - dsc_config: The DSC protocol configuration
///
/// # Returns
/// - The token amount equivalent to the USD value
///
/// # Aborts
/// - If the oracle price is zero or invalid
fun get_token_amount_from_usd<T: drop>(
    usd_amount: u128,
    oracle_holder: &OracleHolder,
    dsc_config: &DSCConfig,
): u128 {
    let key_type_name = dsc_config::get_type<T>();
    let collateral_price = oracle::get_price_by_typename(&key_type_name, oracle_holder, dsc_config);

    // Check for zero price to prevent division by zero
    assert!(collateral_price > 0, EInvalidOraclePrice);

    let precision = dsc_config.get_precision();

    // token_amount = (usd_amount * precision) / collateral_price
    (usd_amount * precision) / collateral_price
}

/// Internal function to redeem collateral without position owner authorization
/// Low-level function - caller must ensure proper checks
///
/// # Arguments
/// - T: The coin type to redeem
/// - user_position: The position to redeem from
/// - amount_to_redeem: Amount of collateral to redeem
/// - recipient: Address to send the collateral to
/// - key_type_name: TypeName of the coin
/// - ctx: Transaction context
fun redeem_collateral_internal<T: drop>(
    user_position: &mut UserPosition,
    amount_to_redeem: u128,
    recipient: address,
    key_type_name: &TypeName,
    ctx: &mut TxContext,
) {
    let (_coin, current_amount) = user_position.vault_ledger.remove(key_type_name);
    assert!(amount_to_redeem <= current_amount, EInsufficientCollateral);

    let new_amount = current_amount - amount_to_redeem;

    let mut deposited_coin: Coin<T> = user_position.vault.remove(*key_type_name);
    let coin_to_redeem = coin::split(&mut deposited_coin, amount_to_redeem as u64, ctx);

    if (new_amount > 0) {
        user_position.vault.add(*key_type_name, deposited_coin);
        user_position.vault_ledger.insert(*key_type_name, new_amount);
    } else {
        coin::destroy_zero(deposited_coin);
    };

    transfer::public_transfer(coin_to_redeem, recipient);

    // Emit event
    event::emit(CollateralRedeemed {
        coin_type: *key_type_name,
        amount: amount_to_redeem,
    });
}

/// Aborts if the value is zero
///
/// # Arguments
/// - value: The value we want to check if zero
///
/// # Aborts
/// - if value is 0
fun assertValueIsGreaterThenZero(value: u128) { assert!(value > 0, EAmountIsZero); }

/// Aborts if the given coin is not supported by the protocol
///
/// # Arguments
/// - T: type of coin to check
/// - config: the config option that contains the allowed Coins
///
/// Aborts:
/// - If the type of coin is not supported by the protocol config
fun assertCoinIsSupported<T: drop>(config: &DSCConfig) {
    assert!(dsc_config::is_collateral_coin_supported<T>(config), ECoinNotSupported);
}

// ==================== Test-only functions ====================

#[test_only]
/// Test helper to initialize the module
public fun test_init(ctx: &mut TxContext) {
    init(DSC {}, ctx);
}

#[test_only]
/// Get the owner of a UserPosition
public fun user_position_owner(position: &UserPosition): address {
    position.owner
}

#[test_only]
/// Get the debt of a UserPosition
public fun user_position_debt(position: &UserPosition): u128 {
    position.debt
}

#[test_only]
/// Get the last health factor of a UserPosition
public fun user_position_last_hf(position: &UserPosition): u128 {
    position.last_HF
}

#[test_only]
/// Get the vault size (number of different coin types) in a UserPosition
public fun user_position_vault_size(position: &UserPosition): u64 {
    position.vault_ledger.length()
}

#[test_only]
/// Check if a user has a position in the ledger
public fun ledger_has_user_position(ledger: &DSCLedger, user: address): bool {
    ledger.users_positions_index.contains(user)
}

#[test_only]
/// Get the position ID for a user from the ledger
public fun ledger_get_user_position_id(ledger: &DSCLedger, user: address): ID {
    *ledger.users_positions_index.borrow(user)
}
