"use client";

import { useState, useRef, TouchEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
    images: string[];
    title: string;
}

export function ImageCarousel({ images, title }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef<number>(0);
    const touchEndX = useRef<number>(0);

    if (!images || images.length === 0) {
        return null;
    }

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const goToImage = (index: number) => {
        setCurrentIndex(index);
    };

    const handleTouchStart = (e: TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        const swipeThreshold = 50;
        const diff = touchStartX.current - touchEndX.current;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swiped left - go to next
                goToNext();
            } else {
                // Swiped right - go to previous
                goToPrevious();
            }
        }
    };

    return (
        <div className="bg-white/5 p-4 rounded-2xl shadow-sm border border-terracotta/10">
            {/* Main Image */}
            <div className="relative aspect-square bg-black/20 rounded-xl overflow-hidden mb-4 group">
                <img
                    src={images[currentIndex]}
                    alt={`${title} - Image ${currentIndex + 1}`}
                    className="w-full h-full object-contain"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                />

                {/* Arrow Navigation - Desktop Only */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 hidden md:block"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 hidden md:block"
                            aria-label="Next image"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </>
                )}

                {/* Indicator Dots */}
                {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToImage(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                        ? 'bg-terracotta w-6'
                                        : 'bg-white/50 hover:bg-white/70'
                                    }`}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Thumbnail Grid */}
            {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                    {images.map((url: string, i: number) => (
                        <button
                            key={i}
                            onClick={() => goToImage(i)}
                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${i === currentIndex
                                    ? 'border-terracotta'
                                    : 'border-terracotta/10 hover:border-terracotta/50'
                                }`}
                        >
                            <img src={url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
