"use client";

import React from 'react';
import { Link } from 'solito/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    MessageCircle,
    Calendar,
    ShoppingBag,
    User,
    HeartHandshake,
    Smile,
    Settings,
    HelpCircle,
    LogOut,
    MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const NavCard = ({ href, icon: Icon, label, color, subtitle, onClick }: { href: string; icon: any; label: string; color: string; subtitle?: string; onClick?: () => void }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    const content = (
        <div className={cn(
            "p-4 rounded-2xl flex items-center gap-4 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer mb-3 shadow-md border border-white/10",
            color,
            isActive && "ring-2 ring-offset-2 ring-white/50 ring-offset-transparent"
        )}>
            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-bold text-sm">{label}</h3>
                {subtitle && <p className="text-[10px] opacity-80">{subtitle}</p>}
            </div>
        </div>
    );

    if (onClick) {
        return <div onClick={onClick}>{content}</div>;
    }

    return (
        <Link href={href}>
            {content}
        </Link>
    );
};

const SimpleNavItem = ({ href, icon: Icon, label, onClick, className }: { href?: string; icon: any; label: string; onClick?: () => void; className?: string }) => {
    const content = (
        <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-colors cursor-pointer text-muted-foreground hover:text-foreground",
            className
        )}>
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
        </div>
    );

    if (onClick) {
        return <button onClick={onClick} className="w-full text-left">{content}</button>;
    }

    return <Link href={href || '#'}>{content}</Link>;
};

export const RightColumnNav = ({ onMoodCheckClick }: { onMoodCheckClick: () => void }) => {
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <nav className="w-80 h-[calc(100vh-80px)] sticky top-24 hidden lg:flex flex-col bg-white/50 backdrop-blur-sm rounded-3xl p-4 border border-white/20 shadow-xl overflow-y-auto scrollbar-hide">
            <div className="flex-1 space-y-2">
                <NavCard
                    href="/feed"
                    icon={MessageCircle}
                    label="Feed"
                    color="bg-sage text-white hover:bg-sage/90"
                    subtitle="Community updates"
                />
                <NavCard
                    href="/meds"
                    icon={Calendar}
                    label="Care Tasks"
                    color="bg-terracotta text-white hover:bg-terracotta/90"
                    subtitle="Meds & Appointments"
                />
                <NavCard
                    href="/calendar"
                    icon={Calendar}
                    label="Calendar"
                    color="bg-slate-blue text-white hover:bg-slate-blue/90"
                />
                <NavCard
                    href="/messages"
                    icon={MessageCircle}
                    label="Chats"
                    color="bg-mustard text-white hover:bg-mustard/90"
                    subtitle="DMs & Groups"
                />
                <NavCard
                    href="/care-circles"
                    icon={HeartHandshake}
                    label="My Care Circles"
                    color="bg-rose-500 text-white hover:bg-rose-600"
                />
                <NavCard
                    href="/local-hugs"
                    icon={MapPin}
                    label="Local Hugs"
                    color="bg-sky-600 text-white hover:bg-sky-700"
                    subtitle="Local Support & Help"
                />
                <NavCard
                    href="/marketplace"
                    icon={ShoppingBag}
                    label="Marketplace"
                    color="bg-emerald-600 text-white hover:bg-emerald-700"
                />
                <NavCard
                    href="/profile"
                    icon={User}
                    label="My Profile"
                    color="bg-slate-500 text-white hover:bg-slate-600"
                />
                <NavCard
                    href="#"
                    icon={Smile}
                    label="Mood Check"
                    color="bg-purple-500 text-white hover:bg-purple-600"
                    subtitle="Just Breathe"
                    onClick={onMoodCheckClick}
                />
            </div>

            <div className="mt-6 pt-6 border-t border-border/50">
                <NavCard
                    href="/settings"
                    icon={Settings}
                    label="Settings"
                    color="bg-sky-600 text-mustard hover:bg-sky-700"
                />
                <NavCard
                    href="/support"
                    icon={HelpCircle}
                    label="Help & Support"
                    color="bg-slate-blue text-terracotta hover:bg-slate-blue/90"
                />
                <SimpleNavItem
                    href="#"
                    icon={LogOut}
                    label="Log Out"
                    onClick={handleSignOut}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                />
            </div>
        </nav>
    );
};
