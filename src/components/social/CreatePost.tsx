"use client";
import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Image, Send, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreatePostProps {
    onSuccess?: () => void;
}

export const CreatePost = ({ onSuccess }: CreatePostProps) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();
    const router = useRouter();

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('Image size must be less than 10MB');
                return;
            }
            setSelectedImage(file);
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async () => {
        if (!content.trim() && !selectedImage) return;
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        let mediaUrls: string[] = [];

        // Upload image if selected
        if (selectedImage) {
            const fileExt = selectedImage.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('post-media')
                .upload(filePath, selectedImage);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                alert('Failed to upload image. Please try again.');
                setLoading(false);
                return;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('post-media')
                .getPublicUrl(filePath);

            mediaUrls.push(publicUrl);
        }

        const { error } = await supabase.from('posts').insert({
            content: content.trim() || null,
            user_id: user.id,
            media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        });

        if (!error) {
            setSuccess(true);
            setContent('');
            setSelectedImage(null);
            setImagePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            router.refresh();
            setTimeout(() => {
                setSuccess(false);
                if (onSuccess) onSuccess();
            }, 1500);
        } else {
            console.error('Post error:', error);
            alert('Failed to create post. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="bg-[#3C3434] p-4 rounded-2xl shadow-sm border border-terracotta/10 mb-6 relative overflow-hidden">
            {success && (
                <div className="absolute inset-0 bg-[#3C3434]/90 backdrop-blur-sm z-10 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2 text-green-400">
                            <Send className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-green-400">Post sent successfully!</p>
                    </div>
                </div>
            )}
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share what's on your heart..."
                className="w-full p-3 rounded-xl bg-[#4A4042] border-none focus:ring-2 focus:ring-terracotta/20 resize-none min-h-[100px] placeholder:text-white/50 text-white"
            />

            {/* Image Preview */}
            {imagePreview && (
                <div className="mt-3 relative inline-block">
                    <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 rounded-xl border border-white/10"
                    />
                    <button
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between mt-3">
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-white/60 hover:text-terracotta transition-colors rounded-full hover:bg-terracotta/10"
                        type="button"
                    >
                        <Image className="w-5 h-5" />
                    </button>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading || (!content.trim() && !selectedImage)}
                    className="px-4 py-2 bg-terracotta text-white rounded-full font-bold text-sm hover:bg-terracotta/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-terracotta/20"
                >
                    <span>{loading ? 'Posting...' : 'Post'}</span>
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
