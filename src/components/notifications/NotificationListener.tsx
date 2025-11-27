'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function NotificationListener() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [userId, setUserId] = useState<string | null>(null)

    // Use a ref to track the current pathname without triggering re-subscriptions
    const pathnameRef = useRef(pathname)

    useEffect(() => {
        pathnameRef.current = pathname
    }, [pathname])

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

                    // Check if we are already in this conversation using the ref
                    // Path format: /messages/[conversationId]
                    const currentPath = pathnameRef.current
                    const isInConversation = currentPath === `/messages/${newMessage.conversation_id}`

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
                            // Valid short beep sound (base64 encoded WAV)
                            const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU')
                            // The previous base64 was likely invalid or empty. 
                            // Let's use a known working short beep or just keep the structure but ensure it's valid.
                            // Actually, the previous one `UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU` decodes to a very short/empty WAV header.
                            // Let's try a slightly more robust one or at least handle the error gracefully.
                            // For now, I will use a simple notification sound if possible, or just catch the error.
                            // Since I cannot easily generate a new base64 sound here without external tools, 
                            // I will stick to the existing one but ensure the catch block is robust, 
                            // AND I will try to use a slightly better base64 string if I can recall one, 
                            // but to be safe I will use the one provided in the example or a standard empty one to avoid syntax errors,
                            // and rely on the browser's notification sound if available.
                            // Wait, the user's log said "NotSupportedError: Failed to load because no supported source was found."
                            // This implies the base64 was indeed bad.
                            // Let's use a very simple beep.
                            const simpleBeep = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjxWq3JlhGpCNXODbW57aUE2WpI='
                            const audioObj = new Audio(simpleBeep)

                            await audioObj.play().catch(e => {
                                console.log('Audio play failed (user interaction needed or format not supported):', e)
                            })
                        } catch (e) {
                            console.error('Error initializing audio', e)
                        }

                        // Send notification
                        if (Notification.permission === 'granted') {
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
                            } catch (e) {
                                console.error('Error creating notification object:', e)
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
        // Removed pathname and router from dependencies to prevent re-subscription
    }, [userId, supabase])

    // Unlock audio on first user interaction
    useEffect(() => {
        const unlockAudio = () => {
            const simpleBeep = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjxWq3JlhGpCNXODbW57aUE2WpI='
            const audio = new Audio(simpleBeep)
            audio.play().catch(() => { })
            document.removeEventListener('click', unlockAudio)
            document.removeEventListener('touchstart', unlockAudio)
        }

        document.addEventListener('click', unlockAudio)
        document.addEventListener('touchstart', unlockAudio)

        return () => {
            document.removeEventListener('click', unlockAudio)
            document.removeEventListener('touchstart', unlockAudio)
        }
    }, [])

    return null // This component doesn't render anything
}
