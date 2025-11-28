'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function NotificationListener() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])
    const [userId, setUserId] = useState<string | null>(null)

    // Use a ref to track the current pathname without triggering re-subscriptions
    const pathnameRef = useRef(pathname)

    useEffect(() => {
        pathnameRef.current = pathname
    }, [pathname])

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
            if (user) {
                setUserId(user.id)
            }
        }
        getUser()
    }, [supabase])

    // 1. Realtime Subscription for Notifications Table
    useEffect(() => {
        if (!userId) return

        const channel = supabase
            .channel('global_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                async (payload) => {
                    const notification = payload.new

                    // Check if we should suppress based on current view (e.g. if viewing the chat)
                    // For messages, we might want to suppress if in that chat
                    if (notification.type === 'message' && notification.link) {
                        const currentPath = pathnameRef.current
                        if (currentPath === notification.link && document.visibilityState === 'visible') {
                            return
                        }
                    }

                    // Play sound
                    try {
                        const audio = new Audio('/sounds/notification.wav')
                        await audio.play().catch(() => { })
                    } catch (e) {
                        // Ignore audio errors
                    }

                    // Trigger in-app toast
                    toast.message(notification.title, {
                        description: notification.message,
                        action: notification.link ? {
                            label: 'View',
                            onClick: () => router.push(notification.link!)
                        } : undefined,
                    })

                    // Browser Notification
                    if (Notification.permission === 'granted') {
                        try {
                            const n = new Notification(notification.title, {
                                body: notification.message,
                                icon: '/hugloom_logo.png',
                                tag: notification.type
                            })

                            if (notification.link) {
                                n.onclick = () => {
                                    window.focus()
                                    router.push(notification.link!)
                                    n.close()
                                }
                            }
                        } catch (e) {
                            console.error('Error creating notification:', e)
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, supabase, router])

    // 2. Polling for Care Task Reminders
    useEffect(() => {
        if (!userId) return

        const checkReminders = async () => {
            try {
                // Get settings
                const { data: settings, error: settingsError } = await supabase
                    .from('notification_settings')
                    .select('*')
                    .eq('user_id', userId)
                    .single()

                if (settingsError && settingsError.code !== 'PGRST116') {
                    console.warn('Could not fetch notification settings:', settingsError)
                    return
                }

                const reminderMinutes = settings?.care_task_reminder_minutes || [15]
                if (reminderMinutes.length === 0) return

                const now = new Date()
                const today = now.toISOString().split('T')[0]

                // 1. Check Medications
                const { data: medications } = await supabase
                    .from('medications')
                    .select('*')
                    .eq('user_id', userId) // Or circle_id if we want to support that, but for now user's own/assigned
                    .eq('active', true)
                    .eq('reminder_enabled', true)

                if (medications) {
                    medications.forEach(med => {
                        med.times.forEach((time: string) => {
                            const scheduledTime = new Date(`${today}T${time}:00`)
                            const diffMs = scheduledTime.getTime() - now.getTime()
                            const diffMinutes = Math.round(diffMs / 60000)

                            if (reminderMinutes.some((m: number) => Math.abs(diffMinutes - m) <= 1)) {
                                const key = `reminder-med-${med.id}-${time}-${today}`
                                if (sessionStorage.getItem(key)) return

                                sessionStorage.setItem(key, 'true')

                                supabase.from('notifications').insert({
                                    user_id: userId,
                                    type: 'care_task',
                                    title: 'Medication Reminder',
                                    message: `Time to take ${med.name} (${med.dosage})`,
                                    link: '/care',
                                    read: false,
                                    metadata: { medication_id: med.id, scheduled_time: time }
                                }).then(({ error }) => {
                                    if (error) console.error('Error creating medication reminder:', error)
                                })
                            }
                        })
                    })
                }

                // 2. Check Calendar Events
                // Look ahead max reminder time + buffer
                const maxLookahead = Math.max(...reminderMinutes) + 5
                const maxTime = new Date(now.getTime() + maxLookahead * 60000)

                const { data: events } = await supabase
                    .from('calendar_events')
                    .select('*')
                    .or(`created_by.eq.${userId},circle_id.not.is.null`) // Fetch own events and circle events
                    .gte('start_time', now.toISOString())
                    .lte('start_time', maxTime.toISOString())

                if (events) {
                    events.forEach(event => {
                        const startTime = new Date(event.start_time)
                        const diffMs = startTime.getTime() - now.getTime()
                        const diffMinutes = Math.round(diffMs / 60000)

                        if (reminderMinutes.some((m: number) => Math.abs(diffMinutes - m) <= 1)) {
                            // Create unique key using event ID, scheduled time, and date
                            // This prevents duplicates when multiple events are at the same time
                            const scheduledTimeStr = startTime.toTimeString().slice(0, 5) // HH:MM format
                            const scheduledDate = startTime.toISOString().split('T')[0] // YYYY-MM-DD
                            const key = `reminder-event-${event.id}-${scheduledTimeStr}-${scheduledDate}`

                            if (sessionStorage.getItem(key)) return

                            sessionStorage.setItem(key, 'true')

                            supabase.from('notifications').insert({
                                user_id: userId,
                                type: 'care_task',
                                title: 'Upcoming Event',
                                message: `${event.title} starts in ${diffMinutes} minutes`,
                                link: '/calendar',
                                read: false,
                                metadata: { event_id: event.id, event_type: event.event_type }
                            }).then(({ error }) => {
                                if (error) console.error('Error creating event reminder:', error)
                            })
                        }
                    })
                }

            } catch (error) {
                console.error('Error checking reminders:', error)
            }
        }

        // Run check every minute
        const interval = setInterval(checkReminders, 60000)
        checkReminders() // Run immediately

        return () => clearInterval(interval)
    }, [userId, supabase])

    // Unlock audio
    useEffect(() => {
        const unlockAudio = () => {
            const audio = new Audio('/sounds/notification.wav')
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

    return null
}
