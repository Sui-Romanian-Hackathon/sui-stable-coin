'use client'

import Navbar from '@/app/components/Navbar'
import { useDarkMode } from '@/app/context/DarkModeContext'
import { ChatPopup } from '@/app/components/ChatPopup'
import { useCurrentAccount } from '@mysten/dapp-kit'
import Wallet from '@/app/components/wallet/Wallet'
import { SuiAnimatedBackground } from '@/app/components/SuiAnimatedBackground'

export default function Home() {
    const { darkMode } = useDarkMode()
    const account = useCurrentAccount()

    return (
        <div
            className={`${darkMode && 'dark'} min-h-screen flex-col flex  bg-gray-50 dark:bg-gray-950 text-black dark:text-white transition-all duration-300`}
        >
            <Navbar />
            {!account ? (
                <>
                    <div className="relative px-5 md:px-30 flex-1 flex items-center justify-center overflow-hidden">
                        <SuiAnimatedBackground />
                        <div className="max-w-4xl text-center space-y-8 z-10 relative py-20">
                            <div className="inline-block px-4 py-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-full border border-blue-500/20 mb-4">
                                <span className="text-blue-600 dark:text-blue-400 font-mono text-sm">
                                    Built on Sui • Powered by Move
                                </span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                                Decentralized Stablecoin
                            </h1>

                            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                Experience the simplicity of DeFi on Sui. Built with Move's object-centric model, our protocol delivers what takes hundreds of lines on other chains in just a few elegant functions.
                            </p>

                            <div className="grid md:grid-cols-3 gap-6 pt-8">
                                <div className="p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur rounded-xl border border-gray-200 dark:border-slate-700">
                                    <div className="text-3xl mb-2">⚡</div>
                                    <h3 className="font-semibold text-lg mb-2">Simple by Design</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Move's native object model eliminates complexity. No mappings, no complex state management.
                                    </p>
                                </div>

                                <div className="p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur rounded-xl border border-gray-200 dark:border-slate-700">
                                    <div className="text-3xl mb-2">🔒</div>
                                    <h3 className="font-semibold text-lg mb-2">Secure & Auditable</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Move's resource types and ownership system prevent common vulnerabilities at compile time.
                                    </p>
                                </div>

                                <div className="p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur rounded-xl border border-gray-200 dark:border-slate-700">
                                    <div className="text-3xl mb-2">🚀</div>
                                    <h3 className="font-semibold text-lg mb-2">Blazing Fast</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Sui's parallel execution means instant transactions without sacrificing decentralization.
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-500 pt-4 font-mono">
                                Connect your wallet to start borrowing, depositing, and managing collateral
                            </p>
                        </div>
                    </div>
                    <ChatPopup isLoggedIn={false} />
                </>
            ) : (
                <Wallet />
            )}
        </div>
    )
}
