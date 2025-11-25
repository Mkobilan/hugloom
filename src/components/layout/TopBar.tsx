"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export const TopBar = () => {
    const [username, setUsername] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username, full_name')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    setUsername(profile.username || profile.full_name || 'there');
                } else {
                    setUsername('there');
                }
            }
            setLoading(false);
        };

        loadProfile();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-background px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-terracotta/10 rounded-full">
                    <Image src="/hugloom_logo.png" alt="HugLoom Logo" width={24} height={24} className="object-contain" />
                </div>
                <div>
                    <h1 className="font-heading font-bold text-lg text-foreground leading-tight">
                        HugLoom
                    </h1>
                    <p className="text-xs text-muted-foreground font-medium">
                        {loading ? 'Loading...' : `${getGreeting()}, ${username} ☕`}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {/* Placeholder for notifications or profile */}
                <div className="w-8 h-8 rounded-full bg-slate-blue/20 border border-slate-blue/40" />
            </div>
        </header>
    );
};
