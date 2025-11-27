"use client";

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Palette, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppearance } from '@/components/providers/AppearanceProvider';

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

            setProfile(profileData);
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
            </div>
        </AppLayout>
    );
}
