'use client'

import { useState, useRef, useEffect } from 'react'

interface ActionPopupProps {
    isOpen: boolean
    onClose: () => void
    onExecute: (value: string) => void
    title: string
    inputPlaceholder?: string
    buttonLabel?: string
    position?: { top: number; left: number }
}

export default function ActionPopup({
    isOpen,
    onClose,
    onExecute,
    title,
    inputPlaceholder = 'Enter amount',
    buttonLabel = 'Execute',
    position,
}: ActionPopupProps) {
    const [inputValue, setInputValue] = useState('')
    const popupRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(event.target as Node)
            ) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, onClose])

    const handleExecute = () => {
        if (inputValue.trim()) {
            onExecute(inputValue)
            setInputValue('')
            onClose()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleExecute()
        } else if (e.key === 'Escape') {
            onClose()
        }
    }

    if (!isOpen) return null

    const style = position
        ? { top: `${position.top}px`, left: `${position.left}px` }
        : {}

    return (
        <div
            ref={popupRef}
            className="fixed z-50 bg-gray-100 dark:bg-slate-800 border border-blue-100 dark:border-blue-950 rounded-xl shadow-lg p-4 min-w-[280px]"
            style={style}
        >
            <div className="flex flex-col space-y-3">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {title}
                </h3>

                <input
                    type="text"
                    className="w-full rounded-xl px-4 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder={inputPlaceholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />

                <div className="flex gap-2 justify-end">
                    <button
                        className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors duration-200 font-semibold text-sm"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors duration-200 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleExecute}
                        disabled={!inputValue.trim()}
                    >
                        {buttonLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
