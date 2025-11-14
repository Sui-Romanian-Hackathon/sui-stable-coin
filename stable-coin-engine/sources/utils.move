module dsc::utils;

public fun pow10(exponent: u8): u128 {
    let mut result: u128 = 1;
    let mut i: u8 = 0;

    while (i < exponent) {
        result = result * 10;
        i = i + 1;
    };

    result
}

/// Gets a percentage and returns the precision representation used for operations on chain
public fun per_to_precision(percentage: u8, precision: u128): u128 {
    ((percentage as u128) * precision ) / 100
}

#[test]
fun test_pow10() {
    assert!(pow10(0) == 1, 0);
    assert!(pow10(1) == 10, 1);
    assert!(pow10(2) == 100, 2);
    assert!(pow10(18) == 1000000000000000000, 3);
}

#[test]
fun test_per_to_precision() {
    let precision = 1_000_000_000_000_000_000; // 1e18

    // 50% of 1e18
    assert!(per_to_precision(50, precision) == 500_000_000_000_000_000, 0);

    // 10% of 1e18
    assert!(per_to_precision(10, precision) == 100_000_000_000_000_000, 1);

    // 100% of 1e18
    assert!(per_to_precision(100, precision) == 1_000_000_000_000_000_000, 2);

    // 1% of 1e18
    assert!(per_to_precision(1, precision) == 10_000_000_000_000_000, 3);
}
