'use client'

import Navbar from '@/app/components/Navbar'
import { useDarkMode } from '@/app/context/DarkModeContext'
import { ChatPopup } from '@/app/components/ChatPopup'
import { useCurrentAccount } from '@mysten/dapp-kit'
import Wallet from '@/app/components/wallet/Wallet'

export default function Home() {
    const { darkMode } = useDarkMode()
    const account = useCurrentAccount()

    return (
        <div
            className={`${darkMode && 'dark'} min-h-screen flex-col flex  bg-white dark:bg-black text-black dark:text-white transition-all duration-300`}
        >
            <Navbar />
            {!account ? (
                <div className=" px-5 md:px-30 flex-1 items-center justify-center">
                    <div className="max-w-3xl text-center space-y-10">
                        <h1 className="text-6xl font-semibold">
                            Next.js Dark Mode Tutorial
                        </h1>
                        <p> paragraph</p>
                    </div>
                </div>
            ) : (
                <Wallet />
            )}

            <ChatPopup isLoggedIn={false} />
        </div>
    )
}
