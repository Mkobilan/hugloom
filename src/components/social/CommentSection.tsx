"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CommentInput } from './CommentInput';
import { CommentItem } from './CommentItem';
import { Loader2 } from 'lucide-react';

interface CommentSectionProps {
    postId: string;
    isOpen: boolean;
}

export const CommentSection = ({ postId, isOpen }: CommentSectionProps) => {
    const [comments, setComments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const supabase = createClient();

    const fetchComments = useCallback(async () => {
        if (!isOpen) return;

        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);

            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        avatar_url
                    ),
                    comment_reactions (
                        user_id,
                        type
                    )
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Organize into tree structure
            const commentMap = new Map();
            const roots: any[] = [];

            data?.forEach(comment => {
                comment.replies = [];
                commentMap.set(comment.id, comment);
            });

            data?.forEach(comment => {
                if (comment.parent_id) {
                    const parent = commentMap.get(comment.parent_id);
                    if (parent) {
                        parent.replies.push(comment);
                    } else {
                        // If parent is not found (shouldn't happen with cascade), 
                        // we can either hide it or show it as root. 
                        // Showing as root might be confusing if it was meant to be a reply.
                        // Let's keep it as root for now but maybe we should filter it?
                        roots.push(comment);
                    }
                } else {
                    roots.push(comment);
                }
            });

            setComments(roots);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setIsLoading(false);
        }
    }, [postId, isOpen]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    // Scroll to comment if deep linked
    useEffect(() => {
        if (!isLoading && comments.length > 0 && typeof window !== 'undefined') {
            const hash = window.location.hash;
            if (hash.startsWith('#comment-')) {
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                    const element = document.querySelector(hash);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Add a highlight effect
                        element.classList.add('bg-terracotta/5');
                        setTimeout(() => element.classList.remove('bg-terracotta/5'), 2000);
                    }
                }, 100);
            }
        }
    }, [isLoading, comments]);

    if (!isOpen) return null;

    return (
        <div className="pt-4 mt-4 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
            <div className="mb-6">
                <CommentInput
                    postId={postId}
                    onCommentAdded={fetchComments}
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="space-y-1">
                    {comments.length === 0 ? (
                        <p className="text-center text-muted-foreground text-sm py-4">
                            No comments yet. Be the first to share your thoughts!
                        </p>
                    ) : (
                        comments.map(comment => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                currentUserId={currentUserId}
                                onCommentUpdated={fetchComments}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
