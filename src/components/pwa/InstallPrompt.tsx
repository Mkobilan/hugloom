"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already in standalone mode
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsStandalone(true);
        }

        // Check if iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));

        // Listen for beforeinstallprompt event (Android/Chrome)
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
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setDeferredPrompt(null);
            }
        } else if (isIOS) {
            // For iOS, we can't programmatically trigger install, but we can show instructions
            alert("To install this app on iOS, tap the Share button and select 'Add to Home Screen'.");
        }
    };

    if (isStandalone) {
        return null;
    }

    // Only show if we have a prompt (Android) or it's iOS (manual instructions)
    if (!deferredPrompt && !isIOS) {
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
