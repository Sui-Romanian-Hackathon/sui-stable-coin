'use client'

import Navbar from '@/app/components/Navbar'
import { useDarkMode } from '@/app/context/DarkModeContext'
import { useState } from 'react'

export default function DocsPage() {
    const { darkMode } = useDarkMode()
    const [activeSection, setActiveSection] = useState('overview')

    const sections = [
        { id: 'overview', title: 'Overview' },
        { id: 'parameters', title: 'Key Parameters' },
        { id: 'concepts', title: 'Core Concepts' },
        { id: 'management', title: 'Position Management' },
        { id: 'formulas', title: 'Formulas' },
        { id: 'examples', title: 'Examples' },
    ]

    return (
        <div
            className={`${darkMode && 'dark'} min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}
        >
            <Navbar />
            <div className="pt-16 md:pt-20 px-5 md:px-10 lg:px-20 pb-20">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-12 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                            Protocol Documentation
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Complete guide to the Sui Stablecoin Protocol
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-4 gap-8">
                        {/* Sidebar Navigation */}
                        <nav className="lg:col-span-1">
                            <div className="sticky top-20 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                                <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Contents
                                </h2>
                                <ul className="space-y-2">
                                    {sections.map((section) => (
                                        <li key={section.id}>
                                            <button
                                                onClick={() =>
                                                    setActiveSection(section.id)
                                                }
                                                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                                    activeSection === section.id
                                                        ? 'bg-blue-500 text-white'
                                                        : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                                                }`}
                                            >
                                                {section.title}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </nav>

                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl p-6 md:p-8 border border-gray-200 dark:border-slate-700">
                                {activeSection === 'overview' && (
                                    <OverviewSection />
                                )}
                                {activeSection === 'parameters' && (
                                    <ParametersSection />
                                )}
                                {activeSection === 'concepts' && (
                                    <ConceptsSection />
                                )}
                                {activeSection === 'management' && (
                                    <ManagementSection />
                                )}
                                {activeSection === 'formulas' && (
                                    <FormulasSection />
                                )}
                                {activeSection === 'examples' && (
                                    <ExamplesSection />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function OverviewSection() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-4">Protocol Overview</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                The Sui Stablecoin Protocol is a decentralized lending platform
                built on the Sui blockchain using Move. It enables users to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Deposit collateral (SUI, wETH, wBTC, etc.)</li>
                <li>Borrow stablecoins against their collateral</li>
                <li>Maintain positions with health factors</li>
                <li>Avoid liquidation by managing their positions</li>
            </ul>

            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-lg mb-2 text-blue-900 dark:text-blue-300">
                    Why Sui?
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                    Built with Move's object-centric model, this protocol
                    delivers what takes hundreds of lines on other chains in
                    just a few elegant functions. Move's resource types and
                    ownership system prevent common vulnerabilities at compile
                    time.
                </p>
            </div>
        </div>
    )
}

function ParametersSection() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-4">Key Parameters</h2>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">
                        Liquidation Threshold
                    </h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        80%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Users can borrow up to 80% of their collateral value
                    </p>
                </div>

                <div className="p-4 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">
                        Liquidation Penalty
                    </h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        10%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Liquidators receive 10% of the collateral as reward
                    </p>
                </div>

                <div className="p-4 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">
                        Minimum Health Factor
                    </h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        1.0
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Positions with HF &lt; 1.0 are eligible for liquidation
                    </p>
                </div>

                <div className="p-4 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">
                        Interest Rates
                    </h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        2-15% APY
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Based on protocol utilization
                    </p>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="font-semibold text-xl mb-4">
                    Supported Collateral
                </h3>
                <div className="space-y-3">
                    <div className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">SUI</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                75% Collateral Factor
                            </span>
                        </div>
                    </div>
                    <div className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">wETH</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                80% Collateral Factor
                            </span>
                        </div>
                    </div>
                    <div className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">wBTC</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                75% Collateral Factor
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ConceptsSection() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-4">Core Concepts</h2>

            <div>
                <h3 className="text-2xl font-semibold mb-3">Health Factor</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                    The health factor measures position safety and determines
                    liquidation risk.
                </p>

                <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg font-mono text-sm mb-4">
                    HF = (Collateral Value × Liquidation Threshold) / Borrowed
                    Amount
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>
                            <strong>HF &gt; 2.0:</strong> Very safe position
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>
                            <strong>HF 1.5-2.0:</strong> Safe position
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>
                            <strong>HF 1.2-1.5:</strong> Moderate risk
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span>
                            <strong>HF 1.0-1.2:</strong> High risk
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>
                            <strong>HF &lt; 1.0:</strong> Will be liquidated
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-2">Example Calculation</h4>
                <ul className="space-y-1 text-sm">
                    <li>• Collateral: $10,000 SUI</li>
                    <li>• Borrowed: $6,000 stablecoins</li>
                    <li>• Liquidation Threshold: 80%</li>
                    <li className="font-semibold mt-2">
                        • HF = ($10,000 × 0.80) / $6,000 = 1.33
                    </li>
                </ul>
            </div>

            <div className="mt-8">
                <h3 className="text-2xl font-semibold mb-3">
                    Liquidation Price
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                    The collateral price at which liquidation occurs:
                </p>
                <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg font-mono text-sm">
                    Liquidation Price = (Borrowed Amount / Collateral Amount) /
                    Liquidation Threshold
                </div>
            </div>
        </div>
    )
}

function ManagementSection() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-4">Position Management</h2>

            <div>
                <h3 className="text-2xl font-semibold mb-3">
                    How to Increase Health Factor
                </h3>

                <div className="space-y-4">
                    <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <h4 className="font-semibold mb-2">
                            Option 1: Deposit More Collateral
                        </h4>
                        <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded font-mono text-xs mb-2">
                            Additional Collateral = (Borrowed Amount × Target HF
                            / Liquidation Threshold) - Current Collateral Value
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Example: To go from HF 1.33 to 1.5 with $6,000
                            borrowed and $10,000 collateral, you need to deposit
                            an additional $1,250.
                        </p>
                    </div>

                    <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 rounded">
                        <h4 className="font-semibold mb-2">
                            Option 2: Repay Debt
                        </h4>
                        <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded font-mono text-xs mb-2">
                            Amount to Repay = Current Debt - (Current Collateral
                            Value × Liquidation Threshold / Target HF)
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Example: Same scenario, you only need to repay $667
                            to reach HF 1.5 - more capital efficient!
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-2xl font-semibold mb-3">
                    Safety Guidelines
                </h3>
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">✅</span>
                        <div>
                            <strong>Maintain HF &gt; 1.5:</strong> Provides
                            buffer against market volatility
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-xl">📊</span>
                        <div>
                            <strong>Monitor liquidation price:</strong> Set
                            alerts when collateral price approaches this level
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-xl">🔔</span>
                        <div>
                            <strong>Keep reserves:</strong> Always have funds
                            available to add collateral in emergencies
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <strong>Watch utilization:</strong> High protocol
                            utilization can spike interest rates
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FormulasSection() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-4">Quick Reference Formulas</h2>

            <div className="space-y-4">
                <div className="p-4 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
                    <h3 className="font-semibold mb-2">Health Factor</h3>
                    <code className="block p-3 bg-slate-900 text-green-400 rounded text-sm">
                        HF = (Collateral Value × Liquidation Threshold) /
                        Borrowed Amount
                    </code>
                </div>

                <div className="p-4 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
                    <h3 className="font-semibold mb-2">
                        Maximum Borrow (for target HF)
                    </h3>
                    <code className="block p-3 bg-slate-900 text-green-400 rounded text-sm">
                        Max Borrow = (Collateral Value × Liquidation Threshold)
                        / Target HF
                    </code>
                </div>

                <div className="p-4 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
                    <h3 className="font-semibold mb-2">
                        Additional Collateral Needed
                    </h3>
                    <code className="block p-3 bg-slate-900 text-green-400 rounded text-sm">
                        Additional Collateral = (Borrowed Amount × Target HF /
                        Liquidation Threshold) - Current Collateral Value
                    </code>
                </div>

                <div className="p-4 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
                    <h3 className="font-semibold mb-2">Debt to Repay</h3>
                    <code className="block p-3 bg-slate-900 text-green-400 rounded text-sm">
                        Amount to Repay = Current Debt - (Current Collateral
                        Value × Liquidation Threshold / Target HF)
                    </code>
                </div>

                <div className="p-4 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
                    <h3 className="font-semibold mb-2">Liquidation Price</h3>
                    <code className="block p-3 bg-slate-900 text-green-400 rounded text-sm">
                        Liquidation Price = (Borrowed Amount / Collateral
                        Amount) / Liquidation Threshold
                    </code>
                </div>

                <div className="p-4 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
                    <h3 className="font-semibold mb-2">Available to Borrow</h3>
                    <code className="block p-3 bg-slate-900 text-green-400 rounded text-sm">
                        Available = (Current Collateral Value × Liquidation
                        Threshold / Target HF) - Current Debt
                    </code>
                </div>
            </div>
        </div>
    )
}

function ExamplesSection() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-4">Real-World Examples</h2>

            <div className="space-y-6">
                <div className="p-6 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <h3 className="text-xl font-semibold mb-3">
                        Example 1: New User - First Deposit
                    </h3>
                    <div className="space-y-2 text-sm">
                        <p>
                            <strong>Situation:</strong> User deposits 1,000 SUI
                            at $10 = $10,000 collateral value
                        </p>
                        <p>
                            <strong>Question:</strong> How much can I safely
                            borrow?
                        </p>
                        <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded">
                            <p className="font-semibold mb-2">Answer:</p>
                            <p>
                                For HF = 1.5: Max Borrow = ($10,000 × 0.80) /
                                1.5 = $5,333
                            </p>
                            <p>
                                For HF = 2.0: Max Borrow = ($10,000 × 0.80) /
                                2.0 = $4,000
                            </p>
                            <p className="mt-2 text-green-600 dark:text-green-400">
                                Recommendation: Start with $4,000-5,000
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <h3 className="text-xl font-semibold mb-3">
                        Example 2: Increasing Health Factor
                    </h3>
                    <div className="space-y-2 text-sm">
                        <p>
                            <strong>Situation:</strong> Collateral $10,000,
                            Borrowed $7,000, Current HF: 1.14
                        </p>
                        <p>
                            <strong>Question:</strong> What should I do to reach
                            HF of 1.5?
                        </p>
                        <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded">
                            <p className="font-semibold mb-2">Answer:</p>
                            <p>
                                Option 1 - Deposit: Additional $3,125
                                collateral
                            </p>
                            <p>Option 2 - Repay: $1,667 debt</p>
                            <p className="mt-2 text-green-600 dark:text-green-400">
                                Recommendation: Repaying $1,667 is more capital
                                efficient
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <h3 className="text-xl font-semibold mb-3">
                        Example 3: Liquidation Avoidance
                    </h3>
                    <div className="space-y-2 text-sm">
                        <p>
                            <strong>Situation:</strong> Collateral $10,000,
                            Borrowed $7,500, Current HF: 1.07 🚨
                        </p>
                        <p>
                            <strong>Question:</strong> How do I avoid
                            liquidation immediately?
                        </p>
                        <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded">
                            <p className="font-semibold mb-2">
                                Urgent Actions:
                            </p>
                            <p>To reach HF of 1.5:</p>
                            <p>• Repay $2,167 immediately, OR</p>
                            <p>• Deposit $3,906 more collateral</p>
                            <p className="mt-2 text-red-600 dark:text-red-400 font-semibold">
                                ⚠️ Recommended: Repay at least $2,167 right now
                                to move to safety
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <h3 className="text-xl font-semibold mb-3">
                        Example 4: Maximizing Borrowing Power
                    </h3>
                    <div className="space-y-2 text-sm">
                        <p>
                            <strong>Situation:</strong> Collateral $20,000,
                            Current debt $0
                        </p>
                        <p>
                            <strong>Question:</strong> What's the maximum I can
                            borrow while staying safe?
                        </p>
                        <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded">
                            <p className="font-semibold mb-2">Answer:</p>
                            <p>
                                At HF = 1.5: Max Borrow = ($20,000 × 0.80) / 1.5
                                = $10,667
                            </p>
                            <p>
                                At HF = 2.0: Max Borrow = ($20,000 × 0.80) / 2.0
                                = $8,000
                            </p>
                            <p className="mt-2 text-green-600 dark:text-green-400">
                                Recommendation: Borrow $8,000-9,000 for comfort
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
