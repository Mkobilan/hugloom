'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getOrCreateConversation } from '@/app/messages/actions'
import { MessageCircle, Loader2 } from 'lucide-react'

interface ChatButtonProps {
    userId: string
}

export function ChatButton({ userId }: ChatButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleStartChat = async () => {
        setIsLoading(true)
        try {
            const conversationId = await getOrCreateConversation(userId)
            router.push(`/messages/${conversationId}`)
        } catch (error) {
            console.error('Failed to start chat', error)
            alert('Failed to start chat')
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleStartChat}
            disabled={isLoading}
            className="px-6 py-2 bg-white text-gray-900 border border-border rounded-full font-bold text-sm hover:bg-cream transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <MessageCircle className="w-4 h-4" />
            )}
            Chat
        </button>
    )
}
