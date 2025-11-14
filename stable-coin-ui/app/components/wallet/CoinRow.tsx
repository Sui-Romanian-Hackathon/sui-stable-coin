export type Coin = {
    name: string
    symbol: string
    icon: string
    value: string
    balance: string
}

type CoinRowProps = {
    coin: Coin
    selected: boolean
    onSelect: React.Dispatch<React.SetStateAction<Coin | null>>
}

export default function CoinRow({ coin, selected, onSelect }: CoinRowProps) {
    return (
        <div
            onClick={() => onSelect(coin)}
            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition
        ${selected ? 'bg-slate-700' : 'hover:bg-slate-800'}
      `}
        >
            {/* Left side */}
            <div className="flex items-center gap-4">
                <img src={coin.icon} alt={coin.name} className="w-10 h-10" />
                <div>
                    <p className="text-white font-medium">{coin.name}</p>
                    <p className="text-gray-400 text-sm">{coin.symbol}</p>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                <p className="text-gray-300 w-10 text-right">{coin.balance}</p>

                <button className="w-8 h-8 rounded-full bg-slate-600 text-xl leading-none text-white flex items-center justify-center">
                    +
                </button>

                <button className="w-8 h-8 rounded-full bg-slate-600 text-xl leading-none text-white flex items-center justify-center">
                    −
                </button>
            </div>
        </div>
    )
}
