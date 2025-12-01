"use client";

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Palette, Sun, Moon, Monitor, Bell, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppearance } from '@/components/providers/AppearanceProvider';
import { updateNotificationSettings, getNotificationSettings } from '@/lib/notifications';
import { useTutorial } from '@/components/providers/TutorialProvider';

function TutorialButton() {
    const { startTutorial } = useTutorial();

    return (
        <button
            onClick={startTutorial}
            className="px-4 py-2 bg-terracotta text-white rounded-lg text-sm font-medium hover:bg-terracotta/90 transition-colors"
        >
            Take Tour
        </button>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    const { theme, setTheme } = useTheme();
    const { fontSize, setFontSize } = useAppearance();

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Update checker state
    const [checkingForUpdates, setCheckingForUpdates] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');

    // Delete account state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deletingAccount, setDeletingAccount] = useState(false);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            setUser(user);

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            const notificationSettings = await getNotificationSettings(user.id);

            setProfile({ ...profileData, notification_settings: notificationSettings });
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(password)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/[0-9]/.test(password)) {
            return 'Password must contain at least one number';
        }
        return null;
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setChangingPassword(true);
        setMessage({ type: '', text: '' });

        try {
            // Validation
            if (!currentPassword || !newPassword || !confirmPassword) {
                setMessage({ type: 'error', text: 'Please fill in all password fields' });
                return;
            }

            if (newPassword !== confirmPassword) {
                setMessage({ type: 'error', text: 'New passwords do not match' });
                return;
            }

            if (currentPassword === newPassword) {
                setMessage({ type: 'error', text: 'New password must be different from current password' });
                return;
            }

            const validationError = validatePassword(newPassword);
            if (validationError) {
                setMessage({ type: 'error', text: validationError });
                return;
            }

            // Verify current password by attempting to sign in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });

            if (signInError) {
                setMessage({ type: 'error', text: 'Current password is incorrect' });
                return;
            }

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                setMessage({ type: 'error', text: 'Error updating password: ' + updateError.message });
                return;
            }

            setMessage({ type: 'success', text: 'Password updated successfully!' });

            // Clear form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);

        } catch (error: any) {
            console.error('Error changing password:', error);
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setChangingPassword(false);
        }
    };

    const checkForUpdates = async () => {
        setCheckingForUpdates(true);
        setUpdateMessage('Checking for updates...');
        setUpdateAvailable(false);

        try {
            // Check if service worker is supported
            if (!('serviceWorker' in navigator)) {
                setUpdateMessage('Service Worker not supported in this browser');
                setCheckingForUpdates(false);
                return;
            }

            const registration = await navigator.serviceWorker.getRegistration();

            if (!registration) {
                setUpdateMessage('No service worker registered');
                setCheckingForUpdates(false);
                return;
            }

            // Check for updates
            await registration.update();

            // Wait a bit for the update check to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if there's a waiting service worker
            if (registration.waiting) {
                setUpdateAvailable(true);
                setUpdateMessage('Update available! Installing...');

                // Tell the waiting service worker to skip waiting
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });

                // Listen for the controlling service worker to change
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    // Reload the page to use the new service worker
                    window.location.reload();
                });
            } else if (registration.installing) {
                setUpdateMessage('Update is installing...');
                // Wait for it to finish installing
                registration.installing.addEventListener('statechange', (e: any) => {
                    if (e.target.state === 'installed') {
                        setUpdateAvailable(true);
                        setUpdateMessage('Update available! Click again to install.');
                    }
                });
            } else {
                setUpdateMessage('You\'re running the latest version!');
                setTimeout(() => {
                    setUpdateMessage('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
            setUpdateMessage('Error checking for updates');
        } finally {
            setCheckingForUpdates(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            setMessage({ type: 'error', text: 'Please type DELETE to confirm' });
            return;
        }

        setDeletingAccount(true);
        try {
            const { error } = await supabase.rpc('delete_own_account');

            if (error) {
                console.error('Error deleting account:', error);
                setMessage({ type: 'error', text: 'Failed to delete account: ' + error.message });
                setDeletingAccount(false);
                return;
            }

            // Sign out and redirect
            await supabase.auth.signOut();
            router.push('/login');
        } catch (error: any) {
            console.error('Error deleting account:', error);
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
            setDeletingAccount(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-heading font-bold text-terracotta mb-6">Settings</h1>

                {/* Account Information */}
                <div className="mb-8 p-6 bg-[#3C3434] rounded-2xl border border-terracotta/10 shadow-sm">
                    <h2 className="text-lg font-bold text-white mb-4">Account Information</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-muted-foreground">Email</label>
                            <p className="text-white font-medium">{user?.email}</p>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Username</label>
                            <p className="text-white font-medium">@{profile?.username || 'Not set'}</p>
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={() => router.push('/profile')}
                                className="text-terracotta hover:underline text-sm font-medium"
                            >
                                Edit Profile →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Subscription Section */}
                <div className="mb-8 p-6 bg-[#3C3434] rounded-2xl border border-terracotta/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-terracotta/10 rounded-full">
                            <CheckCircle className="w-5 h-5 text-terracotta" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Subscription</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-[#4A4042] rounded-xl border border-white/5">
                            <div>
                                <h3 className="font-medium text-white">Current Plan</h3>
                                <p className="text-sm text-white/60">
                                    {profile?.is_subscribed ? 'Premium Member ($5/mo)' : 'Free Tier'}
                                </p>
                            </div>
                            {profile?.is_subscribed && (
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                                    Active
                                </span>
                            )}
                        </div>

                        {profile?.is_subscribed && (
                            <div className="pt-2">
                                <p className="text-sm text-white/60 mb-3">
                                    To cancel your subscription, please contact support or manage via Stripe.
                                </p>
                                <button
                                    onClick={() => {
                                        // For now, we can redirect to a support email or show a message.
                                        // Ideally, we'd use the Stripe Customer Portal.
                                        // Since we don't have the portal link set up yet, we'll show a message or link to email.
                                        window.location.href = "mailto:support@hugloom.com?subject=Cancel Subscription";
                                    }}
                                    className="text-red-400 hover:text-red-300 text-sm font-medium hover:underline flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Request Cancellation
                                </button>
                            </div>
                        )}

                        {!profile?.is_subscribed && (
                            <button
                                onClick={() => router.push('/onboarding')}
                                className="w-full py-3 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 transition-colors shadow-lg shadow-terracotta/20"
                            >
                                Upgrade to Premium
                            </button>
                        )}
                    </div>
                </div>

                {/* Change Password Section */}
                <div className="p-6 bg-[#3C3434] rounded-2xl border border-terracotta/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-terracotta/10 rounded-full">
                            <Lock className="w-5 h-5 text-terracotta" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Change Password</h2>
                    </div>

                    {/* Message Display */}
                    {message.text && (
                        <div className={`mb-4 p-4 rounded-xl flex items-start gap-3 ${message.type === 'success'
                            ? 'bg-sage/10 text-sage border border-sage/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                            {message.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            )}
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-10 rounded-xl border border-terracotta/20 bg-[#4A4042] text-white focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-all placeholder:text-white/30"
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-terracotta/70 hover:text-terracotta"
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-10 rounded-xl border border-terracotta/20 bg-[#4A4042] text-white focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-all placeholder:text-white/30"
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-terracotta/70 hover:text-terracotta"
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Must be at least 8 characters with uppercase, lowercase, and number
                            </p>
                        </div>

                        {/* Confirm New Password */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-10 rounded-xl border border-terracotta/20 bg-[#4A4042] text-white focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-all placeholder:text-white/30"
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-terracotta/70 hover:text-terracotta"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={changingPassword}
                            className="w-full py-3 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-terracotta/20"
                        >
                            {changingPassword ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Updating Password...
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>
                </div>

                {/* Privacy & Visibility Section */}
                <div className="mt-8 p-6 bg-[#3C3434] rounded-2xl border border-terracotta/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-terracotta/10 rounded-full">
                            <Eye className="w-5 h-5 text-terracotta" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Privacy & Visibility</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Posts Visibility */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Who can see your posts?
                            </label>
                            <select
                                value={profile?.post_visibility || 'public'}
                                onChange={async (e) => {
                                    const newVal = e.target.value;
                                    setProfile({ ...profile, post_visibility: newVal });
                                    const { error } = await supabase
                                        .from('profiles')
                                        .update({ post_visibility: newVal })
                                        .eq('id', user.id);
                                    if (error) {
                                        console.error('Error updating post visibility:', error);
                                        setMessage({ type: 'error', text: 'Failed to update visibility' });
                                    } else {
                                        setMessage({ type: 'success', text: 'Visibility settings updated' });
                                        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                                    }
                                }}
                                className="w-full px-4 py-3 rounded-xl border border-terracotta/20 bg-[#4A4042] text-white focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-all"
                            >
                                <option value="public">Everyone (Public)</option>
                                <option value="followers">Followers Only</option>
                            </select>
                            <p className="text-xs text-muted-foreground mt-1">
                                Control who can see your posts on your profile and in the feed.
                            </p>
                        </div>


                        {/* Marketplace Visibility */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Who can see your Marketplace Listings?
                            </label>
                            <select
                                value={profile?.marketplace_visibility || 'public'}
                                onChange={async (e) => {
                                    const newVal = e.target.value;
                                    setProfile({ ...profile, marketplace_visibility: newVal });
                                    const { error } = await supabase
                                        .from('profiles')
                                        .update({ marketplace_visibility: newVal })
                                        .eq('id', user.id);
                                    if (error) {
                                        console.error('Error updating marketplace visibility:', error);
                                        setMessage({ type: 'error', text: 'Failed to update visibility' });
                                    } else {
                                        setMessage({ type: 'success', text: 'Visibility settings updated' });
                                        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                                    }
                                }}
                                className="w-full px-4 py-3 rounded-xl border border-terracotta/20 bg-[#4A4042] text-white focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-all"
                            >
                                <option value="public">Everyone (Public)</option>
                                <option value="followers">Followers Only</option>
                            </select>
                            <p className="text-xs text-muted-foreground mt-1">
                                Control who can see items you list for sale.
                            </p>
                        </div>
                    </div>
                </div>
                {/* Notification Settings */}
                <div className="mt-8 p-6 bg-[#3C3434] rounded-2xl border border-terracotta/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-terracotta/10 rounded-full">
                            <Bell className="w-5 h-5 text-terracotta" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Notifications</h2>
                    </div>

                    <div className="space-y-8">
                        {/* Global Toggles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-4 bg-[#4A4042] rounded-xl border border-white/5">
                                <div>
                                    <h3 className="font-medium text-white">Push Notifications</h3>
                                    <p className="text-xs text-white/60">Receive browser notifications</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={profile?.notification_settings?.push_notifications ?? true}
                                        onChange={async (e) => {
                                            const newVal = e.target.checked;
                                            // Optimistic update
                                            const newSettings = { ...profile?.notification_settings, push_notifications: newVal };
                                            setProfile({ ...profile, notification_settings: newSettings });

                                            // Request permission if enabling
                                            if (newVal && Notification.permission === 'default') {
                                                await Notification.requestPermission();
                                            }

                                            await updateNotificationSettings(user.id, { push_notifications: newVal });
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-terracotta"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-[#4A4042] rounded-xl border border-white/5">
                                <div>
                                    <h3 className="font-medium text-white">Email Notifications</h3>
                                    <p className="text-xs text-white/60">Receive updates via email</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={profile?.notification_settings?.email_notifications ?? true}
                                        onChange={async (e) => {
                                            const newVal = e.target.checked;
                                            const newSettings = { ...profile?.notification_settings, email_notifications: newVal };
                                            setProfile({ ...profile, notification_settings: newSettings });
                                            await updateNotificationSettings(user.id, { email_notifications: newVal });
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-terracotta"></div>
                                </label>
                            </div>
                        </div>

                        {/* Categories */}
                        <div>
                            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider opacity-70">Notification Types</h3>
                            <div className="space-y-3">
                                {[
                                    { id: 'messages', label: 'New Messages', desc: 'When you receive a new chat message' },
                                    { id: 'care_circle', label: 'Care Circle Activity', desc: 'New tasks or completed tasks' },
                                    { id: 'feed', label: 'Feed Interactions', desc: 'Hugs, comments, and shares on your posts' },
                                    { id: 'care_task', label: 'Care Task Reminders', desc: 'Reminders for medications and appointments' },
                                    { id: 'calendar', label: 'Calendar Reminders', desc: 'Upcoming events and schedule changes' },
                                    { id: 'comment_reply', label: 'Comment Replies', desc: 'When someone replies to your comment' },
                                    { id: 'follower', label: 'New Followers', desc: 'When someone follows you' },
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-sm font-medium text-white">{item.label}</p>
                                            <p className="text-xs text-white/50">{item.desc}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={profile?.notification_settings?.categories?.[item.id] ?? true}
                                                onChange={async (e) => {
                                                    const newVal = e.target.checked;
                                                    const currentCats = profile?.notification_settings?.categories || {};
                                                    const newCats = { ...currentCats, [item.id]: newVal };
                                                    const newSettings = { ...profile?.notification_settings, categories: newCats };

                                                    setProfile({ ...profile, notification_settings: newSettings });
                                                    await updateNotificationSettings(user.id, { categories: newCats });
                                                }}
                                            />
                                            <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-terracotta"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reminder Timing */}
                        <div>
                            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider opacity-70">Reminder Timing</h3>
                            <p className="text-sm text-white/70 mb-3">Send reminders before tasks/appointments:</p>
                            <div className="flex flex-wrap gap-3">
                                {[15, 30, 60].map((minutes) => {
                                    const currentReminders = profile?.notification_settings?.care_task_reminder_minutes || [15];
                                    const isSelected = currentReminders.includes(minutes);

                                    return (
                                        <button
                                            key={minutes}
                                            onClick={async () => {
                                                let newReminders;
                                                if (isSelected) {
                                                    newReminders = currentReminders.filter((m: number) => m !== minutes);
                                                } else {
                                                    newReminders = [...currentReminders, minutes];
                                                }

                                                const newSettings = { ...profile?.notification_settings, care_task_reminder_minutes: newReminders };
                                                setProfile({ ...profile, notification_settings: newSettings });
                                                await updateNotificationSettings(user.id, { care_task_reminder_minutes: newReminders });
                                            }}
                                            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${isSelected
                                                ? 'bg-terracotta border-terracotta text-white'
                                                : 'bg-[#4A4042] border-white/10 text-white/70 hover:border-white/30'
                                                }`}
                                        >
                                            {minutes} Minutes
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="mt-8 p-6 bg-[#3C3434] rounded-2xl border border-terracotta/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-terracotta/10 rounded-full">
                            <Palette className="w-5 h-5 text-terracotta" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Appearance</h2>
                    </div>

                    <div className="space-y-8">
                        {/* Theme */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-3">
                                Theme
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'light'
                                        ? 'border-terracotta bg-terracotta/10 text-terracotta'
                                        : 'border-terracotta/10 bg-[#4A4042] text-white/70 hover:border-terracotta/50'
                                        }`}
                                >
                                    <Sun className="w-6 h-6 mb-2" />
                                    <span className="text-sm font-medium">Light</span>
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                                        ? 'border-terracotta bg-terracotta/10 text-terracotta'
                                        : 'border-terracotta/10 bg-[#4A4042] text-white/70 hover:border-terracotta/50'
                                        }`}
                                >
                                    <Moon className="w-6 h-6 mb-2" />
                                    <span className="text-sm font-medium">Dark</span>
                                </button>
                                <button
                                    onClick={() => setTheme('system')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'system'
                                        ? 'border-terracotta bg-terracotta/10 text-terracotta'
                                        : 'border-terracotta/10 bg-[#4A4042] text-white/70 hover:border-terracotta/50'
                                        }`}
                                >
                                    <Monitor className="w-6 h-6 mb-2" />
                                    <span className="text-sm font-medium">Auto</span>
                                </button>
                            </div>
                        </div>

                        {/* Font Size */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-white">
                                    Font Size
                                </label>
                                <span className="text-xs text-terracotta font-medium uppercase tracking-wider">
                                    {fontSize}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {(['small', 'medium', 'large', 'xl'] as const).map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setFontSize(size)}
                                        className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${fontSize === size
                                            ? 'border-terracotta bg-terracotta/10 text-terracotta'
                                            : 'border-terracotta/10 bg-[#4A4042] text-white/70 hover:border-terracotta/50'
                                            }`}
                                    >
                                        <span className={
                                            size === 'small' ? 'text-sm' :
                                                size === 'medium' ? 'text-base' :
                                                    size === 'large' ? 'text-lg' :
                                                        'text-xl'
                                        }>Aa</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* App Updates Section */}
                <div className="mt-8 p-6 bg-[#3C3434] rounded-2xl border border-terracotta/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-terracotta/10 rounded-full">
                            <RefreshCw className="w-5 h-5 text-terracotta" />
                        </div>
                        <h2 className="text-lg font-bold text-white">App Updates</h2>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-white/70">
                            Check for the latest version of HugLoom. Updates include new features, improvements, and bug fixes.
                        </p>

                        {/* Update Status Message */}
                        {updateMessage && (
                            <div className={`p-4 rounded-xl flex items-start gap-3 ${updateAvailable
                                ? 'bg-terracotta/10 text-terracotta border border-terracotta/20'
                                : updateMessage.includes('Error')
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    : 'bg-sage/10 text-sage border border-sage/20'
                                }`}>
                                {updateAvailable ? (
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                ) : updateMessage.includes('Error') ? (
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                )}
                                <p className="text-sm font-medium">{updateMessage}</p>
                            </div>
                        )}

                        {/* Check for Updates Button */}
                        <button
                            onClick={checkForUpdates}
                            disabled={checkingForUpdates}
                            className="w-full py-3 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-terracotta/20"
                        >
                            {checkingForUpdates ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Checking for Updates...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    Check for Updates
                                </>
                            )}
                        </button>

                        <p className="text-xs text-white/50 text-center">
                            Current version: 1.0.0
                        </p>
                    </div>
                </div>

                {/* Help & Support Section */}
                <div className="mt-8 p-6 bg-[#3C3434] rounded-2xl border border-terracotta/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-terracotta/10 rounded-full">
                            <AlertCircle className="w-5 h-5 text-terracotta" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Help & Support</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-[#4A4042] rounded-xl border border-white/5">
                            <div>
                                <h3 className="font-medium text-white">App Tour</h3>
                                <p className="text-xs text-white/60">Take a quick tour of Hugloom's features</p>
                            </div>
                            <TutorialButton />
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Account Section */}
            <div className="mt-8 p-6 bg-[#3C3434] rounded-2xl border border-red-500/20 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-500/10 rounded-full">
                        <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Danger Zone</h2>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/20">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-medium text-white mb-1">Delete Account</h3>
                                <p className="text-sm text-white/70 mb-3">
                                    Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
                                >
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#3C3434] rounded-2xl border border-red-500/20 max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/10 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Delete Account?</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                                <p className="text-sm text-white/90 font-medium mb-2">
                                    This will permanently delete:
                                </p>
                                <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
                                    <li>Your profile and account information</li>
                                    <li>All your posts and comments</li>
                                    <li>Your messages and conversations</li>
                                    <li>Care circles and tasks</li>
                                    <li>All other associated data</li>
                                </ul>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Type <span className="font-bold text-red-500">DELETE</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-red-500/20 bg-[#4A4042] text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-white/30"
                                    placeholder="Type DELETE"
                                    autoFocus
                                />
                            </div>

                            {message.text && message.type === 'error' && (
                                <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm">{message.text}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeleteConfirmText('');
                                        setMessage({ type: '', text: '' });
                                    }}
                                    disabled={deletingAccount}
                                    className="flex-1 px-4 py-3 bg-[#4A4042] text-white rounded-xl font-medium hover:bg-[#5A5052] transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {deletingAccount ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete Account'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
