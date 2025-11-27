"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type FontSize = "small" | "medium" | "large" | "xl";

interface AppearanceContextType {
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
    const [fontSize, setFontSize] = useState<FontSize>("medium");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load from localStorage
        const savedFontSize = localStorage.getItem("hugloom-font-size") as FontSize;

        if (savedFontSize) setFontSize(savedFontSize);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Apply font size
        document.documentElement.setAttribute("data-font-size", fontSize);
        localStorage.setItem("hugloom-font-size", fontSize);

    }, [fontSize, mounted]);

    return (
        <AppearanceContext.Provider value={{ fontSize, setFontSize }}>
            <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
                {children}
            </NextThemesProvider>
        </AppearanceContext.Provider>
    );
}

export function useAppearance() {
    const context = useContext(AppearanceContext);
    if (context === undefined) {
        throw new Error("useAppearance must be used within an AppearanceProvider");
    }
    return context;
}
