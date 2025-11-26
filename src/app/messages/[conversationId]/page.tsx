import { AppLayout } from '@/components/layout/AppLayout'
import { ConversationView } from '@/components/chat/ConversationView'
import { getMessages } from '../actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
    const { conversationId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify user is participant
    const { data: participant } = await supabase
        .from('conversation_participants')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single()

    if (!participant) {
        redirect('/messages')
    }

    // Get other participant info for header
    const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user:profiles(username, full_name, avatar_url)')
        .eq('conversation_id', conversationId)
        .neq('user_id', user.id)
        .single()

    const otherUser = participants?.user as any

    // Fetch initial messages
    const initialMessages = await getMessages(conversationId)

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                    <Link
                        href="/messages"
                        className="p-2 hover:bg-white rounded-full transition-colors text-gray-600"
                    >
                        <ArrowLeft size={24} />
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                            {otherUser?.avatar_url ? (
                                <img src={otherUser.avatar_url} alt={otherUser.username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                                    {otherUser?.username?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 leading-tight">
                                {otherUser?.full_name || otherUser?.username}
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                @{otherUser?.username}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Chat View */}
                <div className="flex-1 overflow-hidden">
                    <ConversationView
                        conversationId={conversationId}
                        currentUserId={user.id}
                        initialMessages={initialMessages}
                    />
                </div>
            </div>
        </AppLayout>
    )
}
