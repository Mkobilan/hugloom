"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already in standalone mode
        if (window.matchMedia("(display-mode: standalone)").matches) {
            console.log('App is already in standalone mode');
            setIsStandalone(true);
            return;
        }

        console.log('Waiting for beforeinstallprompt event...');

        // Listen for beforeinstallprompt event (Works on Desktop Chrome/Edge AND Mobile)
        const handleBeforeInstallPrompt = (e: any) => {
            console.log('🎉 beforeinstallprompt event fired!');
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Log if event hasn't fired after 3 seconds
        setTimeout(() => {
            if (!deferredPrompt) {
                console.log('⚠️ beforeinstallprompt has not fired yet. This could mean:');
                console.log('1. Service Worker is still registering');
                console.log('2. PWA criteria not met');
                console.log('3. App already installed');
                console.log('4. Browser has shown prompt recently');
            }
        }, 3000);

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
                alert("To install:\n\n• Desktop: Look for the install icon (⊕) in the address bar\n• Mobile Chrome: Tap menu (⋮) → 'Install app'\n\nIf you don't see this option, the app may already be installed or your browser doesn't support installation.");
            }
        }
    };

    // Hide if already installed
    if (isStandalone) {
        return null;
    }

    // Show button when install prompt is available (works on both desktop and mobile)
    if (!deferredPrompt) {
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
