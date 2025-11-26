'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function NotificationListener() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        // Request notification permission on mount
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission()
            }
        }

        // Get current user
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUserId(user?.id || null)
        }
        getUser()
    }, [supabase])

    useEffect(() => {
        if (!userId) return

        const channel = supabase
            .channel('global_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                async (payload) => {
                    const newMessage = payload.new

                    // Ignore own messages
                    if (newMessage.sender_id === userId) return

                    // Check if we are already in this conversation
                    // Path format: /messages/[conversationId]
                    const isInConversation = pathname === `/messages/${newMessage.conversation_id}`

                    // If we are in the conversation and the window is focused, don't notify
                    if (isInConversation && document.visibilityState === 'visible') return

                    // Check if user is a participant in this conversation
                    // We need to verify this because we're listening to ALL messages in public schema
                    // Alternatively, we could subscribe to user-specific channel if we had one, 
                    // but checking participation here is safer for row level security context
                    const { data: participation } = await supabase
                        .from('conversation_participants')
                        .select('id')
                        .eq('conversation_id', newMessage.conversation_id)
                        .eq('user_id', userId)
                        .single()

                    if (!participation) return

                    // Fetch sender details
                    const { data: sender } = await supabase
                        .from('profiles')
                        .select('username, full_name')
                        .eq('id', newMessage.sender_id)
                        .single()

                    if (sender) {
                        const title = `New message from ${sender.full_name || sender.username}`
                        const body = newMessage.content || (newMessage.media_url ? 'Sent an attachment' : 'Sent a message')

                        // Send notification
                        if (Notification.permission === 'granted') {
                            const notification = new Notification(title, {
                                body: body.length > 50 ? body.substring(0, 50) + '...' : body,
                                icon: '/icon.png', // Assuming we have an icon, or fallback to default
                                tag: `message-${newMessage.conversation_id}` // Group notifications by conversation
                            })

                            notification.onclick = () => {
                                window.focus()
                                router.push(`/messages/${newMessage.conversation_id}`)
                                notification.close()
                            }
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, pathname, router, supabase])

    return null // This component doesn't render anything
}
