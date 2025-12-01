'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [isLoading, setIsLoading] = useState(true)
    const [isAllowed, setIsAllowed] = useState(false)

    useEffect(() => {
        const checkSubscription = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                // Not logged in, let middleware handle it or allow public access
                setIsAllowed(true)
                setIsLoading(false)
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('is_subscribed')
                .eq('id', user.id)
                .single()

            // If subscribed, allow
            if (profile?.is_subscribed) {
                setIsAllowed(true)
            } else {
                // If not subscribed, check if we are already on onboarding
                if (pathname.startsWith('/onboarding')) {
                    setIsAllowed(true)
                } else {
                    // Redirect to onboarding
                    router.push('/onboarding')
                    setIsAllowed(false)
                    return // Don't set loading to false yet as we are redirecting
                }
            }
            setIsLoading(false)
        }

        checkSubscription()
    }, [pathname, router])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
            </div>
        )
    }

    if (!isAllowed) {
        return null
    }

    return <>{children}</>
}
