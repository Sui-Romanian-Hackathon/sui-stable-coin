export default function PositionSummary() {
    return (
        <div className="bg-gray-100 dark:bg-gray-800 flex  rounded-xl py-10">
            <div className="px-5 w-full flex flex-col space-y-6">
                <label className="font-bold text-sm text-gray-500">
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
        <div className="flex flex-row justify-between text-xl font-semibold">
            <span>{label}</span>
            <span>{value}</span>
        </div>
    )
}
