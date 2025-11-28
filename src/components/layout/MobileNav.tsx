"use client";

import React, { useEffect } from 'react';
import { Link } from 'solito/link';
import { usePathname } from 'next/navigation';
import {
    MessageCircle,
    Calendar,
    ShoppingBag,
    User,
    HeartHandshake,
    Smile,
    Settings,
    HelpCircle,
    LogOut,
    MapPin,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const NavItem = ({ href, icon: Icon, label, color, onClick, subtitle }: { href: string; icon: any; label: string; color: string; onClick?: () => void; subtitle?: string }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link href={href}>
            <div
                onClick={onClick}
                className={cn(
                    "p-3 rounded-xl flex items-center gap-3 transition-all duration-200 active:scale-95 cursor-pointer mb-2",
                    isActive ? "bg-white/10" : "hover:bg-white/5"
                )}
            >
                <div className={cn("p-2 rounded-lg", color.split(' ')[0])}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-sm text-foreground">{label}</h3>
                    {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
                </div>
            </div>
        </Link>
    );
};

interface MobileNavProps {
    isOpen: boolean;
    onClose: () => void;
    onMoodCheckClick: () => void;
}

export const MobileNav = ({ isOpen, onClose, onMoodCheckClick }: MobileNavProps) => {
    const router = useRouter();
    const supabase = createClient();

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            onClose();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="absolute left-0 top-0 bottom-0 w-[80%] max-w-xs bg-background border-r border-border shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-terracotta flex items-center justify-center text-white font-bold shadow-lg shadow-terracotta/20">
                            <HeartHandshake className="w-5 h-5" />
                        </div>
                        <span className="font-heading font-bold text-lg">HugLoom</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                    <div className="space-y-1">
                        <NavItem
                            href="/feed"
                            icon={MessageCircle}
                            label="Feed"
                            color="bg-sage"
                            subtitle="Community updates"
                            onClick={onClose}
                        />
                        <NavItem
                            href="/meds"
                            icon={Calendar}
                            label="Care Tasks"
                            color="bg-terracotta"
                            subtitle="Meds & Appointments"
                            onClick={onClose}
                        />
                        <NavItem
                            href="/calendar"
                            icon={Calendar}
                            label="Calendar"
                            color="bg-slate-blue"
                            onClick={onClose}
                        />
                        <NavItem
                            href="/messages"
                            icon={MessageCircle}
                            label="Chats"
                            color="bg-mustard"
                            subtitle="DMs & Groups"
                            onClick={onClose}
                        />
                        <NavItem
                            href="/care-circles"
                            icon={HeartHandshake}
                            label="My Care Circles"
                            color="bg-rose-500"
                            onClick={onClose}
                        />
                        <NavItem
                            href="/local-hugs"
                            icon={MapPin}
                            label="Local Hugs"
                            color="bg-sky-600"
                            subtitle="Local Support & Help"
                            onClick={onClose}
                        />
                        <NavItem
                            href="/marketplace"
                            icon={ShoppingBag}
                            label="Marketplace"
                            color="bg-emerald-600"
                            onClick={onClose}
                        />
                        <NavItem
                            href="/profile"
                            icon={User}
                            label="My Profile"
                            color="bg-slate-500"
                            onClick={onClose}
                        />
                        <NavItem
                            href="#"
                            icon={Smile}
                            label="Mood Check"
                            color="bg-purple-500"
                            subtitle="Just Breathe"
                            onClick={() => {
                                onClose();
                                onMoodCheckClick();
                            }}
                        />
                    </div>

                    <div className="mt-6 pt-6 border-t border-border">
                        <NavItem
                            href="/settings"
                            icon={Settings}
                            label="Settings"
                            color="bg-sky-600"
                            onClick={onClose}
                        />
                        <NavItem
                            href="/support"
                            icon={HelpCircle}
                            label="Help & Support"
                            color="bg-slate-blue"
                            onClick={onClose}
                        />
                        <button
                            onClick={handleSignOut}
                            className="w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 hover:bg-red-50 active:scale-95 cursor-pointer text-red-500"
                        >
                            <div className="p-2 rounded-lg bg-red-100">
                                <LogOut className="w-5 h-5 text-red-500" />
                            </div>
                            <span className="font-bold text-sm">Log Out</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
