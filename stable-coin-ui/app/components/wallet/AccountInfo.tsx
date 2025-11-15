export default function AccountInfo({ address }: { address: string }) {
    return (
        <div className="pb-5 px-5 md:px-30">
            <div className="p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl border border-gray-200 dark:border-slate-700">
                <label className="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                    Connected Address
                </label>
                <div className="break-all text-sm text-gray-700 dark:text-gray-300 font-mono mt-2">
                    <span>{address}</span>
                </div>
            </div>
        </div>
    )
}
