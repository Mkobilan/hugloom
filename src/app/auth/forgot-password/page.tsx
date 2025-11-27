"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HeartHandshake, Mail, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [emailSent, setEmailSent] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            if (!email) {
                setMessage({ type: 'error', text: 'Please enter your email address' });
                return;
            }

            // Send password reset email
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });

            if (error) {
                setMessage({ type: 'error', text: error.message });
                return;
            }

            setEmailSent(true);
            setMessage({
                type: 'success',
                text: 'Check your email for a password reset link. It may take a few minutes to arrive.'
            });

        } catch (error: any) {
            console.error('Error sending reset email:', error);
            setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

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
                <div className="mb-6">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-terracotta hover:underline text-sm font-medium mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                    <h2 className="text-2xl font-bold text-center font-heading">Forgot Password?</h2>
                    <p className="text-muted-foreground text-center mt-2 text-sm">
                        No worries! Enter your email and we'll send you a reset link.
                    </p>
                </div>

                {!emailSent ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 ml-1">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 pl-10 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-all"
                                    placeholder="sarah@example.com"
                                    required
                                />
                                <Mail className="w-5 h-5 text-terracotta/70 absolute left-3 top-1/2 -translate-y-1/2" />
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
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-4">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-sage/10 rounded-full">
                                <CheckCircle className="w-12 h-12 text-sage" />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">
                            We've sent a password reset link to <strong className="text-foreground">{email}</strong>
                        </p>
                        <Link
                            href="/login"
                            className="inline-block w-full py-3 bg-terracotta text-white rounded-xl font-bold hover:bg-terracotta/90 transition-colors"
                        >
                            Return to Login
                        </Link>
                    </div>
                )}

                {message.text && !emailSent && (
                    <div className={`mt-4 p-3 rounded-xl text-center ${message.type === 'error'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-sage/10 text-sage'
                        }`}>
                        <p className="text-sm font-bold">{message.text}</p>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Remember your password?{' '}
                        <Link href="/login" className="text-terracotta hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
