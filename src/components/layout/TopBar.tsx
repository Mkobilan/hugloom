"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeartHandshake } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export const TopBar = () => {
    const [username, setUsername] = useState<string>('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username, full_name, avatar_url')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    setUsername(profile.username || profile.full_name || 'there');
                    setAvatarUrl(profile.avatar_url);
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
        <header className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10 border-b border-white/20 mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-terracotta/20">
                    <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="font-heading font-bold text-xl text-foreground tracking-tight">
                        HugLoom
                    </h1>
                    <p className="text-xs text-muted-foreground font-medium">
                        {loading ? 'Loading...' : `${getGreeting()}, ${username} ☕`}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {/* Profile Link */}
                <Link href={username && username !== 'there' ? `/u/${username}` : '/profile'}>
                    <div className="w-10 h-10 rounded-full bg-slate-blue/20 border border-slate-blue/40 overflow-hidden cursor-pointer hover:ring-2 hover:ring-slate-blue/50 transition-all">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={username}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-blue font-bold">
                                {username?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                </Link>
            </div>
        </header>
    );
};
