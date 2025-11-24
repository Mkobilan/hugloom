import React from 'react';
import { Flame } from 'lucide-react';

export const TopBar = () => {
    return (
        <header className="sticky top-0 z-50 w-full bg-cream/80 backdrop-blur-md border-b border-terracotta/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-terracotta/10 rounded-full">
                    <Flame className="w-6 h-6 text-terracotta fill-terracotta/20 animate-pulse" />
                </div>
                <div>
                    <h1 className="font-heading font-bold text-lg text-foreground leading-tight">
                        HugLoom
                    </h1>
                    <p className="text-xs text-muted-foreground font-medium">
                        Good morning, Sarah ☕
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {/* Placeholder for notifications or profile */}
                <div className="w-8 h-8 rounded-full bg-sage/20 border border-sage/30" />
            </div>
        </header>
    );
};
