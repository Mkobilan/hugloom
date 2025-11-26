import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { PostCard } from '@/components/social/PostCard'
import { MapPin, ShoppingBag, MessageCircle } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProfileActions } from '@/components/social/ProfileActions'
import { FollowButton } from '@/components/social/FollowButton'
import { FollowCounts } from '../../../components/social/FollowCounts'
import { ChatButton } from '@/components/chat/ChatButton'

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const supabase = await createClient()
    const { username } = await params

    // Fetch current user
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

    if (!profile) {
        return notFound()
    }

    const isOwner = currentUser?.id === profile.id;

    // Fetch user's posts
    const { data: posts } = await supabase
        .from('posts')
        .select(`
            *,
            profiles (
                username,
                full_name,
                avatar_url
            ),
            reactions (
                id,
                user_id,
                type
            ),
            comments (
                id
            )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

    // Fetch user's marketplace items
    const { data: items } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Profile Header */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-slate-blue/20 to-terracotta/20" />

                    {/* Profile Actions (Plus button for owner) */}
                    <ProfileActions isOwner={isOwner} />

                    <div className="relative pt-12 mb-4">
                        <div className="w-24 h-24 mx-auto rounded-full bg-white p-1 shadow-lg">
                            <div className="w-full h-full rounded-full bg-slate-blue/10 overflow-hidden">
                                {profile.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={profile.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-blue text-3xl font-bold">
                                        {profile.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        {profile.full_name || profile.username}
                    </h1>
                    <p className="text-gray-700 font-medium mb-2">@{profile.username}</p>

                    {/* Follower/Following Counts */}
                    <FollowCounts userId={profile.id} />

                    {profile.location && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-4">
                            <MapPin className="w-4 h-4" />
                            <span>{profile.location}</span>
                        </div>
                    )}

                    {profile.bio && (
                        <p className="text-black max-w-md mx-auto mb-6 font-medium">
                            {profile.bio}
                        </p>
                    )}

                    {/* Action Buttons - Only show Follow button if not owner */}
                    {!isOwner && (
                        <div className="flex justify-center gap-3">
                            <FollowButton userId={profile.id} />
                            <ChatButton userId={profile.id} />
                        </div>
                    )}
                </div>

                {/* Marketplace Items */}
                {items && items.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-terracotta" />
                            Stuff for Sale & Services
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {items.map((item) => (
                                <div key={item.id} className="bg-white p-3 rounded-2xl border border-border/50 hover:shadow-md transition-shadow">
                                    <div className="aspect-square rounded-xl bg-cream mb-3 overflow-hidden relative">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                <ShoppingBag className="w-8 h-8 opacity-20" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-terracotta shadow-sm">
                                            ${item.price}
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-foreground truncate">{item.title}</h3>
                                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* User Posts */}
                {posts && posts.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-sage" />
                            Local Hugs & Posts
                        </h2>
                        <div className="space-y-6">
                            {posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty State if nothing to show */}
                {(!items || items.length === 0) && (!posts || posts.length === 0) && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-border">
                        <p className="text-muted-foreground">
                            {profile.username} hasn't posted anything yet.
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
