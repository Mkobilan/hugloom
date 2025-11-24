import { AppLayout } from '@/components/layout/AppLayout'
import { MessageCircle } from 'lucide-react'

export default function MessagesPage() {
    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto h-full flex flex-col">
                <h1 className="text-2xl font-heading font-bold text-terracotta mb-6">Messages</h1>

                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-dashed border-terracotta/20">
                    <div className="p-4 bg-sage/10 rounded-full mb-4 text-sage">
                        <MessageCircle className="w-12 h-12" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">No messages yet</h3>
                    <p className="text-muted-foreground mb-6">Start a conversation with your care circle or local support group.</p>
                    <button className="px-6 py-3 bg-terracotta text-white rounded-full font-bold shadow-lg hover:bg-terracotta/90 transition-colors">
                        Start New Chat
                    </button>
                </div>
            </div>
        </AppLayout>
    )
}
