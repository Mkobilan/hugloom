"use client";

import React, { useState } from 'react';
import { TopBar } from './TopBar';
import { RightColumnNav } from './RightColumnNav';
import { MoodCheckModal } from './MoodCheckModal';
import { TutorialProvider } from '@/components/providers/TutorialProvider';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
    const [showMoodCheck, setShowMoodCheck] = useState(false);

    return (
        <TutorialProvider>
            <div className="min-h-screen bg-background font-sans text-foreground">
                <TopBar onMoodCheckClick={() => setShowMoodCheck(true)} />
                <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
                    {/* Main Content Area - Centered Feed/Page */}
                    <main className="flex-1 min-w-0 pb-24 lg:pb-6">
                        {children}
                    </main>

                    {/* Right Column Navigation - Hidden on mobile, visible on desktop */}
                    <RightColumnNav onMoodCheckClick={() => setShowMoodCheck(true)} />
                </div>

                <MoodCheckModal
                    isOpen={showMoodCheck}
                    onClose={() => setShowMoodCheck(false)}
                />

                {/* Mobile Bottom Nav - Only visible on small screens if we want to keep it for mobile, 
                    but user asked to remove it. I will remove it for now as per instructions, 
                    but we might need a mobile solution later. 
                    For now, I'll strictly follow "Remove Bottom Navigation" */}
            </div>
        </TutorialProvider>
    );
};
