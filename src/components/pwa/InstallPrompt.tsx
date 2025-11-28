"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Check if already in standalone mode
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsStandalone(true);
            return;
        }

        // Check if mobile device
        const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobile(checkMobile);

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
        if (deferredPrompt) {
            // We have the native prompt - use it
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === "accepted") {
                console.log("User accepted the install prompt");
            }

            setDeferredPrompt(null);
        } else {
            // Fallback: Guide user to browser's install option
            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (isIOS) {
                alert("To install:\n\n1. Tap the Share button (⬆️)\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add'");
            } else {
                alert("To install:\n\n1. Tap the menu (⋮) in the top right\n2. Tap 'Install app' or 'Add to Home screen'\n\nIf you don't see this option, the app may already be installed or your browser doesn't support installation.");
            }
        }
    };

    // Hide if already installed
    if (isStandalone) {
        return null;
    }

    // Show button on mobile devices (even if beforeinstallprompt hasn't fired)
    if (!isMobile && !deferredPrompt) {
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
