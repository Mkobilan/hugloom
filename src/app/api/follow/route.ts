import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST - Follow a user
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { followingId } = await request.json()

        if (!followingId) {
            return NextResponse.json({ error: 'followingId is required' }, { status: 400 })
        }

        // Prevent following yourself
        if (user.id === followingId) {
            return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
        }

        // Create follow relationship
        const { error } = await supabase
            .from('follows')
            .insert({
                follower_id: user.id,
                following_id: followingId
            })
        if (error) {
            console.error('Follow error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Notification handled by DB trigger

        // Get updated counts
        const [followerCount, followingCount] = await Promise.all([
            supabase
                .from('follows')
                .select('id', { count: 'exact', head: true })
                .eq('following_id', followingId),
            supabase
                .from('follows')
                .select('id', { count: 'exact', head: true })
                .eq('follower_id', followingId)
        ])
        return NextResponse.json({
            success: true,
            isFollowing: true,
            followerCount: followerCount.count || 0,
            followingCount: followingCount.count || 0
        })
    } catch (error) {
        console.error('Follow error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Unfollow a user
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { followingId } = await request.json()

        if (!followingId) {
            return NextResponse.json({ error: 'followingId is required' }, { status: 400 })
        }

        // Delete follow relationship
        const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', followingId)

        if (error) {
            console.error('Unfollow error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Get updated counts
        const [followerCount, followingCount] = await Promise.all([
            supabase
                .from('follows')
                .select('id', { count: 'exact', head: true })
                .eq('following_id', followingId),
            supabase
                .from('follows')
                .select('id', { count: 'exact', head: true })
                .eq('follower_id', followingId)
        ])

        return NextResponse.json({
            success: true,
            isFollowing: false,
            followerCount: followerCount.count || 0,
            followingCount: followingCount.count || 0
        })
    } catch (error) {
        console.error('Unfollow error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
