import { createClient } from '@/lib/supabase/client';

export type NotificationType =
    | 'message'
    | 'care_circle'
    | 'feed'
    | 'care_task'
    | 'calendar'
    | 'follower'
    | 'comment_reply';

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    metadata?: any;
    created_at: string;
}

export interface NotificationSettings {
    user_id: string;
    email_notifications: boolean;
    push_notifications: boolean;
    categories: {
        messages: boolean;
        care_circle: boolean;
        feed: boolean;
        care_task: boolean;
        calendar: boolean;
        follower: boolean;
        comment_reply: boolean;
    };
    care_task_reminder_minutes: number[];
}

export const createNotification = async (
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
    metadata: any = {}
) => {
    const supabase = createClient();

    // 1. Check user settings first
    // Note: This might fail with RLS if we are checking another user's settings.
    // In that case, we default to true (notify).
    let settings = null;
    try {
        const { data, error } = await supabase
            .from('notification_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!error) {
            settings = data;
        }
    } catch (err) {
        // Ignore RLS/Network errors for settings check
    }

    // Default to true if no settings found (opt-out model)
    const shouldNotify = settings ? settings.categories?.[type] !== false : true;

    if (!shouldNotify) {
        // console.log(`Notification suppressed by user settings: ${type}`);
        return null;
    }

    // 2. Create in-app notification
    const { data, error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            type,
            title,
            message,
            link,
            metadata
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating notification:', error);
        return null;
    }

    // 3. Trigger external notifications (Push/Email) if enabled
    // This is where you'd call your Edge Functions or API routes
    if (settings?.push_notifications) {
        // await sendPushNotification(userId, title, message, link);
    }

    if (settings?.email_notifications) {
        // await sendEmailNotification(userId, title, message, link);
    }

    return data;
};

export const getNotificationSettings = async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching settings:', error);
    }

    return data;
};

export const updateNotificationSettings = async (userId: string, settings: Partial<NotificationSettings>) => {
    const supabase = createClient();

    // Check if exists first
    const { data: existing } = await supabase
        .from('notification_settings')
        .select('user_id')
        .eq('user_id', userId)
        .single();

    if (existing) {
        return await supabase
            .from('notification_settings')
            .update(settings)
            .eq('user_id', userId);
    } else {
        return await supabase
            .from('notification_settings')
            .insert({
                user_id: userId,
                ...settings
            });
    }
};

export const markNotificationAsRead = async (notificationId: string) => {
    const supabase = createClient();
    return await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
};

export const markAllNotificationsAsRead = async (userId: string) => {
    const supabase = createClient();
    return await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
};
