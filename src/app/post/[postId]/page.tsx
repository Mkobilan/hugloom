import { createClient } from '@/lib/supabase/server';
import { PostCard } from '@/components/social/PostCard';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

interface PostPageProps {
    params: Promise<{
        postId: string;
    }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
    const { postId } = await params;
    const supabase = await createClient();

    const { data: post } = await supabase
        .from('posts')
        .select(`
            *,
            profiles:user_id (
                username,
                full_name,
                avatar_url
            )
        `)
        .eq('id', postId)
        .single();

    if (!post) {
        return {
            title: 'Post Not Found | HugLoom',
        };
    }

    const username = post.profiles?.username || 'anonymous';
    const fullName = post.profiles?.full_name || username;
    const description = post.content?.substring(0, 160) || 'View this post on HugLoom';
    const imageUrl = post.media_urls?.[0] || post.profiles?.avatar_url;

    return {
        title: `${fullName} (@${username}) on HugLoom`,
        description,
        openGraph: {
            title: `${fullName} (@${username}) on HugLoom`,
            description,
            images: imageUrl ? [imageUrl] : [],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${fullName} (@${username}) on HugLoom`,
            description,
            images: imageUrl ? [imageUrl] : [],
        },
    };
}

export default async function PostPage({ params }: PostPageProps) {
    const { postId } = await params;
    const supabase = await createClient();

    // Fetch the post with user profile and reactions
    const { data: post, error } = await supabase
        .from('posts')
        .select(`
            *,
            profiles:user_id (
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
        .eq('id', postId)
        .single();

    if (error || !post) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream via-white to-sage/5">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Back button */}
                <Link
                    href="/feed"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Feed
                </Link>

                {/* Post */}
                <PostCard post={post} />

                {/* User info */}
                <div className="mt-6 p-4 bg-white rounded-2xl shadow-sm border border-terracotta/10">
                    <Link
                        href={`/u/${post.profiles?.username}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        <div className="w-12 h-12 rounded-full bg-sage/20 flex items-center justify-center text-sage font-bold text-lg overflow-hidden">
                            {post.profiles?.avatar_url ? (
                                <img
                                    src={post.profiles.avatar_url}
                                    alt={post.profiles.username || 'User'}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                post.profiles?.username?.[0]?.toUpperCase() || '?'
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-black">
                                {post.profiles?.full_name || post.profiles?.username || 'Anonymous'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                @{post.profiles?.username || 'anonymous'}
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
