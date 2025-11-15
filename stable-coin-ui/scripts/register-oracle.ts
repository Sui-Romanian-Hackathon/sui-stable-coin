/**
 * Script to register the Oracle Holder in the DSC Config
 *
 * This needs to be run by the admin (contract deployer) who has the AdminCap
 *
 * Usage:
 * 1. Find your AdminCap object ID: sui client objects --address YOUR_ADDRESS
 * 2. Set ADMIN_CAP_ID below
 * 3. Run: npx ts-node scripts/register-oracle.ts
 */

import { Transaction } from '@mysten/sui/transactions'
import { SuiClient } from '@mysten/sui/client'
import { DSC_CONFIG } from '../app/config/dsc-constants'

// You need to find the AdminCap object ID from your wallet
// Run: sui client objects --address YOUR_ADDRESS
// Look for: 0x...::dsc_config::AdminCap
const ADMIN_CAP_ID = '0x018231144f7928f800f0d7062e3f7369a1a86586ce312205e9a5e599a6588623'

async function registerOracle() {
    console.log('=== DSC Oracle Registration ===')
    console.log('Package ID:', DSC_CONFIG.PACKAGE_ID)
    console.log('Config ID:', DSC_CONFIG.DSC_CONFIG_ID)
    console.log('Oracle Holder ID:', DSC_CONFIG.ORACLE_HOLDER_ID)
    console.log('Admin Cap ID:', ADMIN_CAP_ID)
    console.log()

    if (ADMIN_CAP_ID.includes('YOUR_ADMIN_CAP_ID_HERE')) {
        console.error('ERROR: Please set ADMIN_CAP_ID first!')
        console.log('Run: sui client objects --address YOUR_ADDRESS')
        console.log('Look for an object of type: dsc_config::AdminCap')
        process.exit(1)
    }

    const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' })

    const tx = new Transaction()

    tx.moveCall({
        target: `${DSC_CONFIG.PACKAGE_ID}::dsc_config::change_oracle_holder`,
        arguments: [
            tx.object(ADMIN_CAP_ID),
            tx.object(DSC_CONFIG.DSC_CONFIG_ID),
            tx.pure.id(DSC_CONFIG.ORACLE_HOLDER_ID),
        ],
    })

    try {
        // Build the transaction
        const txBytes = await tx.build({ client })

        console.log('✅ Transaction built successfully!')
        console.log()
        console.log('Next steps:')
        console.log('1. Copy the transaction bytes below')
        console.log('2. Sign and execute with your admin wallet using Sui CLI or wallet')
        console.log()
        console.log('Transaction bytes (base64):')
        console.log(Buffer.from(txBytes).toString('base64'))
        console.log()
        console.log('Or use Sui CLI:')
        console.log(`sui client call --package ${DSC_CONFIG.PACKAGE_ID} \\`)
        console.log(`  --module dsc_config \\`)
        console.log(`  --function change_oracle_holder \\`)
        console.log(`  --args ${ADMIN_CAP_ID} ${DSC_CONFIG.DSC_CONFIG_ID} ${DSC_CONFIG.ORACLE_HOLDER_ID}`)
    } catch (error) {
        console.error('❌ Error building transaction:', error)
        process.exit(1)
    }
}

registerOracle().catch(console.error)
