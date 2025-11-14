'use client'

import { useDarkMode } from '@/app/context/DarkModeContext'
import Link from 'next/link'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'

export default function Navbar() {
    const { darkMode, toggleDarkMode } = useDarkMode()
    const account = useCurrentAccount()

    return (
        <nav className="fixed w-full flex px-5 md:px-30 h-10 md:h-12 items-center justify-between  bg-gray-200 dark:bg-gray-900 shadow-lg border-b border-b-blue-100 dark:border-b-blue-950 border-solid">
            <div className="text-gray-800 dark:text-white text-base md:text-xl font-bold">
                <Link href="/">
                    <p>SUI Protocol</p>
                </Link>
            </div>

            <div className="inline-flex items-center space-x-1">
                <button
                    className="md:w-8 md:h-8 text-blue-900 dark:text-blue-200 font-bold cursor-pointer"
                    onClick={toggleDarkMode}
                >
                    {darkMode ? (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="size-7"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                            />
                        </svg>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="size-7"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                            />
                        </svg>
                    )}
                </button>
                <ConnectButton />
            </div>
        </nav>
    )
}
