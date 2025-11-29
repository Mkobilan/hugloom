"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TutorialModal } from '@/components/tutorial/TutorialModal';
import { usePathname } from 'next/navigation';

interface TutorialContextType {
    startTutorial: () => void;
    resetTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);
    const supabase = createClient();
    const pathname = usePathname();

    useEffect(() => {
        checkTutorialStatus();
    }, [pathname]); // Check on route change too, mainly for Home page trigger

    const checkTutorialStatus = async () => {
        // Only trigger automatically on the home page
        if (pathname !== '/') {
            setHasChecked(true);
            return;
        }

        if (hasChecked) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('tutorial_completed')
                .eq('id', user.id)
                .single();

            if (profile && !profile.tutorial_completed) {
                setIsOpen(true);
            }
        } catch (error) {
            console.error('Error checking tutorial status:', error);
        } finally {
            setHasChecked(true);
        }
    };

    const startTutorial = () => {
        setIsOpen(true);
    };

    const resetTutorial = async () => {
        // Optional: Reset in DB if we want "Start Over" to mean "Treat me like new"
        // For now, just opening the modal is enough for "Take Tour"
        setIsOpen(true);
    };

    const handleClose = async () => {
        setIsOpen(false);
        // If they close it (decline), we mark it as completed so it doesn't pester them?
        // The requirement says: "if no a modal message tells them if they ever do want to take the tutorial they can find it in the settings menu."
        // So yes, we should mark it as completed/seen.
        await markAsCompleted();
    };

    const handleComplete = async () => {
        setIsOpen(false);
        await markAsCompleted();
    };

    const markAsCompleted = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('profiles')
                .update({ tutorial_completed: true })
                .eq('id', user.id);
        } catch (error) {
            console.error('Error marking tutorial as completed:', error);
        }
    };

    return (
        <TutorialContext.Provider value={{ startTutorial, resetTutorial }}>
            {children}
            <TutorialModal
                isOpen={isOpen}
                onClose={handleClose}
                onComplete={handleComplete}
            />
        </TutorialContext.Provider>
    );
}

export function useTutorial() {
    const context = useContext(TutorialContext);
    if (context === undefined) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
}
