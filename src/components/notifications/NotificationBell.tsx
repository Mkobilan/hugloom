"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Notification, markAllNotificationsAsRead } from '@/lib/notifications';
import { NotificationItem } from './NotificationItem';

export const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch initial notifications and set up real-time subscription
    useEffect(() => {
        const supabase = createClient();
        let channel: ReturnType<typeof supabase.channel> | null = null;

        const setupNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Fetch initial notifications
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) {
                setNotifications(data as Notification[]);
                setUnreadCount(data.filter((n: any) => !n.read).length);
            }
            setLoading(false);

            // Subscribe to real-time notifications for this user
            channel = supabase
                .channel('notifications_bell')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        const newNotification = payload.new as Notification;
                        setNotifications(prev => [newNotification, ...prev]);
                        if (!newNotification.read) {
                            setUnreadCount(prev => prev + 1);
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        const updatedNotification = payload.new as Notification;
                        setNotifications(prev =>
                            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
                        );
                        // Recalculate unread count
                        setNotifications(current => {
                            setUnreadCount(current.filter(n => !n.read).length);
                            return current;
                        });
                    }
                )
                .subscribe();
        };

        setupNotifications();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMarkAllRead = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await markAllNotificationsAsRead(user.id);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const handleNotificationRead = () => {
        setUnreadCount(prev => Math.max(0, prev - 1));
        // We update the local state read status in the Item component click handler, 
        // but we should also update the list here to reflect the change if we re-open
        // Actually, simpler to just re-fetch or let the local state update. 
        // For now, let's just decrement count.
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <div className="absolute top-0 right-0 w-5 h-5 bg-terracotta text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-background">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#3C3434] border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#4A4042]">
                        <h3 className="font-bold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-terracotta hover:text-terracotta/80 font-medium flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center text-white/50 text-sm">
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-white/50 text-sm">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onRead={() => {
                                        setNotifications(prev =>
                                            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                                        );
                                        setUnreadCount(prev => Math.max(0, prev - 1));
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
