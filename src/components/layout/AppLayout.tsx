import React from 'react';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
            <TopBar />
            <main className="flex-1 pb-24 px-4 py-6 overflow-y-auto">
                {children}
            </main>
            <BottomNav />
        </div>
    );
};
