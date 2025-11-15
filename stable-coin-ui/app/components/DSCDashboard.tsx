'use client'

import { useDSC } from '../context/DSCContext'
import { useCurrentAccount } from '@mysten/dapp-kit'

/**
 * Example component demonstrating how to use the DSC context
 * This component displays the user's position and supported coins
 */
export function DSCDashboard() {
    const account = useCurrentAccount()
    const { userPosition, supportedCoins, isLoading, error, refetchPosition } =
        useDSC()

    if (!account) {
        return (
            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200">
                    Please connect your wallet to view your DSC position
                </p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                    Loading DSC data...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-red-800 dark:text-red-200">
                    Error loading data: {error.message}
                </p>
                <button
                    onClick={() => refetchPosition()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* User Position Section */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">Your Position</h2>

                {userPosition?.id ? (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Position ID
                            </p>
                            <p className="font-mono text-xs break-all">
                                {userPosition.id}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Health Factor
                                </p>
                                <p className="text-2xl font-bold">
                                    {formatHealthFactor(userPosition.healthFactor)}
                                </p>
                            </div>

                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Collateral Value
                                </p>
                                <p className="text-2xl font-bold">
                                    ${formatAmount(userPosition.collateralValue)}
                                </p>
                            </div>

                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Debt
                                </p>
                                <p className="text-2xl font-bold">
                                    ${formatAmount(userPosition.debt)}
                                </p>
                            </div>
                        </div>

                        {userPosition.coins.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">
                                    Deposited Collateral
                                </h3>
                                <div className="space-y-2">
                                    {userPosition.coins.map((coin, index) => (
                                        <div
                                            key={index}
                                            className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {formatCoinType(coin.coinType)}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Amount: {formatAmount(coin.amount)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">
                                                    ${formatAmount(coin.price)}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Price
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            You don't have an open position yet
                        </p>
                        <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            Open Position
                        </button>
                    </div>
                )}
            </div>

            {/* Supported Coins Section */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">Supported Collateral</h2>

                {supportedCoins.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {supportedCoins.map((coin) => (
                            <div
                                key={coin.coinType}
                                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                            >
                                <h3 className="font-semibold text-lg mb-2">
                                    {formatCoinType(coin.coinType)}
                                </h3>
                                <div className="space-y-1 text-sm">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Price:{' '}
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            ${formatAmount(coin.price)}
                                        </span>
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Decimals:{' '}
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {coin.decimals}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                        No supported coins configured yet
                    </p>
                )}
            </div>
        </div>
    )
}

// Helper formatting functions
function formatAmount(amount: string): string {
    try {
        const num = BigInt(amount)
        const divisor = BigInt(10 ** 18) // Assuming 18 decimals
        const quotient = num / divisor
        const remainder = num % divisor
        return `${quotient}.${remainder.toString().padStart(18, '0').slice(0, 4)}`
    } catch {
        return '0.0000'
    }
}

function formatHealthFactor(hf: string): string {
    try {
        const maxU128 = BigInt(
            '340282366920938463463374607431768211455'
        )
        const hfBig = BigInt(hf)

        if (hfBig >= maxU128) {
            return '∞'
        }

        return formatAmount(hf)
    } catch {
        return '0.0000'
    }
}

function formatCoinType(coinType: string): string {
    // Extract the last part of the coin type (e.g., "SUI" from "0x2::sui::SUI")
    const parts = coinType.split('::')
    return parts[parts.length - 1] || coinType
}
