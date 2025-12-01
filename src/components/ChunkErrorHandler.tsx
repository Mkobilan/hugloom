"use client";

import { useEffect } from 'react';

export function ChunkErrorHandler() {
    useEffect(() => {
        // Handle chunk loading errors by reloading the page
        const handleError = (event: ErrorEvent) => {
            if (
                event.message?.includes('Failed to load chunk') ||
                event.message?.includes('Loading chunk') ||
                event.message?.includes('ChunkLoadError')
            ) {
                console.log('Chunk load error detected, reloading page...');
                window.location.reload();
            }
        };

        // Handle unhandled promise rejections from dynamic imports
        const handleRejection = (event: PromiseRejectionEvent) => {
            if (
                event.reason?.message?.includes('Failed to load chunk') ||
                event.reason?.message?.includes('Loading chunk') ||
                event.reason?.name === 'ChunkLoadError'
            ) {
                console.log('Chunk load error detected in promise, reloading page...');
                event.preventDefault();
                window.location.reload();
            }
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, []);

    return null;
}
