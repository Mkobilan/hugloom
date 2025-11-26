import { AppLayout } from '@/components/layout/AppLayout'
import { ChatList } from '@/components/chat/ChatList'
import { getConversations } from './actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MessagesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const conversations = await getConversations()

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-heading font-bold text-terracotta">Messages</h1>
                </div>

                <div className="flex-1 bg-[#3C3434] rounded-3xl shadow-sm border border-border overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-border bg-[#2C2424]">
                        <h2 className="font-bold text-white">Recent Conversations</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        <ChatList
                            initialConversations={conversations}
                            currentUserId={user.id}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

