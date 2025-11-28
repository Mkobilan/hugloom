import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Heart, Share2, Calendar, Bell, UserPlus, CheckCircle } from 'lucide-react';
import { Notification, markNotificationAsRead } from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
    notification: Notification;
    onRead: () => void;
}

export const NotificationItem = ({ notification, onRead }: NotificationItemProps) => {
    const router = useRouter();

    const getIcon = () => {
        switch (notification.type) {
            case 'message': return <MessageCircle className="w-5 h-5 text-blue-500" />;
            case 'care_circle': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'feed': return <Heart className="w-5 h-5 text-rose-500" />;
            case 'care_task': return <CheckCircle className="w-5 h-5 text-purple-500" />;
            case 'calendar': return <Calendar className="w-5 h-5 text-orange-500" />;
            case 'follower': return <UserPlus className="w-5 h-5 text-indigo-500" />;
            case 'comment_reply': return <MessageCircle className="w-5 h-5 text-teal-500" />;
            default: return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const handleClick = async () => {
        if (!notification.read) {
            await markNotificationAsRead(notification.id);
            onRead();
        }
        if (notification.link) {
            router.push(notification.link);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors flex gap-3 items-start",
                !notification.read && "bg-terracotta/5"
            )}
        >
            <div className="mt-1 shrink-0">
                {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium text-white", !notification.read && "font-bold")}>
                    {notification.title}
                </p>
                <p className="text-sm text-white/70 line-clamp-2 mt-0.5">
                    {notification.message}
                </p>
                <p className="text-xs text-white/40 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
            </div>
            {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-terracotta mt-2 shrink-0" />
            )}
        </div>
    );
};
