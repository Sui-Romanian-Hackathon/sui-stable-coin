export default function AccountInfo({ address }: { address: string }) {
    return (
        <div className="pb-5 px-5 md:px-30 space-y-5">
            <div className="flex flex-col">
                <label className="font-bold text-xs text-teal-400">
                    Address
                </label>
                <div className="break-all text-sm text-gray-600 dark:text-gray-400 font-bold">
                    <span>{address}</span>
                </div>
            </div>
        </div>
    )
}
