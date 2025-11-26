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
            console.log('Current notification permission:', Notification.permission)
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(perm => {
                    console.log('Notification permission requested:', perm)
                })
            }
        }

        // Get current user
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                console.log('NotificationListener active for user:', user.id)
                setUserId(user.id)
            }
        }
        getUser()
    }, [supabase])

    useEffect(() => {
        if (!userId) return

        console.log('Setting up realtime subscription for messages...')
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
                    console.log('New message received via realtime:', payload)
                    const newMessage = payload.new

                    // Ignore own messages
                    if (newMessage.sender_id === userId) {
                        console.log('Ignoring own message')
                        return
                    }

                    // Check if we are already in this conversation
                    // Path format: /messages/[conversationId]
                    const isInConversation = pathname === `/messages/${newMessage.conversation_id}`

                    // If we are in the conversation and the window is focused, don't notify
                    if (isInConversation && document.visibilityState === 'visible') {
                        console.log('User is viewing conversation, suppressing notification')
                        return
                    }

                    // Fetch sender details
                    const { data: sender, error } = await supabase
                        .from('profiles')
                        .select('username, full_name')
                        .eq('id', newMessage.sender_id)
                        .single()

                    if (error) {
                        console.error('Error fetching sender details:', error)
                        return
                    }

                    if (sender) {
                        const title = `New message from ${sender.full_name || sender.username}`
                        const body = newMessage.content || (newMessage.media_url ? 'Sent an attachment' : 'Sent a message')

                        console.log('Triggering notification:', title)

                        // Play sound
                        try {
                            // Simple notification beep (base64)
                            const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU')
                            await audio.play().catch(e => console.log('Audio play failed (user interaction needed):', e))
                        } catch (e) {
                            console.error('Error initializing audio', e)
                        }

                        // Send notification
                        if (Notification.permission === 'granted') {
                            try {
                                // Check if service worker is ready (better for mobile)
                                if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                                    try {
                                        const registration = await navigator.serviceWorker.ready
                                        registration.showNotification(title, {
                                            body: body.length > 50 ? body.substring(0, 50) + '...' : body,
                                            icon: '/hugloom_logo.png',
                                            tag: `message-${newMessage.conversation_id}`,
                                            silent: false
                                        })
                                    } catch (swError) {
                                        console.error('Service Worker notification failed, falling back to standard API', swError)
                                        // Fallback logic below
                                        throw swError
                                    }
                                } else {
                                    throw new Error('Service Worker not ready')
                                }
                            } catch (e) {
                                // Fallback to standard Notification API
                                console.log('Using standard Notification API fallback')
                                try {
                                    const notification = new Notification(title, {
                                        body: body.length > 50 ? body.substring(0, 50) + '...' : body,
                                        icon: '/hugloom_logo.png',
                                        tag: `message-${newMessage.conversation_id}`, // Group notifications by conversation
                                        silent: false // Request sound if browser supports it
                                    })

                                    notification.onclick = () => {
                                        window.focus()
                                        router.push(`/messages/${newMessage.conversation_id}`)
                                        notification.close()
                                    }
                                } catch (notificationError) {
                                    console.error('Standard Notification API failed:', notificationError)
                                }
                            }
                        } else {
                            console.log('Notification permission not granted:', Notification.permission)
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, pathname, router, supabase])

    return null // This component doesn't render anything
}
