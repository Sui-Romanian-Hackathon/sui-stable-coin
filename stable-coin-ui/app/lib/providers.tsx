'use client'

import {
    createNetworkConfig,
    SuiClientProvider,
    WalletProvider,
} from '@mysten/dapp-kit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import DarkModeProvider from '@/app/context/DarkModeContext'
import { DSCProvider } from '@/app/context/DSCContext'

// Configure network
const { networkConfig } = createNetworkConfig({
    testnet: { url: 'https://fullnode.testnet.sui.io:443' },
    mainnet: { url: 'https://fullnode.mainnet.sui.io:443' },
})

const queryClient = new QueryClient()

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <DarkModeProvider>
            <QueryClientProvider client={queryClient}>
                <SuiClientProvider
                    networks={networkConfig}
                    defaultNetwork="testnet"
                >
                    <WalletProvider>
                        <DSCProvider>{children}</DSCProvider>
                    </WalletProvider>
                </SuiClientProvider>
            </QueryClientProvider>
        </DarkModeProvider>
    )
}
