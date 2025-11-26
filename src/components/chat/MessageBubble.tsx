'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { MoreHorizontal, Edit2, Trash2, Smile } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { addMessageReaction, removeMessageReaction, deleteMessage } from '@/app/messages/actions'

interface Message {
    id: string
    content: string
    created_at: string
    sender_id: string
    is_deleted: boolean
    is_edited: boolean
    media_url?: string
    media_type?: 'image' | 'file'
    media_filename?: string
    sender: {
        username: string
        avatar_url: string
        full_name: string
    }
    reactions: {
        id: string
        type: string
        user_id: string
        user: {
            username: string
        }
    }[]
}

interface MessageBubbleProps {
    message: Message
    isOwn: boolean
    onEdit: (message: Message) => void
}

export function MessageBubble({ message, isOwn, onEdit }: MessageBubbleProps) {
    const router = useRouter()
    const [showActions, setShowActions] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleProfileClick = () => {
        router.push(`/u/${message.sender.username}`)
    }

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this message?')) {
            setIsDeleting(true)
            try {
                await deleteMessage(message.id)
            } catch (error) {
                console.error('Failed to delete message', error)
                setIsDeleting(false)
            }
        }
    }

    const handleReaction = async (type: string) => {
        // Check if user already reacted with this type
        // This logic should ideally be in the parent or handled by optimistic updates
        // For now, we just call the action
        try {
            await addMessageReaction(message.id, type)
        } catch (error) {
            console.error('Failed to add reaction', error)
        }
    }

    if (message.is_deleted) {
        return (
            <div className={cn("flex w-full mb-4", isOwn ? "justify-end" : "justify-start")}>
                <div className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-500 italic text-sm border border-gray-200">
                    Message deleted
                </div>
            </div>
        )
    }

    return (
        <div
            className={cn("flex w-full mb-4 group", isOwn ? "justify-end" : "justify-start")}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className={cn("flex max-w-[70%] flex-col", isOwn ? "items-end" : "items-start")}>
                <div className="flex items-end gap-2">
                    {!isOwn && (
                        <div
                            onClick={handleProfileClick}
                            className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 mb-1 cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all"
                        >
                            {message.sender.avatar_url ? (
                                <img src={message.sender.avatar_url} alt={message.sender.username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-bold">
                                    {message.sender.username[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={cn(
                        "relative px-4 py-2 rounded-2xl shadow-sm text-white",
                        isOwn ? "bg-rose-500 rounded-br-none" : "bg-emerald-600 rounded-bl-none"
                    )}>
                        {/* Attachment Display */}
                        {message.media_url && (
                            <div className="mb-2">
                                {message.media_type === 'image' ? (
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/message-attachments/${message.media_url}`}
                                        alt="Attachment"
                                        className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/message-attachments/${message.media_url}`, '_blank')}
                                    />
                                ) : (
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/message-attachments/${message.media_url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn("flex items-center gap-2 p-2 rounded-lg", isOwn ? "bg-white/20" : "bg-gray-100")}
                                    >
                                        <span className="text-sm underline truncate max-w-[200px]">{message.media_filename || 'File Attachment'}</span>
                                    </a>
                                )}
                            </div>
                        )}

                        <p className="whitespace-pre-wrap break-words">{message.content}</p>

                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-white/70">
                            {message.is_edited && <span>(edited)</span>}
                            <span>{format(new Date(message.created_at), 'h:mm a')}</span>
                        </div>

                        {/* Reactions Display */}
                        {message.reactions && message.reactions.length > 0 && (
                            <div className="absolute -bottom-3 right-0 flex gap-1 bg-white rounded-full px-1.5 py-0.5 shadow-sm border border-border text-xs">
                                {message.reactions.map((reaction, i) => (
                                    <span key={i}>{reaction.type === 'hug' ? '🤗' : reaction.type === 'heart' ? '❤️' : '👍'}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Menu */}
                {showActions && (
                    <div className={cn("flex items-center gap-1 mt-1 px-2", isOwn ? "flex-row-reverse" : "flex-row")}>
                        <button
                            onClick={() => handleReaction('heart')}
                            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            title="Like"
                        >
                            <Smile className="w-4 h-4" />
                        </button>
                        {isOwn && (
                            <>
                                <button
                                    onClick={() => onEdit(message)}
                                    className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="p-1 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                                    title="Delete"
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
