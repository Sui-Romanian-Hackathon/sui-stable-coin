export default function PositionSummary() {
    return (
        <div className="bg-gray-100 dark:bg-slate-800 flex  rounded-xl py-10">
            <div className="w-full flex flex-col">
                <label className="font-bold text-sm text-gray-500 pb-5 px-5">
                    Position Summary
                </label>

                <Row label="Collateral" value="0.0000 SUI" />
                <Row label="Collateral Value" value="0.0000 USDC" />
                <Row label="Borrowed Amount" value="0.0000 USDC" />
                <Row label="Available to Borrow" value="0.0000 USDC" />
                <Row label="Health Factor" value="0.00" />
            </div>
        </div>
    )
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-row justify-between text-lg font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 p-4 rounded-xl transition">
            <span>{label}</span>
            <span>{value}</span>
        </div>
    )
}
