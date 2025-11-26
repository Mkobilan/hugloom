'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'
import { getMessages, markConversationAsRead, editMessage } from '@/app/messages/actions'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface ConversationViewProps {
    conversationId: string
    currentUserId: string
    initialMessages?: any[] // Optional initial data
}

export function ConversationView({ conversationId, currentUserId, initialMessages = [] }: ConversationViewProps) {
    const [messages, setMessages] = useState<any[]>(initialMessages)
    const [isLoading, setIsLoading] = useState(!initialMessages.length)
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)

    // Initial fetch and mark as read
    useEffect(() => {
        const init = async () => {
            if (!initialMessages.length) {
                try {
                    const data = await getMessages(conversationId)
                    setMessages(data)
                } catch (error) {
                    console.error('Failed to fetch messages', error)
                } finally {
                    setIsLoading(false)
                }
            }
            await markConversationAsRead(conversationId)
        }
        init()
    }, [conversationId, initialMessages.length])

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length])

    // Real-time subscriptions
    useEffect(() => {
        const channel = supabase
            .channel(`conversation:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                async (payload) => {
                    // Fetch full message details including sender
                    const { data: newMessage } = await supabase
                        .from('messages')
                        .select(`
                            *,
                            sender:profiles(id, username, full_name, avatar_url),
                            reactions:message_reactions(
                                id,
                                type,
                                user_id,
                                user:profiles(username)
                            )
                        `)
                        .eq('id', payload.new.id)
                        .single()

                    if (newMessage) {
                        setMessages(prev => [...prev, newMessage])

                        // Mark as read if we are viewing
                        if (document.visibilityState === 'visible') {
                            await markConversationAsRead(conversationId)
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    setMessages(prev => prev.map(msg =>
                        msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
                    ))
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    // We handle soft deletes via UPDATE usually, but if hard delete happens:
                    setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'message_reactions',
                    // We can't easily filter by message_id list here for all messages
                    // So we listen to all reactions and filter in client or fetch
                    // Ideally we filter by message_id in (ids...) but that's hard with dynamic list
                    // For now, we'll just refetch the specific message or update local state if we have enough info
                },
                async (payload) => {
                    // Refetch the message to get updated reactions
                    // This is a bit inefficient but ensures correctness
                    // Optimization: Optimistic updates in MessageReactions component
                    const messageId = (payload.new as any)?.message_id || (payload.old as any)?.message_id
                    if (messageId) {
                        const { data: updatedMessage } = await supabase
                            .from('messages')
                            .select(`
                                *,
                                sender:profiles(id, username, full_name, avatar_url),
                                reactions:message_reactions(
                                    id,
                                    type,
                                    user_id,
                                    user:profiles(username)
                                )
                            `)
                            .eq('id', messageId)
                            .single()

                        if (updatedMessage) {
                            setMessages(prev => prev.map(msg =>
                                msg.id === messageId ? updatedMessage : msg
                            ))
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversationId, supabase])

    const handleTyping = async (isTyping: boolean) => {
        setIsTyping(isTyping)
        if (isTyping) {
            await supabase
                .from('typing_indicators')
                .upsert({
                    conversation_id: conversationId,
                    user_id: currentUserId,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'conversation_id, user_id' })
        } else {
            await supabase
                .from('typing_indicators')
                .delete()
                .eq('conversation_id', conversationId)
                .eq('user_id', currentUserId)
        }
    }

    const handleEditMessage = async (message: any) => {
        const newContent = prompt('Edit message:', message.content)
        if (newContent !== null && newContent !== message.content) {
            try {
                await editMessage(message.id, newContent)
            } catch (error) {
                console.error('Failed to edit message', error)
                alert('Failed to edit message')
            }
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-[#3C3434] rounded-2xl shadow-sm border border-terracotta/10 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <p>No messages yet.</p>
                        <p className="text-sm">Say hello! 👋</p>
                    </div>
                ) : (
                    <>
                        {/* Load More Button (if needed) */}
                        {/* {hasMore && <button onClick={loadMore} ...>Load More</button>} */}

                        {messages.map((message, index) => {
                            const isOwn = message.sender_id === currentUserId
                            const showDate = index === 0 ||
                                new Date(message.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString()

                            return (
                                <div key={message.id}>
                                    {showDate && (
                                        <div className="flex justify-center my-4">
                                            <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                                                {format(new Date(message.created_at), 'MMMM d, yyyy')}
                                            </span>
                                        </div>
                                    )}
                                    <MessageBubble
                                        message={message}
                                        isOwn={isOwn}
                                        onEdit={handleEditMessage}
                                    />
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Typing Indicator */}
            <TypingIndicator conversationId={conversationId} currentUserId={currentUserId} />

            {/* Input Area */}
            <MessageInput conversationId={conversationId} onTyping={handleTyping} />
        </div>
    )
}
