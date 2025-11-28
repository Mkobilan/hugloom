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

    const handleGenericInstall = () => {
        if (deferredPrompt) {
            handleInstallClick();
        } else if (isIOS) {
            handleInstallClick();
        } else {
            // Generic instructions for browsers that don't support beforeinstallprompt
            alert("To install this app:\n\n• On Android Chrome: Look for 'Install App' or 'Add to Home Screen' in the browser menu\n• On iOS Safari: Tap the Share button and select 'Add to Home Screen'\n• On Desktop: Look for the install icon in your browser's address bar");
        }
    };

    return (
        <div className="w-full flex justify-center my-4">
            <button
                onClick={handleGenericInstall}
                className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
            >
                <Download className="w-4 h-4" />
                <span>Download App</span>
            </button>
        </div>
    );
}
