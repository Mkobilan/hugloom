"use client";

import { useState, useRef } from 'react';
import { Send, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface CommentInputProps {
    postId: string;
    parentId?: string | null;
    onCommentAdded: () => void;
    onCancel?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export const CommentInput = ({
    postId,
    parentId = null,
    onCommentAdded,
    onCancel,
    placeholder = "Write a comment...",
    autoFocus = false
}: CommentInputProps) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('Image size must be less than 5MB');
                return;
            }
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!content.trim() && !selectedImage) || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let mediaUrl = null;

            if (selectedImage) {
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `comment-images/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('post-media') // Reusing post-media bucket
                    .upload(filePath, selectedImage);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('post-media')
                    .getPublicUrl(filePath);

                mediaUrl = publicUrl;
            }

            const { error } = await supabase
                .from('comments')
                .insert({
                    post_id: postId,
                    user_id: user.id,
                    parent_id: parentId,
                    content: content.trim(),
                    media_url: mediaUrl
                });

            if (error) throw error;

            // Notification handled by DB trigger


            setContent('');
            removeImage();
            onCommentAdded();
            if (onCancel) onCancel();

        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            {imagePreview && (
                <div className="relative mb-2 inline-block">
                    <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-20 w-auto rounded-lg object-cover border border-border"
                    />
                    <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-border hover:bg-slate-100"
                    >
                        <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                </div>
            )}

            <div className="flex gap-2 items-start">
                <div className="flex-1 relative">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={placeholder}
                        className="w-full min-h-[44px] max-h-32 py-2.5 pl-4 pr-12 bg-slate-50 border border-border rounded-2xl focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta/50 resize-none text-sm text-black placeholder:text-muted-foreground"
                        rows={1}
                        autoFocus={autoFocus}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <div className="absolute right-2 top-1.5 flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 text-muted-foreground hover:text-terracotta hover:bg-terracotta/10 rounded-full transition-colors"
                            title="Add photo"
                        >
                            <ImageIcon className="w-4 h-4" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={(!content.trim() && !selectedImage) || isSubmitting}
                    className={cn(
                        "p-2.5 rounded-full transition-all duration-200 shadow-sm",
                        (!content.trim() && !selectedImage) || isSubmitting
                            ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                            : "bg-terracotta text-white hover:bg-terracotta/90 hover:shadow-md hover:scale-105"
                    )}
                >
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4 ml-0.5" />
                    )}
                </button>
            </div>
        </form>
    );
};
