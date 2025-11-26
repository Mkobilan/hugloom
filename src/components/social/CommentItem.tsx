"use client";

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, MoreHorizontal, Trash2, Edit2, X, Check, CornerDownRight, Share2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { CommentInput } from './CommentInput';
import { ImageModal } from './ImageModal';
import { ShareModal } from './ShareModal';

interface CommentItemProps {
    comment: any;
    currentUserId: string | null;
    onCommentUpdated: () => void;
    depth?: number;
}

export const CommentItem = ({
    comment,
    currentUserId,
    onCommentUpdated,
    depth = 0
}: CommentItemProps) => {
    const supabase = createClient();
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [showMenu, setShowMenu] = useState(false);
    const [isLiked, setIsLiked] = useState(
        comment.comment_reactions?.some((r: any) => r.user_id === currentUserId)
    );
    const [likesCount, setLikesCount] = useState(comment.comment_reactions?.length || 0);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const isOwner = currentUserId === comment.user_id;
    const maxDepth = 3; // Limit nesting depth for UI sanity

    const handleLike = async () => {
        if (!currentUserId || isLikeLoading) return;

        setIsLikeLoading(true);
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount((prev: number) => newIsLiked ? prev + 1 : prev - 1);

        try {
            if (newIsLiked) {
                const { error } = await supabase
                    .from('comment_reactions')
                    .insert({
                        comment_id: comment.id,
                        user_id: currentUserId,
                        type: 'hug'
                    });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('comment_reactions')
                    .delete()
                    .eq('comment_id', comment.id)
                    .eq('user_id', currentUserId);
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            setIsLiked(!newIsLiked);
            setLikesCount((prev: number) => !newIsLiked ? prev + 1 : prev - 1);
        } finally {
            setIsLikeLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', comment.id);

        if (!error) {
            onCommentUpdated();
        }
    };

    const handleEdit = async () => {
        if (!editContent.trim()) return;

        const { error } = await supabase
            .from('comments')
            .update({ content: editContent, updated_at: new Date().toISOString() })
            .eq('id', comment.id);

        if (!error) {
            setIsEditing(false);
            onCommentUpdated();
        }
    };

    return (
        <div className={cn("group", depth > 0 && "ml-4 sm:ml-8")}>
            <div className="flex gap-3 py-3">
                <Link href={`/u/${comment.profiles?.username}`} className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center text-sage font-bold text-sm overflow-hidden">
                        {comment.profiles?.avatar_url ? (
                            <img
                                src={comment.profiles.avatar_url}
                                alt={comment.profiles.username}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            comment.profiles?.username?.[0]?.toUpperCase() || '?'
                        )}
                    </div>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="bg-slate-50 rounded-2xl p-3 relative group-hover:bg-slate-100 transition-colors">
                        <div className="flex justify-between items-start gap-2">
                            <Link href={`/u/${comment.profiles?.username}`} className="font-semibold text-sm text-black hover:underline">
                                @{comment.profiles?.username || 'anonymous'}
                            </Link>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                        </div>

                        {isEditing ? (
                            <div className="mt-2">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-border text-sm focus:ring-2 focus:ring-terracotta/20 text-black"
                                    rows={2}
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="p-1 text-muted-foreground hover:bg-slate-200 rounded"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleEdit}
                                        className="p-1 text-terracotta hover:bg-terracotta/10 rounded"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-1 text-sm text-black break-words">
                                {comment.content}
                            </div>
                        )}

                        {comment.media_url && !isEditing && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-border/50 max-w-[200px]">
                                <img
                                    src={comment.media_url}
                                    alt="Comment attachment"
                                    className="w-full h-auto object-cover cursor-pointer hover:opacity-95"
                                    onClick={() => setShowImageModal(true)}
                                />
                            </div>
                        )}

                        {isOwner && !isEditing && (
                            <div className="absolute top-2 right-2">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1 text-black hover:bg-slate-200 rounded-full"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-border z-10 py-1 min-w-[100px]">
                                        <button
                                            onClick={() => {
                                                setIsEditing(true);
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 flex items-center gap-2 text-black font-medium"
                                        >
                                            <Edit2 className="w-3 h-3" /> Edit
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="w-full px-3 py-1.5 text-left text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mt-1 ml-2">
                        <button
                            onClick={handleLike}
                            className={cn(
                                "flex items-center gap-1 text-xs font-medium transition-colors",
                                isLiked ? "text-terracotta" : "text-muted-foreground hover:text-terracotta"
                            )}
                        >
                            <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
                            {likesCount > 0 && likesCount}
                        </button>

                        {depth < maxDepth && (
                            <button
                                onClick={() => setIsReplying(!isReplying)}
                                className="text-xs font-medium text-black hover:underline transition-colors"
                            >
                                Reply
                            </button>
                        )}

                        <button
                            onClick={() => setShowShareModal(true)}
                            className="text-xs font-medium text-muted-foreground hover:text-black transition-colors flex items-center gap-1"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {isReplying && (
                        <div className="mt-3">
                            <CommentInput
                                postId={comment.post_id}
                                parentId={comment.id}
                                onCommentAdded={() => {
                                    setIsReplying(false);
                                    onCommentUpdated();
                                }}
                                onCancel={() => setIsReplying(false)}
                                autoFocus
                                placeholder={`Reply to @${comment.profiles?.username}...`}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Comments */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="relative">
                    {/* Thread line */}
                    <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border/50 -z-10" />
                    {comment.replies.map((reply: any) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            currentUserId={currentUserId}
                            onCommentUpdated={onCommentUpdated}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}

            {showImageModal && comment.media_url && (
                <ImageModal
                    imageUrl={comment.media_url}
                    onClose={() => setShowImageModal(false)}
                />
            )}

            {showShareModal && (
                <ShareModal
                    postId={comment.post_id}
                    postContent={comment.content}
                    username={comment.profiles?.username || 'anonymous'}
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </div>
    );
};
