"use client";

import { useState, useEffect } from 'react';
import { X, Calendar, Users, MapPin, Heart, ArrowRight, Check, Pill } from 'lucide-react';

interface TutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

export function TutorialModal({ isOpen, onClose, onComplete }: TutorialModalProps) {
    const [step, setStep] = useState(0);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep(0);
            setIsClosing(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setStep(0);
        }, 300);
    };

    const handleNext = () => {
        setStep((prev) => prev + 1);
    };

    const handleComplete = () => {
        setIsClosing(true);
        setTimeout(() => {
            onComplete();
            setStep(0);
        }, 300);
    };

    if (!isOpen) return null;

    const steps = [
        {
            // Step 0: Welcome
            title: "Welcome to Hugloom!",
            content: (
                <div className="space-y-4">
                    <p className="text-white/80">
                        We're so glad you're here! Would you like to take a quick tour to learn about the features that make Hugloom special?
                    </p>
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleNext}
                            className="flex-1 py-3 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 transition-colors shadow-lg shadow-terracotta/20"
                        >
                            Yes, show me around!
                        </button>
                        <button
                            onClick={handleClose}
                            className="flex-1 py-3 bg-[#4A4042] text-white rounded-xl font-medium hover:bg-[#5A5052] transition-colors border border-white/10"
                        >
                            No, maybe later
                        </button>
                    </div>
                    <p className="text-xs text-white/40 text-center mt-4">
                        You can always take the tour later from the Settings menu.
                    </p>
                </div>
            ),
            icon: <Heart className="w-8 h-8 text-terracotta" />,
        },
        {
            // Step 1: Care Tasks
            title: "Care Tasks",
            content: (
                <div className="space-y-4">
                    <p className="text-white/80">
                        Manage your daily routine with <strong>Care Tasks</strong>.
                    </p>
                    <ul className="space-y-2 text-sm text-white/70">
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-terracotta mt-1.5" />
                            <span>Set reminders for medications, appointments, and more.</span>
                        </li>
                    </ul>
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={handleNext}
                            className="px-6 py-2 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 transition-colors flex items-center gap-2"
                        >
                            Next <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ),
            icon: <Pill className="w-8 h-8 text-terracotta" />,
        },
        {
            // Step 2: Calendar
            title: "Calendar",
            content: (
                <div className="space-y-4">
                    <p className="text-white/80">
                        Stay organized with your <strong>Calendar</strong>.
                    </p>
                    <ul className="space-y-2 text-sm text-white/70">
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-terracotta mt-1.5" />
                            <span>View all your tasks and events in one place.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-terracotta mt-1.5" />
                            <span>Edit or delete tasks directly from the Calendar by clicking on a specific day.</span>
                        </li>
                    </ul>
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={handleNext}
                            className="px-6 py-2 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 transition-colors flex items-center gap-2"
                        >
                            Next <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ),
            icon: <Calendar className="w-8 h-8 text-terracotta" />,
        },
        {
            // Step 3: Care Circles
            title: "My Care Circles",
            content: (
                <div className="space-y-4">
                    <p className="text-white/80">
                        Collaborate with family and caregivers in <strong>Care Circles</strong>.
                    </p>
                    <ul className="space-y-2 text-sm text-white/70">
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-terracotta mt-1.5" />
                            <span>Add members to help manage tasks.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-terracotta mt-1.5" />
                            <span>Care Circle tasks are separate and don't interfere with your main calendar.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-terracotta mt-1.5" />
                            <span>Members can edit Circle tasks but <strong>cannot</strong> edit your personal Admin Care Tasks.</span>
                        </li>
                    </ul>
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={handleNext}
                            className="px-6 py-2 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 transition-colors flex items-center gap-2"
                        >
                            Next <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ),
            icon: <Users className="w-8 h-8 text-terracotta" />,
        },
        {
            // Step 4: Local Hugs
            title: "Local Hugs",
            content: (
                <div className="space-y-4">
                    <p className="text-white/80">
                        Connect with your community through <strong>Local Hugs</strong>.
                    </p>
                    <p className="text-sm text-white/70">
                        Need grocery pickup, ride to the doctors office or respite care? Find local volunteers who are ready to offer assistance!
                    </p>
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={handleNext}
                            className="px-6 py-2 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 transition-colors flex items-center gap-2"
                        >
                            Next <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ),
            icon: <MapPin className="w-8 h-8 text-terracotta" />,
        },
        {
            // Step 5: Mood Check
            title: "Mood Check",
            content: (
                <div className="space-y-4">
                    <p className="text-white/80">
                        Need a breather? Try the <strong>Mood Check</strong>!
                    </p>
                    <p className="text-sm text-white/70">
                        Take a moment for yourself with a guided breathing exercise to help you relax and recenter. You can find it at the bottom of the right navigation bar.
                    </p>
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={handleComplete}
                            className="px-6 py-2 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 transition-colors flex items-center gap-2"
                        >
                            Finish Tour <Check className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ),
            icon: <Heart className="w-8 h-8 text-terracotta" />,
        },
    ];

    const currentStep = steps[step];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className={`w-full max-w-md bg-[#3C3434] rounded-3xl shadow-2xl border border-terracotta/20 overflow-hidden transform transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
                    }`}
            >
                {/* Header Image/Icon Area */}
                <div className="bg-[#4A4042] p-8 flex justify-center items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-terracotta/5" />
                    <div className="relative z-10 p-4 bg-[#3C3434] rounded-2xl shadow-lg border border-terracotta/10">
                        {currentStep.icon}
                    </div>

                    {/* Close button (only if not on first step, or maybe allow closing anytime?) */}
                    {step > 0 && (
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-white mb-4 text-center">
                        {currentStep.title}
                    </h2>

                    {currentStep.content}

                    {/* Progress Indicators (skip for welcome step) */}
                    {step > 0 && (
                        <div className="flex justify-center gap-2 mt-8">
                            {steps.slice(1).map((_, index) => (
                                <div
                                    key={index}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${index + 1 === step
                                            ? 'w-6 bg-terracotta'
                                            : index + 1 < step
                                                ? 'w-1.5 bg-terracotta/50'
                                                : 'w-1.5 bg-white/10'
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
