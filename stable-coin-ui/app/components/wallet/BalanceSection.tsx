export default function BalanceSection({ balance }: { balance: number }) {
    return (
        <div className="pb-5 flex flex-col flex-1">
            <label className="font-bold text-xs text-teal-400">Balance</label>
            <div className="flex flex-row break-all items-end space-x-2 text-6xl text-gray-800 dark:text-gray-200 font-semibold">
                <span>{balance.toFixed(2)}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-bold">USDC</span>
            </div>
        </div>
    )
}
