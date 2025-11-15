'use client'

import { useState } from 'react'

interface FloatingElement {
    id: number
    x: number
    y: number
    delay: number
    duration: number
    type: 'code' | 'shape' | 'keyword'
    content?: string
}

// Move keywords and concepts that highlight simplicity
const moveKeywords = [
    'move',
    'struct',
    'public entry',
    'sui::coin',
    'transfer',
    '&mut',
    'object',
    'has key',
    'copy, drop',
]

const codeSnippets = [
    'fun mint()',
    'struct DSC',
    'public fun',
    'borrow()',
    'collateral',
    'liquidate',
    'use sui::',
]

// Generate elements once to avoid hydration mismatch
const generateElements = (): FloatingElement[] => {
    const elements: FloatingElement[] = []
    // Use seeded random for consistent SSR/client rendering
    let seed = 12345
    const seededRandom = () => {
        seed = (seed * 9301 + 49297) % 233280
        return seed / 233280
    }

    for (let i = 0; i < 25; i++) {
        const rand = seededRandom()
        elements.push({
            id: i,
            x: seededRandom() * 100,
            y: seededRandom() * 100,
            delay: seededRandom() * 5,
            duration: 15 + seededRandom() * 20,
            type: rand < 0.4 ? 'keyword' : rand < 0.7 ? 'code' : 'shape',
            content:
                rand < 0.4
                    ? moveKeywords[Math.floor(seededRandom() * moveKeywords.length)]
                    : rand < 0.7
                      ? codeSnippets[Math.floor(seededRandom() * codeSnippets.length)]
                      : undefined,
        })
    }
    return elements
}

export function SuiAnimatedBackground() {
    const [elements] = useState<FloatingElement[]>(generateElements)

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-30">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 dark:from-blue-400/20 dark:to-cyan-400/20" />

            {/* Floating elements */}
            {elements.map((el) => (
                <div
                    key={el.id}
                    className="absolute"
                    style={{
                        left: `${el.x}%`,
                        top: `${el.y}%`,
                        animation: `float ${el.duration}s ease-in-out ${el.delay}s infinite alternate`,
                    }}
                >
                    {el.type === 'keyword' && (
                        <div className="text-blue-600 dark:text-blue-300 font-mono text-sm md:text-base font-semibold whitespace-nowrap drop-shadow-lg">
                            {el.content}
                        </div>
                    )}
                    {el.type === 'code' && (
                        <div className="text-cyan-600 dark:text-cyan-300 font-mono text-xs md:text-sm opacity-70 whitespace-nowrap drop-shadow-lg">
                            {el.content}
                        </div>
                    )}
                    {el.type === 'shape' && (
                        <div
                            className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-blue-500 dark:border-blue-300 shadow-lg shadow-blue-500/50 dark:shadow-blue-300/50"
                            style={{
                                animation: `pulse ${el.duration * 0.5}s ease-in-out ${el.delay}s infinite`,
                            }}
                        />
                    )}
                </div>
            ))}

            {/* Flowing lines representing object flow */}
            <svg
                className="absolute inset-0 w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient
                        id="lineGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop
                            offset="0%"
                            className="text-blue-500"
                            stopColor="currentColor"
                            stopOpacity="0.2"
                        />
                        <stop
                            offset="100%"
                            className="text-cyan-500"
                            stopColor="currentColor"
                            stopOpacity="0.1"
                        />
                    </linearGradient>
                </defs>
                <path
                    d="M0,100 Q250,200 500,100 T1000,100"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    fill="none"
                    className="animate-dash"
                />
                <path
                    d="M0,300 Q250,400 500,300 T1000,300"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    fill="none"
                    className="animate-dash"
                    style={{ animationDelay: '2s' }}
                />
                <path
                    d="M0,500 Q250,600 500,500 T1000,500"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    fill="none"
                    className="animate-dash"
                    style={{ animationDelay: '4s' }}
                />
            </svg>

            <style jsx>{`
                @keyframes float {
                    0% {
                        transform: translate(0, 0) rotate(0deg);
                    }
                    100% {
                        transform: translate(30px, 30px) rotate(180deg);
                    }
                }

                @keyframes pulse {
                    0%,
                    100% {
                        transform: scale(1);
                        opacity: 0.5;
                    }
                    50% {
                        transform: scale(1.5);
                        opacity: 1;
                    }
                }

                @keyframes dash {
                    0% {
                        stroke-dashoffset: 1000;
                    }
                    100% {
                        stroke-dashoffset: 0;
                    }
                }

                .animate-dash {
                    stroke-dasharray: 10 5;
                    animation: dash 20s linear infinite;
                }
            `}</style>
        </div>
    )
}
