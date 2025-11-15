export default function BalanceSection({ balance }: { balance: number }) {
    return (
        <div className="pb-5 flex flex-col flex-1">
            <div className="p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl border border-gray-200 dark:border-slate-700">
                <label className="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                    Balance
                </label>
                <div className="flex flex-row break-all items-end space-x-3 mt-3">
                    <span className="text-5xl md:text-6xl text-gray-800 dark:text-gray-100 font-bold">
                        {balance.toFixed(2)}
                    </span>
                    <span className="text-lg text-gray-600 dark:text-gray-400 font-semibold mb-2">
                        USDC
                    </span>
                </div>
            </div>
        </div>
    )
}
