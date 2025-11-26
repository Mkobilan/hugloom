'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function NotificationListener() {
    const pathname = usePathname()
    const router = useRouter()
        ```javascript
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
                    const isInConversation = pathname === `/ messages / ${ newMessage.conversation_id }`

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
                        const title = `New message from ${ sender.full_name || sender.username } `
                        const body = newMessage.content || (newMessage.media_url ? 'Sent an attachment' : 'Sent a message')

                        console.log('Triggering notification:', title)

                        // Play sound
                        try {
                            const audio = new Audio('/notification.mp3') // You might need to add this file or use a base64 string
                            audio.play()
                        } catch (e) {
                            console.error('Error playing sound', e)
                        }

                        // Send notification
                        if (Notification.permission === 'granted') {
                            try {
                                const notification = new Notification(title, {
                                    body: body.length > 50 ? body.substring(0, 50) + '...' : body,
                                    icon: '/icon.png', // Assuming we have an icon, or fallback to default
                                    tag: `message - ${ newMessage.conversation_id } `, // Group notifications by conversation
                                    silent: false // Request sound if browser supports it
                                })

                                notification.onclick = () => {
                                    window.focus()
                                    router.push(`/ messages / ${ newMessage.conversation_id } `)
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
    }, [userId, pathname, router, supabase])

    return null // This component doesn't render anything
}
```
