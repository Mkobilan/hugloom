"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HeartHandshake, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
    const router = useRouter();
    const supabase = createClient();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isValidToken, setIsValidToken] = useState(false);
    const [checkingToken, setCheckingToken] = useState(true);

    useEffect(() => {
        // Check if we have a valid session (from the email link)
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    setIsValidToken(true);
                } else {
                    setMessage({
                        type: 'error',
                        text: 'Invalid or expired reset link. Please request a new one.'
                    });
                }
            } catch (error) {
                console.error('Error checking session:', error);
                setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
            } finally {
                setCheckingToken(false);
            }
        };

        checkSession();
    }, []);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Validation
            if (!newPassword || !confirmPassword) {
                setMessage({ type: 'error', text: 'Please fill in all fields' });
                return;
            }

            if (newPassword !== confirmPassword) {
                setMessage({ type: 'error', text: 'Passwords do not match' });
                return;
            }

            const validationError = validatePassword(newPassword);
            if (validationError) {
                setMessage({ type: 'error', text: validationError });
                return;
            }

            // Update password
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                setMessage({ type: 'error', text: error.message });
                return;
            }

            setMessage({ type: 'success', text: 'Password reset successfully! Redirecting to login...' });

            // Redirect to home after 2 seconds
            setTimeout(() => {
                router.push('/');
            }, 2000);

        } catch (error: any) {
            console.error('Error resetting password:', error);
            setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    if (checkingToken) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
            </div>
        );
    }

    if (!isValidToken) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-sans text-foreground">
                <div className="mb-8 flex flex-col items-center">
                    <div className="p-4 bg-terracotta rounded-full mb-4 shadow-lg shadow-terracotta/20">
                        <HeartHandshake className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-3xl font-heading font-bold text-terracotta">HugLoom</h1>
                </div>

                <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl border border-border text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-red-50 rounded-full">
                            <AlertCircle className="w-12 h-12 text-red-600" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Invalid Reset Link</h2>
                    <p className="text-muted-foreground mb-6">
                        This password reset link is invalid or has expired. Please request a new one.
                    </p>
                    <button
                        onClick={() => router.push('/auth/forgot-password')}
                        className="w-full py-3 bg-terracotta text-white rounded-xl font-bold hover:bg-terracotta/90 transition-colors"
                    >
                        Request New Link
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-sans text-foreground">
            <div className="mb-8 flex flex-col items-center">
                <div className="p-4 bg-terracotta rounded-full mb-4 shadow-lg shadow-terracotta/20">
                    <HeartHandshake className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl font-heading font-bold text-terracotta">HugLoom</h1>
                <p className="text-muted-foreground mt-2">Someone's light is always on for you.</p>
            </div>

            <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl border border-border">
                <h2 className="text-2xl font-bold mb-2 text-center font-heading">Reset Your Password</h2>
                <p className="text-muted-foreground text-center mb-6 text-sm">
                    Enter your new password below
                </p>

                {/* Message Display */}
                {message.text && (
                    <div className={`mb-4 p-4 rounded-xl flex items-start gap-3 ${message.type === 'success'
                        ? 'bg-sage/10 text-sage border border-sage/20'
                        : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                        {message.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        )}
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium mb-1 ml-1">New Password</label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-3 pr-10 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-all"
                                placeholder="Enter new password"
                                required
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
                        <p className="text-xs text-muted-foreground mt-1 ml-1">
                            Must be at least 8 characters with uppercase, lowercase, and number
                        </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium mb-1 ml-1">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-3 pr-10 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-all"
                                placeholder="Confirm new password"
                                required
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-terracotta text-white rounded-xl font-bold hover:bg-terracotta/90 transition-colors disabled:opacity-50 shadow-lg shadow-terracotta/20 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Resetting Password...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
