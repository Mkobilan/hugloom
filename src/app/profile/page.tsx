"use client";

import { useEffect, useState, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Camera, Save, Loader2, Upload } from 'lucide-react';
import { ImageWithRetry } from '@/components/ui/ImageWithRetry';

export default function ProfilePage() {
    const router = useRouter();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState({
        username: '',
        full_name: '',
        bio: '',
        location: '',
        role: 'caregiver',
        avatar_url: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            setUser(user);

            // Fetch profile from profiles table
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error loading profile:', error);
            }

            if (profileData) {
                setProfile({
                    username: profileData.username || '',
                    full_name: profileData.full_name || '',
                    bio: profileData.bio || '',
                    location: profileData.location || '',
                    role: profileData.role || 'caregiver',
                    avatar_url: profileData.avatar_url || ''
                });
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage({ type: '', text: '' });

            if (!user) return;

            // Validate username
            if (!profile.username || profile.username.trim().length < 3) {
                setMessage({ type: 'error', text: 'Username must be at least 3 characters long' });
                return;
            }

            // Update profile in database
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: profile.username.trim(),
                    full_name: profile.full_name.trim(),
                    bio: profile.bio.trim(),
                    location: profile.location.trim(),
                    role: profile.role,
                    avatar_url: profile.avatar_url,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                if (error.code === '23505') {
                    setMessage({ type: 'error', text: 'Username already taken. Please choose another.' });
                } else {
                    setMessage({ type: 'error', text: 'Error saving profile: ' + error.message });
                }
                return;
            }

            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // Redirect back to public profile page after a short delay
            setTimeout(() => {
                router.push(`/u/${profile.username}`);
            }, 1500);
        } catch (error) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }));
        setMessage({ type: '', text: '' }); // Clear message on input change
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setMessage({ type: '', text: '' });

            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'error', text: 'Please select an image file' });
                return;
            }

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Image must be less than 5MB' });
                return;
            }

            if (!user) return;

            // Create a unique file name
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                setMessage({ type: 'error', text: 'Error uploading image: ' + uploadError.message });
                return;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // Update profile state with new avatar URL
            setProfile(prev => ({ ...prev, avatar_url: publicUrl }));

            // Also update in database immediately
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) {
                console.error('Error updating avatar URL:', updateError);
                setMessage({ type: 'error', text: 'Error saving avatar URL' });
                return;
            }

            setMessage({ type: 'success', text: 'Profile photo updated!' });
        } catch (error) {
            console.error('Error uploading image:', error);
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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
                <h1 className="text-2xl font-heading font-bold text-terracotta mb-6">Edit Profile</h1>

                {/* Profile Photo Section */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full bg-terracotta/20 flex items-center justify-center text-terracotta font-bold text-3xl overflow-hidden border-2 border-terracotta/30">
                            {uploading ? (
                                <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
                            ) : profile.avatar_url ? (
                                <ImageWithRetry
                                    src={profile.avatar_url}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    fallback={profile.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                                />
                            ) : (
                                profile.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <button
                            type="button"
                            disabled={uploading}
                            className="absolute bottom-0 right-0 p-2 bg-terracotta text-white rounded-full shadow-lg hover:bg-terracotta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Camera className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {uploading ? 'Uploading...' : 'Click camera to change photo (max 5MB)'}
                    </p>
                </div>

                {/* Message Display */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-sage/10 text-sage border border-sage/20' :
                        message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' :
                            'bg-blue-50 text-blue-600 border border-blue-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Form Fields */}
                <div className="space-y-5">
                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Username <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={profile.username}
                            onChange={(e) => handleInputChange('username', e.target.value)}
                            placeholder="Choose a username"
                            className="w-full px-4 py-3 rounded-xl border border-border/50 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-all"
                        />
                        <p className="text-xs text-muted-foreground mt-1">This is how others will see you</p>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={profile.full_name}
                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                            placeholder="Your full name"
                            className="w-full px-4 py-3 rounded-xl border border-border/50 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-all"
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Bio
                        </label>
                        <textarea
                            value={profile.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            placeholder="Tell us about yourself and your caregiving journey..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-border/50 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-all resize-none"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {profile.bio.length}/500 characters
                        </p>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Location
                        </label>
                        <input
                            type="text"
                            value={profile.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            placeholder="City, State or Region"
                            className="w-full px-4 py-3 rounded-xl border border-border/50 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-all"
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Role
                        </label>
                        <select
                            value={profile.role}
                            onChange={(e) => handleInputChange('role', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-border/50 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-terracotta/50 transition-all"
                        >
                            <option value="caregiver">Caregiver</option>
                            <option value="professional">Healthcare Professional</option>
                            <option value="family">Family Member</option>
                            <option value="volunteer">Volunteer</option>
                        </select>
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full px-4 py-3 rounded-xl border border-border/50 bg-gray-50 text-muted-foreground cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-3">
                    <button
                        onClick={() => router.push('/more')}
                        className="flex-1 px-6 py-3 rounded-xl border border-border/50 bg-white text-gray-900 font-medium hover:bg-cream/50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-6 py-3 rounded-xl bg-terracotta text-white font-medium hover:bg-terracotta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Profile
                            </>
                        )}
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
