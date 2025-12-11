'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Conversation {
    id: string
    last_message_at: string
    last_message_preview: string
    participants: {
        user: {
            id: string
            username: string
            full_name: string
            avatar_url: string
        }
        last_read_at: string
        is_archived: boolean
    }[]
}

interface ChatListProps {
    initialConversations: Conversation[]
    currentUserId: string
}

export function ChatList({ initialConversations, currentUserId }: ChatListProps) {
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        // Subscribe to conversation updates
        const channel = supabase
            .channel('user-conversations')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'conversations'
                },
                (payload) => {
                    // Update the specific conversation in the list
                    setConversations(prev => {
                        const updated = prev.map(conv =>
                            conv.id === payload.new.id
                                ? { ...conv, ...payload.new }
                                : conv
                        )
                        // Re-sort by last_message_at
                        return updated.sort((a, b) =>
                            new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
                        )
                    })
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'conversations'
                },
                async (payload) => {
                    // For new conversations, we need to fetch the full details including participants
                    // This is a bit complex real-time, so for now we can just refresh the page or fetch via action
                    // A simple way is to re-fetch all conversations or just reload
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, router])

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="p-4 bg-sage/10 rounded-full mb-4 text-sage">
                    <MessageCircle className="w-12 h-12" />
                </div>
                <h3 className="font-bold text-lg mb-2">No messages yet</h3>
                <p className="text-muted-foreground mb-6">Start a conversation from a user's profile.</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {conversations.map((conversation) => {
                // Find the other participant
                const myParticipant = conversation.participants.find(
                    p => p.user.id === currentUserId
                )

                if (!myParticipant) return null

                // Find the other participant (might be undefined if they left or were deleted)
                const otherParticipant = conversation.participants.find(
                    p => p.user.id !== currentUserId
                )

                const displayName = otherParticipant?.user.full_name || otherParticipant?.user.username || 'Deleted User'
                const displayAvatar = otherParticipant?.user.avatar_url
                const displayInitials = (displayName[0] || '?').toUpperCase()

                const isUnread = new Date(conversation.last_message_at) > new Date(myParticipant.last_read_at)

                return (
                    <div
                        key={conversation.id}
                        onClick={() => router.push(`/messages/${conversation.id}`)}
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:bg-sky-600/90 border border-transparent hover:border-sky-600/50 bg-sky-600 shadow-md",
                            isUnread && "ring-2 ring-sky-600/30"
                        )}
                    >
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                                {displayAvatar ? (
                                    <img
                                        src={displayAvatar}
                                        alt={displayName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-lg">
                                        {displayInitials}
                                    </div>
                                )}
                            </div>
                            {/* Online status could go here */}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className={cn("font-bold truncate text-white")}>
                                    {displayName}
                                </h3>
                                <span className={cn("text-xs whitespace-nowrap ml-2", isUnread ? "text-white font-bold" : "text-white/70")}>
                                    {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className={cn("text-sm truncate max-w-[80%]", isUnread ? "text-white font-medium" : "text-white/80")}>
                                    {conversation.last_message_preview || 'Started a conversation'}
                                </p>
                                {isUnread && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
