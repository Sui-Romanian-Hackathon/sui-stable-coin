'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useUserPosition, useSupportedCoins } from '../hooks/useDSCData'
import { DSCData } from '../types/dsc'

const DSCContext = createContext<DSCData | undefined>(undefined)

/**
 * DSC Context Provider
 * Provides global access to user position and supported coins data
 */
export function DSCProvider({ children }: { children: ReactNode }) {
    const {
        data: userPosition,
        isLoading: positionLoading,
        error: positionError,
        refetch: refetchPosition,
    } = useUserPosition()

    const {
        data: supportedCoins,
        isLoading: coinsLoading,
        error: coinsError,
        refetch: refetchCoins,
    } = useSupportedCoins()

    const value: DSCData = {
        userPosition: userPosition ?? null,
        supportedCoins: supportedCoins ?? [],
        isLoading: positionLoading || coinsLoading,
        error: (positionError || coinsError) as Error | null,
        refetchPosition,
        refetchCoins,
    }

    return <DSCContext.Provider value={value}>{children}</DSCContext.Provider>
}

/**
 * Hook to access DSC context data
 * Must be used within DSCProvider
 */
export function useDSC() {
    const context = useContext(DSCContext)
    if (context === undefined) {
        throw new Error('useDSC must be used within a DSCProvider')
    }
    return context
}
