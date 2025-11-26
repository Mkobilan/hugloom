"use client";

import { useEffect } from 'react';
import { CommentInput } from './CommentInput';
import { CommentItem } from './CommentItem';
import { Loader2 } from 'lucide-react';
import { useComments } from '@/hooks/useComments';

interface CommentSectionProps {
    postId: string;
    isOpen: boolean;
}

export const CommentSection = ({ postId, isOpen }: CommentSectionProps) => {
    const { rootComments, comments, isLoading, currentUserId, refreshComments } = useComments(postId);

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
                    onCommentAdded={refreshComments}
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="space-y-1">
                    {rootComments.length === 0 ? (
                        <p className="text-center text-muted-foreground text-sm py-4">
                            No comments yet. Be the first to share your thoughts!
                        </p>
                    ) : (
                        rootComments.map(comment => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                currentUserId={currentUserId}
                                onCommentUpdated={refreshComments}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
