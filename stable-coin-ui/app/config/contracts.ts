/**
 * DSC (Decentralized Stable Coin) Contract Addresses
 * These are the deployed contract addresses on Sui network
 */

export const DSC_CONTRACTS = {
    /** Main package ID for the DSC contract */
    PACKAGE_ID:
        '0x2b26d3186b5f84c0ec9918221e2b6d057c670df89e4ade29c992ea4a09c72b03',

    /** DSC Currency object */
    CURRENCY:
        '0x83293a541eb89c0776a3f85a633615ba63045447ab5dd9ff343f8a3ee8a3dac3',

    /** DSC Configuration object */
    CONFIG: '0xc8989ea334a0355d6af339d0353525c2ca2b02a955688e6349c0cee500d027a5',

    /** DSC Ledger object */
    LEDGER: '0x83abdfff6f113f4b626807679acb8dd67fb8b46114662b7fc390a6fbaf1c62bd',

    /** Metadata capability */
    METADATA_CAP:
        '0x12c55f03cd10434118205fd4e952287be6e0a9369e2342dd54548cd19924e7d8',

    /** Upgrade capability */
    UPGRADE_CAP:
        '0x20125df992fda6d286ed0f99ca62a15dbf0318be0a228d3c3433104930b8cb69',

    /** Admin capability */
    ADMIN_CAP:
        '0x018231144f7928f800f0d7062e3f7369a1a86586ce312205e9a5e599a6588623',
} as const

/** Type helper for DSC contract addresses */
export type DSCContracts = typeof DSC_CONTRACTS
