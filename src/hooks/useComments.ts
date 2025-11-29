import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    parent_id: string | null;
    content: string;
    media_url: string | null;
    created_at: string;
    updated_at: string;
    profiles: {
        username: string;
        avatar_url: string | null;
    };
    comment_reactions: {
        user_id: string;
        type: string;
    }[];
    replies: Comment[];
}

export const useComments = (postId: string) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [rootComments, setRootComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const supabase = createClient();

    const fetchComments = useCallback(async () => {
        if (!postId) return;

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
            const commentMap = new Map<string, Comment>();
            const roots: Comment[] = [];

            // First pass: Initialize map and replies array
            data?.forEach((comment: any) => {
                comment.replies = [];
                commentMap.set(comment.id, comment);
            });

            // Second pass: Link parents and children
            data?.forEach((comment: any) => {
                if (comment.parent_id) {
                    const parent = commentMap.get(comment.parent_id);
                    if (parent) {
                        parent.replies.push(comment);
                    } else {
                        // Orphaned comment, treat as root
                        roots.push(comment);
                    }
                } else {
                    roots.push(comment);
                }
            });

            // Sort roots by created_at descending (newest first)
            roots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setComments(data as Comment[]);
            setRootComments(roots);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setIsLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const getCommentById = useCallback((id: string) => {
        return comments.find(c => c.id === id);
    }, [comments]);

    return {
        comments,
        rootComments,
        isLoading,
        currentUserId,
        refreshComments: fetchComments,
        getCommentById
    };
};
