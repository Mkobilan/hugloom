"use client";
import { AppLayout } from '@/components/layout/AppLayout'
import { User, Settings, HelpCircle, LogOut, HeartHandshake, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const MenuItem = ({
    icon: Icon,
    label,
    href,
    color = "text-foreground",
    onClick
}: {
    icon: any,
    label: string,
    href?: string,
    color?: string,
    onClick?: () => void
}) => {
    if (onClick) {
        return (
            <button
                onClick={onClick}
                className="w-full text-left"
            >
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border/50 hover:bg-cream/50 transition-colors mb-3">
                    <div className={`p-2 rounded-full bg-cream ${color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-foreground flex-1">{label}</span>
                </div>
            </button>
        )
    }

    return (
        <Link href={href!}>
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border/50 hover:bg-cream/50 transition-colors mb-3">
                <div className={`p-2 rounded-full bg-cream ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-foreground flex-1">{label}</span>
            </div>
        </Link>
    )
}

export default function MorePage() {
    const router = useRouter()
    const supabase = createClient()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)

    useEffect(() => {
        const getUserAndProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                setProfile(profileData)
            }
        }
        getUserAndProfile()
    }, [])

    const handleSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) {
                console.error('Error signing out:', error.message)
                return
            }
            // Redirect to login page after successful sign out
            router.push('/login')
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-heading font-bold text-terracotta mb-6">Menu</h1>

                <div className="mb-8 flex items-center gap-4 p-4 bg-terracotta/10 rounded-2xl">
                    <div className="w-16 h-16 rounded-full bg-terracotta/20 flex items-center justify-center text-terracotta font-bold text-2xl overflow-hidden">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                        )}
                    </div>
                    <div className="flex-1">
                        <h2 className="font-bold text-lg">
                            {profile?.username || profile?.full_name || user?.email || 'User'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {profile?.role || 'Member'} {profile?.location ? `• ${profile.location}` : ''}
                        </p>
                        {!profile?.username && (
                            <p className="text-xs text-terracotta mt-1">
                                👋 Complete your profile to get started!
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-1">
                    <MenuItem icon={Settings} label="Settings" href="/settings" />
                    <MenuItem icon={HelpCircle} label="Help & Support" href="/support" />
                    <MenuItem
                        icon={LogOut}
                        label="Sign Out"
                        color="text-red-500"
                        onClick={handleSignOut}
                    />
                </div>
            </div>
        </AppLayout>
    )
}