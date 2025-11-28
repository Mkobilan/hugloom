"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already in standalone mode
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsStandalone(true);
            return;
        }

        // Listen for beforeinstallprompt event (Android/Chrome/Edge)
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            return;
        }

        // Show the native install prompt
        deferredPrompt.prompt();

        // Wait for the user's response
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            console.log("User accepted the install prompt");
        } else {
            console.log("User dismissed the install prompt");
        }

        // Clear the deferredPrompt so it can only be used once
        setDeferredPrompt(null);
    };

    // Only show the button if:
    // 1. Not already installed (standalone mode)
    // 2. Browser supports install (deferredPrompt is available)
    if (isStandalone || !deferredPrompt) {
        return null;
    }

    return (
        <div className="w-full flex justify-center my-4">
            <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
            >
                <Download className="w-4 h-4" />
                <span>Download App</span>
            </button>
        </div>
    );
}
