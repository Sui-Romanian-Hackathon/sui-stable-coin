'use client'

import { Transaction } from '@mysten/sui/transactions'
import {
    useSignAndExecuteTransaction,
    useSuiClient,
    useCurrentAccount,
} from '@mysten/dapp-kit'
import { useState } from 'react'

export function GetInfoTransaction() {
    const suiClient = useSuiClient()
    const account = useCurrentAccount()
    const { mutate: signAndExecute } = useSignAndExecuteTransaction()

    const [loading, setLoading] = useState(false)

    const create = async () => {
        if (!account) {
            alert('⚠️ Please connect your wallet first')
            return
        }

        try {
            setLoading(true)

            // Create transaction
            const tx = new Transaction()

            tx.moveCall({
                target: '0xa9146c3ea4bae6a54bce6bf3c167eca6e3be035e559012466750f1553d26b59::greeting::new',
                arguments: [], // ctx is auto-injected
            })

            // Sign and execute
            signAndExecute(
                {
                    transaction: tx,
                    chain: 'sui:testnet', // use the right network for your package
                },
                {
                    onSuccess: async (result) => {
                        console.log('✅ Transaction success:', result)
                        const receipt = await suiClient.waitForTransaction({
                            digest: result.digest,
                            options: { showEffects: true },
                        })
                        console.log('🎉 Created Greeting object:', receipt)
                        setLoading(false)
                    },
                    onError: (err) => {
                        console.error('❌ Error executing transaction:', err)
                        setLoading(false)
                    },
                }
            )
        } catch (err) {
            console.error('Transaction failed:', err)
            setLoading(false)
        }
    }

    return (
        <button
            onClick={create}
            disabled={loading}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"
        >
            {loading ? 'Creating...' : 'Create Greeting'}
        </button>
    )
}
