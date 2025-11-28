import { createClient } from '@/lib/supabase/server'
import { PostCard } from '@/components/social/PostCard'
import { CreatePost } from '@/components/social/CreatePost'
import { AppLayout } from '@/components/layout/AppLayout'

import { InstallPrompt } from '@/components/pwa/InstallPrompt'

export default async function FeedPage() {
    const supabase = await createClient()
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
        .order('created_at', { ascending: false })

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <InstallPrompt />
                <h1 className="text-2xl font-heading font-bold text-terracotta mb-6">Community Feed</h1>
                <CreatePost />
                <div className="space-y-6">
                    {posts?.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                    {(!posts || posts.length === 0) && (
                        <div className="text-center py-10 text-muted-foreground bg-white rounded-2xl border border-dashed border-terracotta/20">
                            <p>No posts yet. Be the first to share!</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
