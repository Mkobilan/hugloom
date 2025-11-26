import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Check if current user follows a specific user
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ isFollowing: false })
        }

        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 })
        }

        // Check if follow relationship exists
        const { data, error } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', userId)
            .maybeSingle()

        if (error) {
            console.error('Follow status check error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ isFollowing: !!data })
    } catch (error) {
        console.error('Follow status check error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
