"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoodCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type BreathingPhase = 'idle' | 'inhale' | 'hold-in' | 'exhale' | 'hold-out';

export const MoodCheckModal = ({ isOpen, onClose }: MoodCheckModalProps) => {
    const [phase, setPhase] = useState<BreathingPhase>('idle');
    const [text, setText] = useState('Take a moment for yourself');
    const [isActive, setIsActive] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setPhase('idle');
            setText('Take a moment for yourself');
            setIsActive(false);
        } else {
            setIsActive(false);
        }
    }, [isOpen]);

    // Breathing cycle logic
    useEffect(() => {
        if (!isActive) return;

        let timeoutId: ReturnType<typeof setTimeout>;

        const runCycle = () => {
            // Inhale (4s)
            setPhase('inhale');
            setText('Breathe In...');

            timeoutId = setTimeout(() => {
                // Hold (1s)
                setPhase('hold-in');
                setText('Hold');

                timeoutId = setTimeout(() => {
                    // Exhale (4s)
                    setPhase('exhale');
                    setText('Breathe Out...');

                    timeoutId = setTimeout(() => {
                        // Hold (1s)
                        setPhase('hold-out');
                        setText('Hold');

                        timeoutId = setTimeout(() => {
                            runCycle(); // Loop
                        }, 1000);
                    }, 4000);
                }, 1000);
            }, 4000);
        };

        // Start the cycle immediately
        runCycle();

        return () => clearTimeout(timeoutId);
    }, [isActive]);

    if (!isOpen) return null;

    const handleStart = () => {
        setIsActive(true);
    };

    const handleStop = () => {
        setIsActive(false);
        setPhase('idle');
        setText('Good job taking a moment.');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 animate-in fade-in duration-300">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
                <X className="w-8 h-8" />
            </button>

            <div className="flex flex-col items-center justify-center w-full max-w-md p-8 text-center space-y-12">

                {/* Main Text */}
                <h2 className={cn(
                    "text-3xl md:text-4xl font-medium text-white/90 tracking-wide transition-all duration-500 min-h-[3rem]",
                    phase === 'inhale' && "scale-110 text-white",
                    phase === 'exhale' && "scale-95 text-white/80"
                )}>
                    {text}
                </h2>

                {/* Breathing Circle */}
                <div className="relative flex items-center justify-center w-64 h-64">
                    {/* Outer Glow */}
                    <div className={cn(
                        "absolute inset-0 rounded-full bg-purple-500/20 blur-3xl transition-all duration-[4000ms] ease-in-out",
                        phase === 'inhale' && "scale-150 opacity-50",
                        phase === 'hold-in' && "scale-150 opacity-50",
                        phase === 'exhale' && "scale-75 opacity-20",
                        phase === 'hold-out' && "scale-75 opacity-20",
                        phase === 'idle' && "scale-100 opacity-20"
                    )} />

                    {/* Main Circle */}
                    <div className={cn(
                        "w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 shadow-[0_0_50px_rgba(168,85,247,0.4)] transition-all duration-[4000ms] ease-in-out",
                        phase === 'inhale' && "scale-[2.5] shadow-[0_0_100px_rgba(168,85,247,0.6)]",
                        phase === 'hold-in' && "scale-[2.5]",
                        phase === 'exhale' && "scale-100 shadow-[0_0_30px_rgba(168,85,247,0.2)]",
                        phase === 'hold-out' && "scale-100",
                        phase === 'idle' && "scale-100 animate-pulse"
                    )} />
                </div>

                {/* Controls */}
                <div className="pt-8">
                    {!isActive ? (
                        <button
                            onClick={handleStart}
                            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-all hover:scale-105 active:scale-95 backdrop-blur-sm border border-white/10"
                        >
                            {text === 'Good job taking a moment.' ? 'Breathe Again' : 'Start Breathing'}
                        </button>
                    ) : (
                        <button
                            onClick={handleStop}
                            className="px-8 py-3 text-white/50 hover:text-white text-sm font-medium transition-colors"
                        >
                            Stop Exercise
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
