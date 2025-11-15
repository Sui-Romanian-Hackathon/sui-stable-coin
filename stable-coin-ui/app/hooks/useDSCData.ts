import { useQuery } from '@tanstack/react-query'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import {
    getUserPositionId,
    getUserPositionInfo,
    getSupportedCoinTypes,
    getCoinInfo,
} from '../lib/dsc-queries'
import { UserPosition, SupportedCoin, EMPTY_POSITION } from '../types/dsc'

/**
 * Hook to fetch the current user's position
 * Returns empty position if user has no position or is not connected
 */
export function useUserPosition() {
    const client = useSuiClient()
    const account = useCurrentAccount()

    return useQuery({
        queryKey: ['userPosition', account?.address],
        queryFn: async (): Promise<UserPosition> => {
            if (!account?.address) {
                return EMPTY_POSITION
            }

            try {
                // Step 1: Get position ID
                const positionId = await getUserPositionId(
                    client,
                    account.address
                )

                // Step 2: If no position, return empty
                if (!positionId) {
                    return EMPTY_POSITION
                }

                // Step 3: Get position info
                const positionInfo = await getUserPositionInfo(
                    client,
                    account.address,
                    positionId
                )

                return positionInfo
            } catch (error) {
                console.error('Error in useUserPosition:', error)
                return EMPTY_POSITION
            }
        },
        enabled: !!account?.address,
        // staleTime: 10000, // Consider data fresh for 10 seconds
        // refetchInterval: 30000, // Refetch every 30 seconds to keep data updated
        // retry: 2,
    })
}

/**
 * Hook to fetch all supported collateral coins
 * Returns empty array if user is not connected
 */
export function useSupportedCoins() {
    const client = useSuiClient()
    const account = useCurrentAccount()

    return useQuery({
        queryKey: ['supportedCoins'],
        queryFn: async (): Promise<SupportedCoin[]> => {
            if (!account?.address) {
                return []
            }

            try {
                // Step 1: Get all supported coin types
                const coinTypes = await getSupportedCoinTypes(
                    client,
                    account.address
                )

                if (coinTypes.length === 0) {
                    return []
                }

                // Step 2: Get info for each coin type in parallel
                const coinInfoPromises = coinTypes.map((coinType) =>
                    getCoinInfo(client, account.address!, coinType)
                )

                const coinsInfo = await Promise.all(coinInfoPromises)

                // Filter out any null results (failed fetches)
                return coinsInfo.filter(
                    (coin): coin is SupportedCoin => coin !== null
                )
            } catch (error) {
                console.error('Error in useSupportedCoins:', error)
                return []
            }
        },
        enabled: !!account?.address,
        // staleTime: 60000, // Consider data fresh for 1 minute
        // refetchInterval: 120000, // Refetch every 2 minutes (supported coins change rarely)
        // retry: 2,
    })
}

/**
 * Hook to fetch a specific coin's information
 */
export function useCoinInfo(coinType: string | null) {
    const client = useSuiClient()
    const account = useCurrentAccount()

    return useQuery({
        queryKey: ['coinInfo', coinType],
        queryFn: async (): Promise<SupportedCoin | null> => {
            if (!account?.address || !coinType) {
                return null
            }

            try {
                return await getCoinInfo(client, account.address, coinType)
            } catch (error) {
                console.error(
                    `Error fetching coin info for ${coinType}:`,
                    error
                )
                return null
            }
        },
        enabled: !!account?.address && !!coinType,
        staleTime: 30000,
        retry: 2,
    })
}
