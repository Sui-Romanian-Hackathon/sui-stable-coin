// TypeScript types for DSC protocol data structures

export interface CoinAmount {
    coinType: string
    amount: string
    price: string
}

export interface UserPosition {
    id: string | null
    coins: CoinAmount[]
    healthFactor: string
    debt: string
    collateralValue: string
}

export interface SupportedCoin {
    coinType: string
    price: string
    decimals: number
}

export interface DSCData {
    userPosition: UserPosition | null
    supportedCoins: SupportedCoin[]
    isLoading: boolean
    error: Error | null
    refetchPosition: () => void
    refetchCoins: () => void
}

// Empty position state
export const EMPTY_POSITION: UserPosition = {
    id: null,
    coins: [],
    healthFactor: '0',
    debt: '0',
    collateralValue: '0',
}
