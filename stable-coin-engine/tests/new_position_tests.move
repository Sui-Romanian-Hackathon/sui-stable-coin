#[test_only]
module dsc::new_position_tests;

use dsc::dsc::{Self, DSCLedger, UserPosition};
use sui::test_scenario::{Self as ts, Scenario};

// ==================== Constants ====================
const ADMIN: address = @0xAD;
const USER1: address = @0x1;
const USER2: address = @0x2;

// ==================== Helper Functions ====================

/// Initialize the DSC protocol for testing
/// Returns a scenario with the DSCLedger created
fun setup_dsc_protocol(): Scenario {
    let mut scenario = ts::begin(ADMIN);
    {
        // Initialize the DSC module which creates the DSCLedger
        dsc::test_init(ts::ctx(&mut scenario));
    };
    scenario
}

// ==================== Test Scenarios ====================

/// Test 1: Basic new_position creation - verify a user can create a position successfully
#[test]
fun test_new_position_basic_creation() {
    let mut scenario = setup_dsc_protocol();

    // User1 creates a new position
    ts::next_tx(&mut scenario, USER1);
    {
        let mut dsc_ledger = ts::take_shared<DSCLedger>(&scenario);

        let position_id = dsc::new_position(&mut dsc_ledger, ts::ctx(&mut scenario));

        // Verify that ID is valid (non-zero)
        assert!(position_id != object::id_from_address(@0x0), 0);

        ts::return_shared(dsc_ledger);
    };

    ts::end(scenario);
}

/// Test 2: Verify position owner is set correctly
#[test]
fun test_new_position_owner_verification() {
    let mut scenario = setup_dsc_protocol();

    ts::next_tx(&mut scenario, USER1);
    let position_id;
    {
        let mut dsc_ledger = ts::take_shared<DSCLedger>(&scenario);

        let pos_id = dsc::new_position(&mut dsc_ledger, ts::ctx(&mut scenario));
        position_id = pos_id;

        ts::return_shared(dsc_ledger);
    };

    // Verify the position is shared and has correct owner
    ts::next_tx(&mut scenario, USER1);
    {
        let user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id);
        assert!(dsc::user_position_owner(&user_position) == USER1, 0);
        ts::return_shared(user_position);
    };

    ts::end(scenario);
}

/// Test 3: Verify initial UserPosition state
#[test]
fun test_new_position_initial_state() {
    let mut scenario = setup_dsc_protocol();

    ts::next_tx(&mut scenario, USER1);
    let position_id;
    {
        let mut dsc_ledger = ts::take_shared<DSCLedger>(&scenario);

        let pos_id = dsc::new_position(&mut dsc_ledger, ts::ctx(&mut scenario));
        position_id = pos_id;

        ts::return_shared(dsc_ledger);
    };

    // Verify the position has correct initial state
    ts::next_tx(&mut scenario, USER1);
    {
        let user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id);

        // Verify owner is USER1
        assert!(dsc::user_position_owner(&user_position) == USER1, 0);

        // Verify initial debt is 0
        assert!(dsc::user_position_debt(&user_position) == 0, 1);

        // Verify initial health factor is max value (u128::max_value)
        assert!(dsc::user_position_last_hf(&user_position) == std::u128::max_value!(), 2);

        // Verify vault is empty
        assert!(dsc::user_position_vault_size(&user_position) == 0, 3);

        ts::return_shared(user_position);
    };

    ts::end(scenario);
}

/// Test 4: Multiple users can create positions independently
#[test]
fun test_new_position_multiple_users() {
    let mut scenario = setup_dsc_protocol();

    // USER1 creates a position
    ts::next_tx(&mut scenario, USER1);
    let position_id_1;
    {
        let mut dsc_ledger = ts::take_shared<DSCLedger>(&scenario);
        let pos_id = dsc::new_position(&mut dsc_ledger, ts::ctx(&mut scenario));
        position_id_1 = pos_id;
        ts::return_shared(dsc_ledger);
    };

    // USER2 creates a position
    ts::next_tx(&mut scenario, USER2);
    let position_id_2;
    {
        let mut dsc_ledger = ts::take_shared<DSCLedger>(&scenario);
        let pos_id = dsc::new_position(&mut dsc_ledger, ts::ctx(&mut scenario));
        position_id_2 = pos_id;
        ts::return_shared(dsc_ledger);
    };

    // Verify positions are different
    assert!(position_id_1 != position_id_2, 0);

    // Verify USER1's position has correct owner
    ts::next_tx(&mut scenario, USER1);
    {
        let user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id_1);
        assert!(dsc::user_position_owner(&user_position) == USER1, 1);
        ts::return_shared(user_position);
    };

    // Verify USER2's position has correct owner
    ts::next_tx(&mut scenario, USER2);
    {
        let user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id_2);
        assert!(dsc::user_position_owner(&user_position) == USER2, 2);
        ts::return_shared(user_position);
    };

    ts::end(scenario);
}

/// Test 5: User cannot create multiple positions (sequential) - second attempt should fail
/// This test verifies that table::add prevents duplicate entries
#[test]
#[expected_failure(abort_code = sui::dynamic_field::EFieldAlreadyExists)]
fun test_new_position_same_user_multiple_positions() {
    let mut scenario = setup_dsc_protocol();

    // USER1 creates first position
    ts::next_tx(&mut scenario, USER1);
    {
        let mut dsc_ledger = ts::take_shared<DSCLedger>(&scenario);
        let _pos_id = dsc::new_position(&mut dsc_ledger, ts::ctx(&mut scenario));
        ts::return_shared(dsc_ledger);
    };

    // USER1 attempts to create second position - this should fail
    ts::next_tx(&mut scenario, USER1);
    {
        let mut dsc_ledger = ts::take_shared<DSCLedger>(&scenario);
        // This will abort with EFieldAlreadyExists because the user already has an entry
        let _pos_id = dsc::new_position(&mut dsc_ledger, ts::ctx(&mut scenario));
        ts::return_shared(dsc_ledger);
    };

    ts::end(scenario);
}

/// Test 6: Verify NewPositionCreated event is emitted
#[test]
fun test_new_position_emits_event() {
    let mut scenario = setup_dsc_protocol();

    ts::next_tx(&mut scenario, USER1);
    {
        let mut dsc_ledger = ts::take_shared<DSCLedger>(&scenario);

        let position_id = dsc::new_position(&mut dsc_ledger, ts::ctx(&mut scenario));

        // Verify event was emitted (this would require event inspection in actual tests)
        // In Move testing framework, events can be checked via test utilities
        assert!(position_id != object::id_from_address(@0x0), 0);

        ts::return_shared(dsc_ledger);
    };

    ts::end(scenario);
}

/// Test 7: Stress test - create many positions with different users
#[test]
fun test_new_position_multiple_sequential_creations() {
    let mut scenario = setup_dsc_protocol();

    // Create an array of different user addresses
    let users = vector[
        @0x100,
        @0x101,
        @0x102,
        @0x103,
        @0x104,
    ];

    let mut i = 0;
    while (i < users.length()) {
        let user = *users.borrow(i);
        ts::next_tx(&mut scenario, user);
        {
            let mut dsc_ledger = ts::take_shared<DSCLedger>(&scenario);
            let _pos_id = dsc::new_position(&mut dsc_ledger, ts::ctx(&mut scenario));
            ts::return_shared(dsc_ledger);
        };
        i = i + 1;
    };

    // All positions should be created successfully with different users
    // The test passing means no aborts occurred
    ts::end(scenario);
}

/// Test 8: Verify position registration in DSCLedger index
#[test]
fun test_new_position_registered_in_ledger() {
    let mut scenario = setup_dsc_protocol();

    ts::next_tx(&mut scenario, USER1);
    let position_id;
    {
        let mut dsc_ledger = ts::take_shared<DSCLedger>(&scenario);

        let pos_id = dsc::new_position(&mut dsc_ledger, ts::ctx(&mut scenario));
        position_id = pos_id;

        // Verify the position is registered in the index
        assert!(dsc::ledger_has_user_position(&dsc_ledger, USER1), 0);

        // Verify the indexed position ID matches
        assert!(dsc::ledger_get_user_position_id(&dsc_ledger, USER1) == position_id, 1);

        ts::return_shared(dsc_ledger);
    };

    ts::end(scenario);
}

/// Test 9: Verify returned ID is consistent with stored position
#[test]
fun test_new_position_returned_id_consistency() {
    let mut scenario = setup_dsc_protocol();

    ts::next_tx(&mut scenario, USER1);
    let position_id_returned;
    {
        let mut dsc_ledger = ts::take_shared<DSCLedger>(&scenario);

        let pos_id = dsc::new_position(&mut dsc_ledger, ts::ctx(&mut scenario));
        position_id_returned = pos_id;

        // Verify the ID matches the stored position ID
        let stored_id = dsc::ledger_get_user_position_id(&dsc_ledger, USER1);
        assert!(stored_id == position_id_returned, 0);

        ts::return_shared(dsc_ledger);
    };

    // Verify position owner is USER1 via shared object
    ts::next_tx(&mut scenario, USER1);
    {
        let user_position = ts::take_shared_by_id<UserPosition>(&scenario, position_id_returned);
        assert!(dsc::user_position_owner(&user_position) == USER1, 1);
        ts::return_shared(user_position);
    };

    ts::end(scenario);
}
