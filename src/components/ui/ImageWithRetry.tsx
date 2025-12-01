"use client";
import { useState, useEffect } from 'react';

interface ImageWithRetryProps {
    src: string;
    alt: string;
    className?: string;
    fallback?: React.ReactNode;
    onClick?: () => void;
}

/**
 * Image component with retry logic to handle QUIC protocol errors
 * Automatically retries failed image loads with cache-busting
 */
export const ImageWithRetry = ({
    src,
    alt,
    className = '',
    fallback,
    onClick
}: ImageWithRetryProps) => {
    const [imageSrc, setImageSrc] = useState(src);
    const [retryCount, setRetryCount] = useState(0);
    const [hasError, setHasError] = useState(false);
    const MAX_RETRIES = 3;

    // Reset state when src changes
    useEffect(() => {
        setImageSrc(src);
        setRetryCount(0);
        setHasError(false);
    }, [src]);

    const handleError = () => {
        if (retryCount < MAX_RETRIES) {
            // Add cache-busting parameter and retry
            const separator = src.includes('?') ? '&' : '?';
            const newSrc = `${src}${separator}retry=${retryCount + 1}&t=${Date.now()}`;

            console.log(`Image load failed, retrying (${retryCount + 1}/${MAX_RETRIES}):`, src);

            // Small delay before retry to avoid hammering the server
            setTimeout(() => {
                setImageSrc(newSrc);
                setRetryCount(prev => prev + 1);
            }, 500 * (retryCount + 1)); // Exponential backoff
        } else {
            console.error('Image failed to load after max retries:', src);
            setHasError(true);
        }
    };

    if (hasError && fallback) {
        return <>{fallback}</>;
    }

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            onError={handleError}
            onClick={onClick}
            loading="eager" // Disable lazy loading to avoid conflicts
        />
    );
};
