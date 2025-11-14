'use client'

import { useEffect, useRef, useState } from 'react'
import { FaComments, FaTimes } from 'react-icons/fa'

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

            const res = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: question,
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
                className="fixed bottom-8 right-8 p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition"
                onClick={() => setOpen(!open)}
            >
                {open ? <FaTimes /> : <FaComments />}
            </button>

            {/* Chat popup */}
            {open && (
                <div className="fixed bottom-20 right-8 w-80 h-96 bg-white dark:bg-neutral-900 border rounded-lg shadow-lg flex flex-col overflow-hidden">
                    <div className="flex-1 p-4 overflow-y-auto space-y-2">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`p-2 rounded max-w-[80%] ${
                                    m.from === 'user'
                                        ? 'bg-blue-100 text-blue-900 self-end ml-auto'
                                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 self-start'
                                }`}
                            >
                                {m.text}
                            </div>
                        ))}
                        {loading && (
                            <p className="text-sm text-gray-400">Thinking...</p>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-2 border-t flex gap-2 bg-gray-50 dark:bg-neutral-800">
                        <input
                            type="text"
                            className="flex-1 border rounded px-2 py-1 focus:outline-none focus:ring dark:bg-neutral-700 dark:text-white"
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
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
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
