"use client";
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Flame } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        });

        if (error) {
            setMessage(error.message);
        } else {
            setMessage('Check your email for the login link!');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 font-sans text-foreground">
            <div className="mb-8 flex flex-col items-center animate-pulse">
                <div className="p-4 bg-terracotta/20 rounded-full mb-4">
                    <Flame className="w-12 h-12 text-terracotta fill-terracotta/20" />
                </div>
                <h1 className="text-3xl font-heading font-bold text-terracotta">HugLoom</h1>
                <p className="text-muted-foreground mt-2">Someone's light is always on for you.</p>
            </div>

            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-terracotta/10">
                <h2 className="text-2xl font-bold mb-6 text-center font-heading">Welcome Home</h2>

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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-terracotta text-white rounded-xl font-bold hover:bg-terracotta/90 transition-colors disabled:opacity-50 shadow-lg shadow-terracotta/20"
                    >
                        {loading ? 'Sending link...' : 'Continue with Email'}
                    </button>
                </form>

                {message && (
                    <div className="mt-4 p-3 bg-sage/10 rounded-xl text-center">
                        <p className="text-sm text-sage font-bold">{message}</p>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <p className="text-xs text-muted-foreground">
                        By continuing, you agree to our Terms and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}
