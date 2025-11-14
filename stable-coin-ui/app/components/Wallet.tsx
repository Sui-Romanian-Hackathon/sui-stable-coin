'use client'

import { useDarkMode } from '@/app/context/DarkModeContext'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { ChatPopup } from '@/app/components/ChatPopup'
import { useState } from 'react'
import { GetInfoTransaction } from '@/app/transactions/GetInfoTransaction'

export function Wallet() {
    const { darkMode } = useDarkMode()
    const account = useCurrentAccount()

    const [balance, setBalance] = useState(0)
    const [collateral, setCollateral] = useState(0)

    const getUserData = async () => ({
        balance,
        collateral,
    })

    return (
        <div
            className={`${darkMode && 'dark'} flex flex-1 pt-10 md:pt-20 bg-white dark:bg-gray-900 text-black dark:text-white transition-all duration-300`}
        >
            <div className="flex-1 flex">
                {account ? (
                    <div className="pt-5  flex-col flex-1 flex">
                        <div className="pb-5 px-5 md:px-30  space-y-5">
                            <div className="flex flex-col">
                                <label className="font-bold text-xs text-teal-400">
                                    Address
                                </label>
                                <div className="break-all text-sm  text-gray-500 font-bold">
                                    <span>{account.address}</span>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between">
                                <div className="pb-5 flex flex-col flex-1">
                                    <label className="font-bold text-xs text-teal-400">
                                        Balance
                                    </label>
                                    <div className="flex flex-row break-all items-end space-x-2 text-6xl text-gray-800 dark:text-gray-200 font-semibold">
                                        <span>20.00</span>
                                        <span className="text-sm text-gray-500 font-bold">
                                            USDC
                                        </span>
                                    </div>
                                </div>
                                <div className="py-5 flex flex-1 flex-row content-center justify-around md:justify-end md:space-x-5">
                                    <div className="self-end">
                                        <button className=" flex flex-row justify-around items-center rounded-3xl  px-3 md:px-5 py-3 text-xs bg-gray-200 dark:bg-gray-600 w-35 md:w-40 font-bold text-gray-700 dark:text-gray-300">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                            </svg>
                                            Supply USDC
                                        </button>
                                    </div>
                                    <div className="self-end">
                                        <button className="flex flex-row justify-around items-center rounded-3xl px-3 md:px-5 py-3 text-xs bg-gray-200 dark:bg-gray-600 w-35 md:w-40 font-bold text-gray-700 dark:text-gray-300">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                            </svg>
                                            Withdraw USDC
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-100  md:px-30 dark:bg-gray-800 flex-1 flex justify-center">
                            <div className=" px-5 pt-5 w-full  md:w-lg flex flex-col space-y-6">
                                <label className="font-bold text-sm text-gray-500">
                                    Position Summary
                                </label>
                                <div className="flex flex-row justify-between text-xl font-semibold">
                                    <span>Collateral</span>
                                    <span>0.0000 SUI</span>
                                </div>
                                <div className="flex flex-row justify-between text-xl font-semibold">
                                    <span>Collateral Value</span>
                                    <span>0.0000 USDC</span>
                                </div>
                                <div className="flex flex-row justify-between text-xl font-semibold">
                                    <span>Borrowed Amount</span>
                                    <span>0.0000 USDC</span>
                                </div>

                                <div className="flex flex-row justify-between text-xl font-semibold">
                                    <span>Available to Borrow</span>
                                    <span>0.0000 USDC</span>
                                </div>
                                <div className="flex flex-row justify-between text-xl font-semibold">
                                    <span>Health Factor</span>
                                    <span>0.00</span>
                                </div>
                                <br />
                                <br />
                                <br />
                            </div>
                        </div>
                        <GetInfoTransaction />
                    </div>
                ) : (
                    <p>No connect</p>
                )}
            </div>
            <ChatPopup isLoggedIn={true} getUserData={getUserData} />
        </div>
    )
}
