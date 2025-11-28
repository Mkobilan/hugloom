import { createClient } from '@/lib/supabase/server';
import { NotificationType } from './notifications';

export const createNotificationServer = async (
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
    metadata: any = {}
) => {
    const supabase = await createClient();

    // 1. Check user settings first
    const { data: settings } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

    // Default to true if no settings found (opt-out model)
    const shouldNotify = settings ? settings.categories?.[type] !== false : true;

    if (!shouldNotify) {
        console.log(`Notification suppressed by user settings: ${type}`);
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
    if (settings?.push_notifications) {
        // await sendPushNotification(userId, title, message, link);
    }

    if (settings?.email_notifications) {
        // await sendEmailNotification(userId, title, message, link);
    }

    return data;
};
