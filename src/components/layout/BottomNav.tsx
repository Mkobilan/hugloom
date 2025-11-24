"use client";

import React from 'react';
import { Link } from 'solito/link';
import { Home, MessageCircle, Calendar, Mail, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NavItem = ({ href, icon: Icon, label, isActive }: { href: string; icon: any; label: string; isActive: boolean }) => (
    <Link href={href}>
        <div className={cn(
            "flex flex-col items-center justify-center gap-1 p-2 transition-colors duration-200",
            isActive ? "text-slate-blue" : "text-muted-foreground hover:text-foreground"
        )}>
            <Icon className={cn("w-6 h-6", isActive && "fill-current")} />
            <span className="text-[10px] font-medium">{label}</span>
        </div>
    </Link>
);

export const BottomNav = () => {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-soft-blush border-t border-slate-blue/20 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-around px-2 py-2">
                <NavItem href="/" icon={Home} label="Home" isActive={pathname === '/'} />
                <NavItem href="/feed" icon={MessageCircle} label="Feed" isActive={pathname === '/feed'} />
                <NavItem href="/calendar" icon={Calendar} label="Calendar" isActive={pathname === '/calendar'} />
                <NavItem href="/messages" icon={Mail} label="Messages" isActive={pathname === '/messages'} />
                <NavItem href="/more" icon={Menu} label="More" isActive={pathname === '/more'} />
            </div>
        </nav>
    );
};
