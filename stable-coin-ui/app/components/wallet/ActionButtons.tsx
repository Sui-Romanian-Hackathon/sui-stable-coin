'use client'

import { useState, useRef, useEffect } from 'react'
import ActionPopup from '@/app/components/ActionPopup'

export default function ActionButtons() {
    const [popupState, setPopupState] = useState<{
        isOpen: boolean
        type: 'supply' | 'borrow' | null
        position: { top: number; left: number }
    }>({
        isOpen: false,
        type: null,
        position: { top: 0, left: 0 },
    })

    const supplyBtnRef = useRef<HTMLButtonElement>(null)
    const borrowBtnRef = useRef<HTMLButtonElement>(null)
    const activeButtonRef = useRef<React.RefObject<HTMLButtonElement> | null>(null)

    const updatePosition = (btnRef: React.RefObject<HTMLButtonElement>) => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setPopupState((prev) => ({
                ...prev,
                position: {
                    top: rect.bottom + 10,
                    left: rect.left - 80,
                },
            }))
        }
    }

    const handleButtonClick = (
        type: 'supply' | 'borrow',
        btnRef: React.RefObject<HTMLButtonElement>
    ) => {
        activeButtonRef.current = btnRef
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setPopupState({
                isOpen: true,
                type,
                position: {
                    top: rect.bottom + 10,
                    left: rect.left - 80,
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
        console.log(`${popupState.type} executed with value:`, value)
        // Add your execution logic here
    }

    const handleClose = () => {
        setPopupState({ isOpen: false, type: null, position: { top: 0, left: 0 } })
    }

    return (
        <>
            <div className="pb-5 flex flex-1 flex-row content-center justify-around md:justify-end md:space-x-4">
                <button
                    ref={supplyBtnRef}
                    onClick={() => handleButtonClick('supply', supplyBtnRef)}
                    className="flex items-center justify-center gap-2 self-end rounded-xl px-6 py-3 bg-blue-500/80 hover:bg-blue-600 backdrop-blur-sm text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                    </svg>
                    Supply
                </button>

                <button
                    ref={borrowBtnRef}
                    onClick={() => handleButtonClick('borrow', borrowBtnRef)}
                    className="flex items-center justify-center gap-2 self-end rounded-xl px-6 py-3 bg-cyan-500/80 hover:bg-cyan-600 backdrop-blur-sm text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z "
                        />
                    </svg>
                    Borrow
                </button>
            </div>

            <ActionPopup
                isOpen={popupState.isOpen}
                onClose={handleClose}
                onExecute={handleExecute}
                title={
                    popupState.type === 'supply'
                        ? 'Supply Amount'
                        : 'Borrow Amount'
                }
                inputPlaceholder="Enter amount"
                buttonLabel={popupState.type === 'supply' ? 'Supply' : 'Borrow'}
                position={popupState.position}
            />
        </>
    )
}
