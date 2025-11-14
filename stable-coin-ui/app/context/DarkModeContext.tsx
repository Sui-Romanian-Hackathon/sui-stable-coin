'use client'

import { createContext, ReactNode, useContext, useState } from 'react'

interface DarkModeContextType {
    darkMode: boolean
    toggleDarkMode: () => void
}

export const DarkModeContext = createContext<DarkModeContextType | undefined>(
    undefined
)

export default function DarkModeProvider({
    children,
}: {
    children: ReactNode
}) {
    const [darkMode, setDarkMode] = useState(true)

    const toggleDarkMode = () => {
        setDarkMode(!darkMode)
    }

    return (
        <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
            {children}
        </DarkModeContext.Provider>
    )
}

export const useDarkMode = () => {
    const context = useContext(DarkModeContext)
    if (!context) {
        throw new Error('useDarkMode must be used within a DarkModeProvider')
    }
    return context
}
