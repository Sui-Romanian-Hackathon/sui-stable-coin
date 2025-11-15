'use client'

import { useEffect, useRef, useState } from 'react'
import { FaComments, FaTimes } from 'react-icons/fa'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { WalletSession } from '@/app/lib/session'

interface ChatPopupProps {
    isLoggedIn: boolean
    getUserData?: () => Promise<{ balance: number; collateral: number }>
}

export function ChatPopup({ isLoggedIn, getUserData }: ChatPopupProps) {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState<
        { from: 'user' | 'assistant'; text: string }[]
    >([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const account = useCurrentAccount()

    const scrollToBottom = () =>
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    useEffect(scrollToBottom, [messages, open])

    const handleSend = async () => {
        if (!input.trim()) return
        const question = input.trim()
        setMessages((prev) => [...prev, { from: 'user', text: question }])
        setInput('')
        setLoading(true)

        try {
            let userData = undefined
            if (isLoggedIn && getUserData) userData = await getUserData()
            const session_id = WalletSession.getSessionId()

            if (account) {
                const res = await fetch('http://localhost:8000/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: question,
                        session_id: session_id,
                        // user: isLoggedIn ? userData : null,
                        user_position: {
                            collateral_value: 10000,
                            borrowed_amount: 6000,
                            health_factor: 1.33,
                            collateral_asset: 'SUI',
                            liquidation_price: 7.5,
                        },
                        protocol_params: {
                            liquidation_threshold: 0.8,
                            liquidation_penalty: 0.1,
                            min_health_factor: 1.0,
                            borrow_rate: 0.05,
                        },
                    }),
                })

                const data = await res.json()
                await console.log(data)
                setMessages((prev) => [
                    ...prev,
                    { from: 'assistant', text: data.answer || 'No response.' },
                ])
            } else {
                console.log('THERE IS NO ACCOUNT')
                const res = await fetch('http://localhost:8000/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: question,
                    }),
                })

                const data = await res.json()
                await console.log(data)
                setMessages((prev) => [
                    ...prev,
                    { from: 'assistant', text: data.answer || 'No response.' },
                ])
            }
        } catch (err) {
            console.log(err)
            setMessages((prev) => [
                ...prev,
                {
                    from: 'assistant',
                    text: 'Error: Unable to contact assistant.',
                },
            ])
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                className="fixed bottom-8 right-8 p-4 rounded-full bg-gray-200/80 dark:bg-slate-700/80 backdrop-blur-md text-gray-700 dark:text-gray-300 shadow-lg hover:bg-blue-900 hover:text-blue-200 transition-colors duration-200 z-50"
                onClick={() => setOpen(!open)}
            >
                {open ? <FaTimes /> : <FaComments />}
            </button>

            {/* Chat popup */}
            {open && (
                <div className="fixed bottom-20 right-8 w-80 h-96 bg-gray-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl shadow-lg flex flex-col overflow-hidden border border-blue-100 dark:border-blue-950 z-50">
                    <div className="flex-1 p-4 overflow-y-auto space-y-3">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`p-3 rounded-xl max-w-[80%] backdrop-blur-sm ${
                                    m.from === 'user'
                                        ? 'bg-blue-900/90 text-blue-100 self-end ml-auto'
                                        : 'bg-gray-200/90 dark:bg-slate-700/90 text-gray-900 dark:text-gray-100 self-start'
                                }`}
                            >
                                {m.text}
                            </div>
                        ))}
                        {loading && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Thinking...
                            </p>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-blue-100 dark:border-blue-950 flex gap-2 bg-gray-100/50 dark:bg-slate-800/50 backdrop-blur-sm">
                        <input
                            type="text"
                            className="flex-1 rounded-xl px-4 py-2 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            placeholder={
                                isLoggedIn
                                    ? 'Ask about your account...'
                                    : 'Ask about the protocol...'
                            }
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button
                            className="px-4 py-2 bg-gray-200/80 dark:bg-slate-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-xl hover:bg-blue-900 hover:text-blue-200 transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleSend}
                            disabled={loading}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
