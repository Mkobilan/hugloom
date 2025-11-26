'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TypingIndicatorProps {
    conversationId: string
    currentUserId: string
}

export function TypingIndicator({ conversationId, currentUserId }: TypingIndicatorProps) {
    const [typingUsers, setTypingUsers] = useState<string[]>([])
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel(`typing:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'typing_indicators',
                    filter: `conversation_id=eq.${conversationId}`
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const userId = payload.new.user_id
                        if (userId !== currentUserId) {
                            // Fetch user name if needed, or just show "Someone is typing..."
                            // Ideally we have user data cached or fetch it
                            // For simplicity, we'll just track user IDs and show a generic message or fetch name
                            // Let's try to fetch the profile name
                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('username')
                                .eq('id', userId)
                                .single()

                            if (profile) {
                                setTypingUsers(prev => {
                                    if (!prev.includes(profile.username)) {
                                        return [...prev, profile.username]
                                    }
                                    return prev
                                })

                                // Auto-remove after 5 seconds (fallback if delete event missed)
                                setTimeout(() => {
                                    setTypingUsers(prev => prev.filter(u => u !== profile.username))
                                }, 5000)
                            }
                        }
                    } else if (payload.eventType === 'DELETE') {
                        // We need to know who stopped typing. The payload.old might only have ID
                        // But we stored usernames. This is a bit tricky with RLS and delete payload.
                        // Usually delete payload only has ID.
                        // We can just clear all typing users or rely on timeout.
                        // Or we can query the table to see who is left.
                        const { data: indicators } = await supabase
                            .from('typing_indicators')
                            .select('user:profiles(username)')
                            .eq('conversation_id', conversationId)
                            .neq('user_id', currentUserId)

                        if (indicators) {
                            setTypingUsers(indicators.map((i: any) => i.user.username))
                        } else {
                            setTypingUsers([])
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversationId, currentUserId, supabase])

    if (typingUsers.length === 0) return null

    return (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground animate-pulse">
            <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
            </div>
            <span>
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
        </div>
    )
}
