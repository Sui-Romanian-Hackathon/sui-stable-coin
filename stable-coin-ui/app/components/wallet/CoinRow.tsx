'use client'

import { useState, useRef, useEffect } from 'react'
import ActionPopup from '@/app/components/ActionPopup'

export type Coin = {
    name: string
    symbol: string
    icon: string
    value: string
    balance: string
}

type CoinRowProps = {
    coin: Coin
}

export default function CoinRow({ coin }: CoinRowProps) {
    const [popupState, setPopupState] = useState<{
        isOpen: boolean
        type: 'add' | 'remove' | null
        position: { top: number; left: number }
    }>({
        isOpen: false,
        type: null,
        position: { top: 0, left: 0 },
    })

    const addBtnRef = useRef<HTMLButtonElement>(null)
    const removeBtnRef = useRef<HTMLButtonElement>(null)
    const activeButtonRef = useRef<React.RefObject<HTMLButtonElement> | null>(null)

    const updatePosition = (btnRef: React.RefObject<HTMLButtonElement>) => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setPopupState((prev) => ({
                ...prev,
                position: {
                    top: rect.bottom + 5,
                    left: rect.left + rect.width / 2, // Center relative to button
                },
            }))
        }
    }

    const handleButtonClick = (
        type: 'add' | 'remove',
        btnRef: React.RefObject<HTMLButtonElement>
    ) => {
        activeButtonRef.current = btnRef
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setPopupState({
                isOpen: true,
                type,
                position: {
                    top: rect.bottom + 5,
                    left: rect.left + rect.width / 2, // Center relative to button
                },
            })
        }
    }

    useEffect(() => {
        const handleScroll = () => {
            if (popupState.isOpen && activeButtonRef.current) {
                updatePosition(activeButtonRef.current)
            }
        }

        window.addEventListener('scroll', handleScroll, true)
        return () => {
            window.removeEventListener('scroll', handleScroll, true)
        }
    }, [popupState.isOpen])

    const handleExecute = (value: string) => {
        console.log(
            `${popupState.type} ${coin.symbol} with value:`,
            value
        )
        // Add your execution logic here
    }

    const handleClose = () => {
        setPopupState({
            isOpen: false,
            type: null,
            position: { top: 0, left: 0 },
        })
    }

    return (
        <>
            <div className={`flex items-center justify-between p-4 rounded-xl transition hover:bg-gray-200 dark:hover:bg-slate-700`}>
                {/* Left side */}
                <div className="flex items-center gap-4">
                    <img src={coin.icon} alt={coin.name} className="w-10 h-10" />
                    <div>
                        <p className="text-gray-800 dark:text-white font-medium">
                            {coin.name}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {coin.symbol}
                        </p>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-4">
                    <p className="text-gray-600 dark:text-gray-300 w-10 text-right">
                        {coin.balance}
                    </p>

                    <button
                        ref={addBtnRef}
                        onClick={() => handleButtonClick('add', addBtnRef)}
                        className="w-8 h-8 rounded-full text-xl leading-none text-gray-700 dark:text-white flex items-center justify-center cursor-pointer hover:text-teal-400"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-10 h-10"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                        </svg>
                    </button>

                    <button
                        ref={removeBtnRef}
                        onClick={() => handleButtonClick('remove', removeBtnRef)}
                        className="w-8 h-8 rounded-full  text-xl leading-none text-gray-700 dark:text-white flex items-center justify-center cursor-pointer hover:text-red-700"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="size-10"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            <ActionPopup
                isOpen={popupState.isOpen}
                onClose={handleClose}
                onExecute={handleExecute}
                title={
                    popupState.type === 'add'
                        ? `Add ${coin.symbol}`
                        : `Remove ${coin.symbol}`
                }
                inputPlaceholder="Enter amount"
                buttonLabel={popupState.type === 'add' ? 'Add' : 'Remove'}
                position={popupState.position}
            />
        </>
    )
}
