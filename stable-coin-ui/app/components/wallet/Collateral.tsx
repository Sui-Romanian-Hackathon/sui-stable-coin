import { useState, useEffect } from 'react'
import CoinRow, { Coin } from './CoinRow'
import PositionSummary from '@/app/components/wallet/PositionSummary'

export function Collateral() {
    const listCoins: string[] = [
        'bitcoin',
        'sui',
        'ethereum',
        'solana',
        'polkadot',
    ]

    const [coins, setCoins] = useState<Coin[]>([])
    const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null)

    useEffect(() => {
        async function fetchLiveData() {
            const updated: Coin[] = await Promise.all(
                listCoins.map(async (coin) => {
                    try {
                        // Example using CoinGecko:
                        const resp = await fetch(
                            `https://api.coingecko.com/api/v3/coins/${coin.toLowerCase()}`
                        )
                        const data = await resp.json()
                        console.log(data)
                        const coinObj: Coin = {
                            name: data.name,
                            symbol: data.symbol,
                            icon: data.image?.small,
                            value: data.market_data?.current_price?.usd,
                            balance: '0.0000',
                        }
                        return coinObj
                    } catch (err) {
                        console.error('Error fetching coin data for', coin, err)
                        const coinObj: Coin = {
                            name: coin,
                            symbol: '',
                            icon: '',
                            value: '',
                            balance: '',
                        }
                        return coinObj
                    }
                })
            )
            setCoins(updated)
        }
        fetchLiveData()
    }, [])

    return (
        <div className="flex flex-col md:flex-row justify-center items-start md:space-x-6 mb-5">
            <div className="w-full flex-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl border border-gray-200 dark:border-slate-700 mb-4 md:mb-0">
                <div className="px-6 pt-6 pb-4 w-full">
                    <label className="font-bold text-sm text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        Collateral Assets
                    </label>
                </div>
                <div className="px-3 pb-3">
                    {coins?.map((c) => (
                        <CoinRow key={c.symbol} coin={c} />
                    ))}
                </div>
            </div>

            <div className="w-full flex-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl border border-gray-200 dark:border-slate-700">
                <PositionSummary />
            </div>
        </div>
    )
}
