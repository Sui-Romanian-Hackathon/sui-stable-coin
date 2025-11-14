#[test_only]
module dsc::collateral_tests;

use dsc::dsc::{Self, DSCLedger, UserPosition};
use dsc::dsc_config::{Self, DSCConfig, AdminCap};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::test_scenario::{Self as ts, Scenario};

// ==================== Constants ====================
const ADMIN: address = @0xAD;
const USER1: address = @0x1;
const USER2: address = @0x2;

// Test amounts
const DEPOSIT_AMOUNT: u64 = 1_000_000_000; // 1 SUI (with 9 decimals)
const SUI_DECIMALS: u8 = 9;
const SUI_PRICE_FEED_INDEX: u32 = 90; // SUI price feed index in Supra oracle

// ==================== Helper Functions ====================

/// Initialize the complete DSC system for testing (DSC and Config)
fun setup_dsc_system(): Scenario {
    let mut scenario = ts::begin(ADMIN);

    // Initialize DSC module
    {
        dsc::test_init(ts::ctx(&mut scenario));
    };

    // Initialize DSC Config module
    ts::next_tx(&mut scenario, ADMIN);
    {
        dsc_config::test_init(ts::ctx(&mut scenario));
    };

    // Configure the DSC system with SUI as collateral
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        let mut config = ts::take_shared<DSCConfig>(&scenario);

        // Add SUI as supported collateral
        dsc_config::add_new_supported_coin<SUI>(
            &admin_cap,
            &mut config,
            SUI_PRICE_FEED_INDEX,
            SUI_DECIMALS,
        );

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin_cap);
    };

    scenario
}

/// Create a position for a user
fun create_user_position(scenario: &mut Scenario, user: address): ID {
    ts::next_tx(scenario, user);
    let mut dsc_ledger = ts::take_shared<DSCLedger>(scenario);
    let position_id = dsc::new_position(&mut dsc_ledger, ts::ctx(scenario));
    ts::return_shared(dsc_ledger);
    position_id
}

/// Mint test SUI coins for a user
fun mint_sui_for_testing(scenario: &mut Scenario, user: address, amount: u64) {
    ts::next_tx(scenario, user);
    let coin = coin::mint_for_testing<SUI>(amount, ts::ctx(scenario));
    transfer::public_transfer(coin, user);
}

// ==================== Deposit Collateral Tests ====================

#[test]
/// Test basic deposit of collateral - happy path
fun test_deposit_collateral_basic() {
    let mut scenario = setup_dsc_system();
    let position_id = create_user_position(&mut scenario, USER1);
    mint_sui_for_testing(&mut scenario, USER1, DEPOSIT_AMOUNT);

    // Deposit collateral
    ts::next_tx(&mut scenario, USER1);
    {
        let mut user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id);
        let config = ts::take_shared<DSCConfig>(&scenario);
        let coin = ts::take_from_sender<Coin<SUI>>(&scenario);

        dsc::deposit_collateral<SUI>(
            coin,
            &mut user_position,
            &config,
            ts::ctx(&mut scenario),
        );

        // Verify vault size increased
        assert!(dsc::user_position_vault_size(&user_position) == 1, 0);

        ts::return_shared(user_position);
        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
/// Test multiple deposits of the same collateral type
fun test_deposit_collateral_multiple_same_type() {
    let mut scenario = setup_dsc_system();
    let position_id = create_user_position(&mut scenario, USER1);

    // First deposit
    mint_sui_for_testing(&mut scenario, USER1, DEPOSIT_AMOUNT);
    ts::next_tx(&mut scenario, USER1);
    {
        let mut user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id);
        let config = ts::take_shared<DSCConfig>(&scenario);
        let coin = ts::take_from_sender<Coin<SUI>>(&scenario);

        dsc::deposit_collateral<SUI>(
            coin,
            &mut user_position,
            &config,
            ts::ctx(&mut scenario),
        );

        ts::return_shared(user_position);
        ts::return_shared(config);
    };

    // Second deposit - should accumulate
    mint_sui_for_testing(&mut scenario, USER1, DEPOSIT_AMOUNT);
    ts::next_tx(&mut scenario, USER1);
    {
        let mut user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id);
        let config = ts::take_shared<DSCConfig>(&scenario);
        let coin = ts::take_from_sender<Coin<SUI>>(&scenario);

        dsc::deposit_collateral<SUI>(
            coin,
            &mut user_position,
            &config,
            ts::ctx(&mut scenario),
        );

        // Vault size should still be 1 (same coin type)
        assert!(dsc::user_position_vault_size(&user_position) == 1, 0);

        ts::return_shared(user_position);
        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
/// Test depositing from multiple users to their own positions
fun test_deposit_collateral_multiple_users() {
    let mut scenario = setup_dsc_system();
    let position_id_1 = create_user_position(&mut scenario, USER1);
    let position_id_2 = create_user_position(&mut scenario, USER2);

    // USER1 deposits
    mint_sui_for_testing(&mut scenario, USER1, DEPOSIT_AMOUNT);
    ts::next_tx(&mut scenario, USER1);
    {
        let mut user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id_1);
        let config = ts::take_shared<DSCConfig>(&scenario);
        let coin = ts::take_from_sender<Coin<SUI>>(&scenario);

        dsc::deposit_collateral<SUI>(
            coin,
            &mut user_position,
            &config,
            ts::ctx(&mut scenario),
        );

        assert!(dsc::user_position_vault_size(&user_position) == 1, 0);

        ts::return_shared(user_position);
        ts::return_shared(config);
    };

    // USER2 deposits
    mint_sui_for_testing(&mut scenario, USER2, DEPOSIT_AMOUNT);
    ts::next_tx(&mut scenario, USER2);
    {
        let mut user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id_2);
        let config = ts::take_shared<DSCConfig>(&scenario);
        let coin = ts::take_from_sender<Coin<SUI>>(&scenario);

        dsc::deposit_collateral<SUI>(
            coin,
            &mut user_position,
            &config,
            ts::ctx(&mut scenario),
        );

        assert!(dsc::user_position_vault_size(&user_position) == 1, 1);

        ts::return_shared(user_position);
        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure]
/// Test deposit fails when unauthorized user tries to deposit
fun test_deposit_collateral_unauthorized() {
    let mut scenario = setup_dsc_system();
    let position_id = create_user_position(&mut scenario, USER1);
    mint_sui_for_testing(&mut scenario, USER2, DEPOSIT_AMOUNT);

    // USER2 tries to deposit to USER1's position - should fail
    ts::next_tx(&mut scenario, USER2);
    {
        let mut user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id);
        let config = ts::take_shared<DSCConfig>(&scenario);
        let coin = ts::take_from_sender<Coin<SUI>>(&scenario);

        dsc::deposit_collateral<SUI>(
            coin,
            &mut user_position,
            &config,
            ts::ctx(&mut scenario),
        );

        ts::return_shared(user_position);
        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure]
/// Test deposit fails with zero amount
fun test_deposit_collateral_zero_amount() {
    let mut scenario = setup_dsc_system();
    let position_id = create_user_position(&mut scenario, USER1);

    ts::next_tx(&mut scenario, USER1);
    {
        let mut user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id);
        let config = ts::take_shared<DSCConfig>(&scenario);
        let coin = coin::mint_for_testing<SUI>(0, ts::ctx(&mut scenario));

        dsc::deposit_collateral<SUI>(
            coin,
            &mut user_position,
            &config,
            ts::ctx(&mut scenario),
        );

        ts::return_shared(user_position);
        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
/// Test large deposit amounts
fun test_deposit_collateral_large_amount() {
    let mut scenario = setup_dsc_system();
    let position_id = create_user_position(&mut scenario, USER1);

    // Deposit a large amount (1000 SUI)
    let large_amount = 1_000_000_000_000; // 1000 SUI
    mint_sui_for_testing(&mut scenario, USER1, large_amount);

    ts::next_tx(&mut scenario, USER1);
    {
        let mut user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id);
        let config = ts::take_shared<DSCConfig>(&scenario);
        let coin = ts::take_from_sender<Coin<SUI>>(&scenario);

        dsc::deposit_collateral<SUI>(
            coin,
            &mut user_position,
            &config,
            ts::ctx(&mut scenario),
        );

        assert!(dsc::user_position_vault_size(&user_position) == 1, 0);

        ts::return_shared(user_position);
        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
/// Test sequential deposits accumulate correctly
fun test_deposit_collateral_accumulation() {
    let mut scenario = setup_dsc_system();
    let position_id = create_user_position(&mut scenario, USER1);

    // Perform 5 deposits
    let mut i = 0;
    while (i < 5) {
        mint_sui_for_testing(&mut scenario, USER1, DEPOSIT_AMOUNT);
        ts::next_tx(&mut scenario, USER1);
        {
            let mut user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id);
            let config = ts::take_shared<DSCConfig>(&scenario);
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);

            dsc::deposit_collateral<SUI>(
                coin,
                &mut user_position,
                &config,
                ts::ctx(&mut scenario),
            );

            // Vault size should remain 1 (same coin type)
            assert!(dsc::user_position_vault_size(&user_position) == 1, i);

            ts::return_shared(user_position);
            ts::return_shared(config);
        };
        i = i + 1;
    };

    ts::end(scenario);
}

#[test]
/// Test deposit after creating a fresh position
fun test_deposit_immediately_after_position_creation() {
    let mut scenario = setup_dsc_system();

    ts::next_tx(&mut scenario, USER1);
    let position_id;
    {
        let mut dsc_ledger = ts::take_shared<DSCLedger>(&scenario);
        position_id = dsc::new_position(&mut dsc_ledger, ts::ctx(&mut scenario));
        ts::return_shared(dsc_ledger);
    };

    // Immediately deposit without changing transaction
    mint_sui_for_testing(&mut scenario, USER1, DEPOSIT_AMOUNT);
    ts::next_tx(&mut scenario, USER1);
    {
        let mut user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id);
        let config = ts::take_shared<DSCConfig>(&scenario);
        let coin = ts::take_from_sender<Coin<SUI>>(&scenario);

        dsc::deposit_collateral<SUI>(
            coin,
            &mut user_position,
            &config,
            ts::ctx(&mut scenario),
        );

        assert!(dsc::user_position_vault_size(&user_position) == 1, 0);

        ts::return_shared(user_position);
        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
/// Test that vault size correctly reflects number of different coin types
fun test_deposit_vault_size_tracking() {
    let mut scenario = setup_dsc_system();
    let position_id = create_user_position(&mut scenario, USER1);

    // Verify empty vault initially
    ts::next_tx(&mut scenario, USER1);
    {
        let user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id);
        assert!(dsc::user_position_vault_size(&user_position) == 0, 0);
        ts::return_shared(user_position);
    };

    // Deposit SUI
    mint_sui_for_testing(&mut scenario, USER1, DEPOSIT_AMOUNT);
    ts::next_tx(&mut scenario, USER1);
    {
        let mut user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id);
        let config = ts::take_shared<DSCConfig>(&scenario);
        let coin = ts::take_from_sender<Coin<SUI>>(&scenario);

        dsc::deposit_collateral<SUI>(
            coin,
            &mut user_position,
            &config,
            ts::ctx(&mut scenario),
        );

        assert!(dsc::user_position_vault_size(&user_position) == 1, 1);

        ts::return_shared(user_position);
        ts::return_shared(config);
    };

    ts::end(scenario);
}

// ==================== Integration Tests ====================

#[test]
/// Test complete workflow: create position, deposit multiple times, verify state
fun test_complete_deposit_workflow() {
    let mut scenario = setup_dsc_system();
    let position_id = create_user_position(&mut scenario, USER1);

    // Verify initial state
    ts::next_tx(&mut scenario, USER1);
    {
        let user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id);
        assert!(dsc::user_position_owner(&user_position) == USER1, 0);
        assert!(dsc::user_position_debt(&user_position) == 0, 1);
        assert!(dsc::user_position_vault_size(&user_position) == 0, 2);
        ts::return_shared(user_position);
    };

    // Deposit 1st time
    mint_sui_for_testing(&mut scenario, USER1, DEPOSIT_AMOUNT);
    ts::next_tx(&mut scenario, USER1);
    {
        let mut user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id);
        let config = ts::take_shared<DSCConfig>(&scenario);
        let coin = ts::take_from_sender<Coin<SUI>>(&scenario);

        dsc::deposit_collateral<SUI>(coin, &mut user_position, &config, ts::ctx(&mut scenario));

        assert!(dsc::user_position_vault_size(&user_position) == 1, 3);

        ts::return_shared(user_position);
        ts::return_shared(config);
    };

    // Deposit 2nd time
    mint_sui_for_testing(&mut scenario, USER1, DEPOSIT_AMOUNT * 2);
    ts::next_tx(&mut scenario, USER1);
    {
        let mut user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id);
        let config = ts::take_shared<DSCConfig>(&scenario);
        let coin = ts::take_from_sender<Coin<SUI>>(&scenario);

        dsc::deposit_collateral<SUI>(coin, &mut user_position, &config, ts::ctx(&mut scenario));

        assert!(dsc::user_position_vault_size(&user_position) == 1, 4);

        ts::return_shared(user_position);
        ts::return_shared(config);
    };

    // Verify final state
    ts::next_tx(&mut scenario, USER1);
    {
        let user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id);
        assert!(dsc::user_position_vault_size(&user_position) == 1, 5);
        assert!(dsc::user_position_debt(&user_position) == 0, 6);
        ts::return_shared(user_position);
    };

    ts::end(scenario);
}
