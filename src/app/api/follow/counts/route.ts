import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Get follower and following counts for a user
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 })
        }

        // Get follower count (people following this user)
        const { count: followerCount, error: followerError } = await supabase
            .from('follows')
            .select('id', { count: 'exact', head: true })
            .eq('following_id', userId)

        if (followerError) {
            console.error('Follower count error:', followerError)
            return NextResponse.json({ error: followerError.message }, { status: 500 })
        }

        // Get following count (people this user follows)
        const { count: followingCount, error: followingError } = await supabase
            .from('follows')
            .select('id', { count: 'exact', head: true })
            .eq('follower_id', userId)

        if (followingError) {
            console.error('Following count error:', followingError)
            return NextResponse.json({ error: followingError.message }, { status: 500 })
        }

        return NextResponse.json({
            followerCount: followerCount || 0,
            followingCount: followingCount || 0
        })
    } catch (error) {
        console.error('Follow counts error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
