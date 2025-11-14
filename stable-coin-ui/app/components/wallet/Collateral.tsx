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
        <div className="flex flex-col md:flex-row justify-between md:space-x-2 bg-slate-900 rounded-xl">
            <div className="md:flex-1 bg-slate-800 rounded-xl mb-2">
                <div className="px-5 pt-10 pb-4 w-full flex flex-col space-y-6">
                    <label className="font-bold text-sm text-gray-500">
                        Collateral Asset
                    </label>
                </div>
                {coins?.map((c) => (
                    <CoinRow
                        key={c.symbol}
                        coin={c}
                        selected={selectedCoin?.symbol === c.symbol}
                        onSelect={() => setSelectedCoin(c)}
                    />
                ))}
            </div>

            <div className="md:flex-1 bg-slate-900 rounded-xl flex flex-col space-y-2 mb-2">
                <PositionSummary />
            </div>
        </div>
    )
}
