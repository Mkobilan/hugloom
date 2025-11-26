import { createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/layout/AppLayout';
import { PostCard } from '@/components/social/PostCard';
import { Greeting } from '@/components/home/Greeting';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name')
    .eq('id', session.user.id)
    .single();

  const username = profile?.username || profile?.full_name || 'there';

  // Fetch posts
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
    .limit(5); // Limit to 5 latest posts for the home page

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Greeting Section */}
        <Greeting username={username} />

        {/* Public Feed (Main Content) */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-lg text-foreground">Latest from your circle</h3>
            <Link href="/feed" className="text-xs text-terracotta font-medium hover:underline">View all</Link>
          </div>

          <div className="space-y-4">
            {posts?.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {(!posts || posts.length === 0) && (
              <div className="text-center py-10 text-muted-foreground bg-white rounded-2xl border border-dashed border-terracotta/20">
                <p>No posts yet. Be the first to share in the Community Feed!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

