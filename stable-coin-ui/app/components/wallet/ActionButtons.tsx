export default function ActionButtons() {
    return (
        <div className="pb-5 flex flex-1 flex-row content-center justify-around md:justify-end md:space-x-5">
            <button className="self-end rounded-3xl px-5 py-3 bg-gray-200 dark:bg-gray-600 w-40 font-bold text-gray-700 dark:text-gray-300">
                Add collateral
            </button>

            <button className="self-end rounded-3xl px-5 py-3 bg-gray-200 dark:bg-gray-600 w-40 font-bold text-gray-700 dark:text-gray-300">
                Withdraw
            </button>
        </div>
    )
}
