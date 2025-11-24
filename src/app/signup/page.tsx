// src/app/signup/page.tsx
"use client";
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Flame, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', isError: false });
    const supabase = createClient();

    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  // Update the handleSignup function in src/app/signup/page.tsx
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (password.length < 6) {
    setMessage({ text: 'Password must be at least 6 characters', isError: true });
    return;
  }

  if (password !== confirmPassword) {
    setMessage({ text: 'Passwords do not match', isError: true });
    return;
  }

  setLoading(true);
  setMessage({ text: '', isError: false });
  
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to sign up');
    }

    console.log('Signup response:', data);
    
    setMessage({ 
      text: 'Check your email to confirm your account!', 
      isError: false 
    });
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  } catch (error: any) {
    console.error('Signup error:', error);
    setMessage({ 
      text: error.message || 'An error occurred during sign up', 
      isError: true 
    });
  } finally {
    setLoading(false);
  }
};

    return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 font-sans text-foreground">
            <div className="mb-8 flex flex-col items-center animate-pulse">
                <div className="p-4 bg-terracotta/20 rounded-full mb-4">
                    <Flame className="w-12 h-12 text-terracotta fill-terracotta/20" />
                </div>
                <h1 className="text-3xl font-heading font-bold text-terracotta">HugLoom</h1>
                <p className="text-muted-foreground mt-2">Create your account</p>
            </div>

            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-terracotta/10">
                <h2 className="text-2xl font-bold mb-6 text-center font-heading">Create Account</h2>

                <form onSubmit={handleSignup} className="space-y-4">
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
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-terracotta/70 hover:text-terracotta"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-1">
                            Must be at least 6 characters
                        </p>
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium mb-1 ml-1">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-3 pr-10 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-all"
                                placeholder="••••••••"
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                onClick={toggleConfirmPasswordVisibility}
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
                        className="w-full py-3 bg-terracotta text-white rounded-xl font-bold hover:bg-terracotta/90 transition-colors disabled:opacity-50 shadow-lg shadow-terracotta/20 mt-2"
                    >
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                {message.text && (
                    <div className={`mt-4 p-3 rounded-xl text-center ${
                        message.isError ? 'bg-red-100 text-red-700' : 'bg-sage/10 text-sage'
                    }`}>
                        <p className="text-sm font-bold">{message.text}</p>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-terracotta hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-xs text-muted-foreground">
                        By signing up, you agree to our Terms and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}