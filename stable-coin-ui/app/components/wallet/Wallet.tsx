'use client'

import { useDarkMode } from '@/app/context/DarkModeContext'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { ChatPopup } from '@/app/components/ChatPopup'
import { useState } from 'react'
import AccountInfo from './AccountInfo'
import BalanceSection from './BalanceSection'
import ActionButtons from './ActionButtons'
import PositionSummary from './PositionSummary'
import { GetInfoTransaction } from '@/app/transactions/GetInfoTransaction'
import { Collateral } from '@/app/components/wallet/Collateral'

export default function Wallet() {
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
            className={`${darkMode && 'dark'} flex flex-1  pt-10 bg-gray-50 dark:bg-gray-950 text-black dark:text-white transition-all duration-300`}
        >
            <div className="flex-1 flex">
                {account ? (
                    <div className="pt-5 flex-col flex-1 flex space-y-5">
                        <AccountInfo address={account.address} />

                        <div className="px-5 md:px-30 space-y-5">
                            <div className="flex flex-col md:flex-row justify-between">
                                <BalanceSection balance={20.0} />
                                <ActionButtons />
                            </div>
                        </div>

                        <div className="px-5 md:px-30">
                            {/* <Collateral /> */}
                        </div>

                        {/*<GetInfoTransaction />*/}
                    </div>
                ) : (
                    <p>No connect</p>
                )}
            </div>

            <ChatPopup isLoggedIn={true} getUserData={getUserData} />
        </div>
    )
}
