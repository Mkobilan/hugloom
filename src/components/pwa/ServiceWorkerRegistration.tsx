"use client";

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('✅ Service Worker registered successfully:', registration);
                    console.log('Scope:', registration.scope);

                    // Check if it's installing
                    if (registration.installing) {
                        console.log('Service Worker installing...');
                    } else if (registration.waiting) {
                        console.log('Service Worker waiting...');
                    } else if (registration.active) {
                        console.log('Service Worker active!');
                    }
                })
                .catch((error) => {
                    console.error('❌ Service Worker registration failed:', error);
                });
        } else {
            console.log('Service Workers not supported in this browser');
        }
    }, []);

    return null;
}
