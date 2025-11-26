"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useComments, Comment } from '@/hooks/useComments';
import { CommentItem } from '@/components/social/CommentItem';
import { CommentInput } from '@/components/social/CommentInput';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ThreadPage() {
    const params = useParams();
    const router = useRouter();
    const commentId = params.commentId as string;
    const [targetComment, setTargetComment] = useState<Comment | null>(null);
    const [loadingTarget, setLoadingTarget] = useState(true);
    const supabase = createClient();

    // First fetch the target comment to get the post_id
    useEffect(() => {
        const fetchTarget = async () => {
            const { data, error } = await supabase
                .from('comments')
                .select('post_id')
                .eq('id', commentId)
                .single();

            if (data) {
                // We just need the post_id to initialize the hook
                setTargetComment({ post_id: data.post_id } as any);
            }
            setLoadingTarget(false);
        };
        fetchTarget();
    }, [commentId]);

    // Then use the hook to get the full tree
    const { comments, getCommentById, refreshComments, currentUserId, isLoading: isTreeLoading } = useComments(targetComment?.post_id || '');

    const isLoading = loadingTarget || isTreeLoading;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-[#4A4042]">
                <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
            </div>
        );
    }

    const fullTargetComment = getCommentById(commentId);

    if (!fullTargetComment) {
        return (
            <div className="max-w-2xl mx-auto p-4 text-center bg-[#4A4042] min-h-screen">
                <p className="text-muted-foreground">Comment not found.</p>
                <Link href="/" className="text-terracotta hover:underline mt-2 inline-block">
                    Go Home
                </Link>
            </div>
        );
    }

    // Build ancestor chain
    const ancestors: Comment[] = [];
    let current = fullTargetComment;
    while (current.parent_id) {
        const parent = getCommentById(current.parent_id);
        if (parent) {
            ancestors.unshift(parent);
            current = parent;
        } else {
            break;
        }
    }

    return (
        <div className="max-w-2xl mx-auto min-h-screen bg-[#4A4042] border-x border-border/50">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#4A4042]/95 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-bold text-lg text-white">Thread</h1>
            </div>

            <div className="p-4">
                {/* Ancestors */}
                <div className="mb-4">
                    {ancestors.map(ancestor => (
                        <div key={ancestor.id} className="relative">
                            <CommentItem
                                comment={ancestor}
                                currentUserId={currentUserId}
                                onCommentUpdated={refreshComments}
                                isThreadView={true}
                            />
                            {/* Connector line to next item */}
                            <div className="absolute left-[27px] top-[60px] bottom-[-16px] w-0.5 bg-border/50 -z-10" />
                        </div>
                    ))}
                </div>

                {/* Main Comment */}
                <div className="relative">
                    <div className="text-xl">
                        <CommentItem
                            comment={fullTargetComment}
                            currentUserId={currentUserId}
                            onCommentUpdated={refreshComments}
                            isThreadView={true}
                            isHero={true}
                        />
                    </div>
                </div>

                {/* Reply Input */}
                <div className="py-4 border-b border-border/50">
                    <CommentInput
                        postId={fullTargetComment.post_id}
                        parentId={fullTargetComment.id}
                        onCommentAdded={refreshComments}
                        placeholder={`Reply to @${fullTargetComment.profiles?.username}...`}
                    />
                </div>

                {/* Replies */}
                <div className="mt-4">
                    {fullTargetComment.replies?.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            currentUserId={currentUserId}
                            onCommentUpdated={refreshComments}
                            isThreadView={true}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
