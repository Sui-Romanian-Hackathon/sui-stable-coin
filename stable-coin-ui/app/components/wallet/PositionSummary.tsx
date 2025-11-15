export default function PositionSummary() {
    return (
        <div className="flex rounded-xl p-6">
            <div className="w-full flex flex-col space-y-1">
                <label className="font-bold text-sm text-blue-600 dark:text-blue-400 uppercase tracking-wide pb-4">
                    Position Summary
                </label>

                <Row label="Collateral" value="0.0000 SUI" />
                <Row label="Collateral Value" value="0.0000 USDC" />
                <Row label="Borrowed Amount" value="0.0000 USDC" />
                <Row label="Available to Borrow" value="0.0000 USDC" />
                <Row label="Health Factor" value="0.00" highlight />
            </div>
        </div>
    )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className={`flex flex-row justify-between text-sm md:text-base font-medium hover:bg-gray-100/50 dark:hover:bg-slate-700/50 p-3 rounded-lg transition ${highlight ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
            <span>{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    )
}
