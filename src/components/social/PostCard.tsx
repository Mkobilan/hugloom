"use client";
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export const PostCard = ({ post }: { post: any }) => {
    const supabase = createClient();
    const [userId, setUserId] = useState<string | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.reactions?.length || 0);
    const [isLikeLoading, setIsLikeLoading] = useState(false);

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
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

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
            setLikesCount(prev => !newIsLiked ? prev + 1 : prev - 1);
        } finally {
            setIsLikeLoading(false);
        }
    };

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-terracotta/10 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center text-sage font-bold text-lg">
                    {post.profiles?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                    <h3 className="font-bold text-sm text-foreground">{post.profiles?.full_name || 'Anonymous'}</h3>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : 'Just now'}
                    </p>
                </div>
            </div>

            <p className="text-black mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>

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
