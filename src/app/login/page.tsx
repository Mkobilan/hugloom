// src/app/login/page.tsx
"use client";
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, HeartHandshake } from 'lucide-react';
import Link from 'next/link';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', isError: false });
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', isError: false });

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Redirect to root after successful login
            window.location.href = '/';
        } catch (error: any) {
            setMessage({
                text: error.message || 'Failed to sign in. Please check your credentials.',
                isError: true
            });
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
                <InstallPrompt />
            </div>

            <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-xl border border-border">
                <h2 className="text-2xl font-bold mb-6 text-center font-heading">Welcome Back</h2>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 ml-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-all"
                            placeholder="sarah@example.com"
                            required
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium mb-1 ml-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 pr-10 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-all"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-terracotta/70 hover:text-terracotta"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <div className="mt-2 text-right">
                            <Link href="/auth/forgot-password" className="text-sm text-terracotta hover:underline font-medium">
                                Forgot Password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-terracotta text-white rounded-xl font-bold hover:bg-terracotta/90 transition-colors disabled:opacity-50 shadow-lg shadow-terracotta/20"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {message.text && (
                    <div className={`mt-4 p-3 rounded-xl text-center ${message.isError ? 'bg-red-100 text-red-700' : 'bg-sage/10 text-sage'
                        }`}>
                        <p className="text-sm font-bold">{message.text}</p>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-terracotta hover:underline font-medium">
                            Sign up
                        </Link>
                    </p>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-xs text-muted-foreground">
                        By continuing, you agree to our Terms and Privacy Policy.
                    </p>
                </div>
            </div>

            {/* SEO Content Section */}
            <div className="mt-12 max-w-2xl text-center space-y-8 pb-8">
                <section>
                    <h2 className="text-xl font-heading font-bold text-terracotta mb-2">The #1 Caregiver Support App</h2>
                    <p className="text-muted-foreground">
                        HugLoom is the ultimate <strong>family caregiver app</strong> designed to simplify <strong>elder care support</strong>.
                        Join our <strong>caregiver support group</strong> to connect with others who understand your journey.
                    </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="bg-card/50 p-4 rounded-xl border border-border/50">
                        <h3 className="font-bold text-foreground mb-1">Care Calendar & Coordination</h3>
                        <p className="text-sm text-muted-foreground">
                            Manage appointments and coordinate with family using our shared <strong>care calendar</strong>. Perfect for <strong>care coordination with My Care Circle</strong>.
                        </p>
                    </div>
                    <div className="bg-card/50 p-4 rounded-xl border border-border/50">
                        <h3 className="font-bold text-foreground mb-1">Medication Tracker</h3>
                        <p className="text-sm text-muted-foreground">
                            Never miss a dose with our built-in <strong>medication tracker</strong>. Essential for <strong>dementia care</strong> and daily health management.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}