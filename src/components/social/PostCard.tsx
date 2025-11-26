"use client";
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Edit2, X, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export const PostCard = ({ post }: { post: any }) => {
    const supabase = createClient();
    const [userId, setUserId] = useState<string | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.reactions?.length || 0);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [displayContent, setDisplayContent] = useState(post.content);
    const [isDeleted, setIsDeleted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const isOwner = userId === post.user_id;

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                // Check if user has already liked
                const userReaction = post.reactions?.find((r: any) => r.user_id === user.id);
                setIsLiked(!!userReaction);
            }
        };
        getUser();
    }, [post.reactions]);

    const handleLike = async () => {
        if (!userId || isLikeLoading) return;

        setIsLikeLoading(true);

        // Optimistic update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount((prev: number) => newIsLiked ? prev + 1 : prev - 1);

        try {
            if (newIsLiked) {
                // Add reaction
                const { error } = await supabase
                    .from('reactions')
                    .insert({
                        post_id: post.id,
                        user_id: userId,
                        type: 'hug'
                    });
                if (error) throw error;
            } else {
                // Remove reaction
                const { error } = await supabase
                    .from('reactions')
                    .delete()
                    .eq('post_id', post.id)
                    .eq('user_id', userId);
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert optimistic update on error
            setIsLiked(!newIsLiked);
            setLikesCount((prev: number) => !newIsLiked ? prev + 1 : prev - 1);
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', post.id);

        if (!error) {
            setIsDeleted(true);
            router.refresh();
        }
    };

    const handleEdit = async () => {
        if (!editContent.trim()) return;
        setIsSaving(true);

        const { error } = await supabase
            .from('posts')
            .update({ content: editContent })
            .eq('id', post.id);

        if (!error) {
            setDisplayContent(editContent);
            setIsEditing(false);
            setShowMenu(false);
            router.refresh();
        }
        setIsSaving(false);
    };

    if (isDeleted) return null;

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-terracotta/10 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 mb-3 relative">
                <Link href={`/u/${post.profiles?.username}`}>
                    <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center text-sage font-bold text-lg overflow-hidden hover:opacity-80 transition-opacity">
                        {post.profiles?.avatar_url ? (
                            <img
                                src={post.profiles.avatar_url}
                                alt={post.profiles.username || 'User'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            post.profiles?.username?.[0]?.toUpperCase() || '?'
                        )}
                    </div>
                </Link>
                <div className="flex-1">
                    <h3 className="font-bold text-sm text-foreground">{post.profiles?.full_name || 'Anonymous'}</h3>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : 'Just now'}
                    </p>
                </div>
                {isOwner && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-border z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
                                <button
                                    onClick={() => {
                                        setIsEditing(true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-black font-medium"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isEditing ? (
                <div className="mb-4">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-50 border border-border focus:ring-2 focus:ring-terracotta/20 resize-none min-h-[100px] text-black"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleEdit}
                            disabled={isSaving}
                            className="p-2 text-white bg-terracotta hover:bg-terracotta/90 rounded-full transition-colors shadow-sm"
                        >
                            <Check className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-black mb-4 whitespace-pre-wrap leading-relaxed">{displayContent}</p>
            )}

            {post.media_urls?.length > 0 && (
                <div className="mb-4 rounded-xl overflow-hidden border border-border/50">
                    <img src={post.media_urls[0]} alt="Post content" className="w-full h-auto object-cover max-h-96" />
                </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border/30">
                <button
                    onClick={handleLike}
                    disabled={isLikeLoading}
                    className={cn(
                        "flex items-center gap-1.5 text-sm transition-colors group",
                        isLiked ? "text-terracotta" : "text-muted-foreground hover:text-terracotta"
                    )}
                >
                    <div className={cn(
                        "p-1.5 rounded-full transition-colors",
                        isLiked ? "bg-terracotta/10" : "group-hover:bg-terracotta/10"
                    )}>
                        <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                    </div>
                    <span className="font-medium">{likesCount} Hugs</span>
                </button>

                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-sage transition-colors group">
                    <div className="p-1.5 rounded-full group-hover:bg-sage/10 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{post.comments?.length || 0} Comments</span>
                </button>

                <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-black/5">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
