'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Smile } from 'lucide-react'
import { addMessageReaction, removeMessageReaction } from '@/app/messages/actions'

interface Reaction {
    id: string
    type: string
    user_id: string
    user: {
        username: string
    }
}

interface MessageReactionsProps {
    messageId: string
    reactions: Reaction[]
    currentUserId: string
}

export function MessageReactions({ messageId, reactions, currentUserId }: MessageReactionsProps) {
    const [showPicker, setShowPicker] = useState(false)

    const reactionCounts = reactions.reduce((acc, reaction) => {
        acc[reaction.type] = (acc[reaction.type] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const userReactions = reactions
        .filter(r => r.user_id === currentUserId)
        .map(r => r.type)

    const handleReaction = async (type: string) => {
        if (userReactions.includes(type)) {
            await removeMessageReaction(messageId, type)
        } else {
            await addMessageReaction(messageId, type)
        }
        setShowPicker(false)
    }

    const REACTION_TYPES = [
        { type: 'hug', icon: '🤗' },
        { type: 'heart', icon: '❤️' },
        { type: 'thumbs_up', icon: '👍' }
    ]

    return (
        <div className="relative flex items-center gap-1">
            {/* Existing Reactions */}
            {Object.entries(reactionCounts).map(([type, count]) => (
                <button
                    key={type}
                    onClick={() => handleReaction(type)}
                    className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
                        userReactions.includes(type)
                            ? "bg-terracotta/10 border-terracotta text-terracotta"
                            : "bg-white border-border text-muted-foreground hover:bg-gray-50"
                    )}
                    title={reactions.filter(r => r.type === type).map(r => r.user.username).join(', ')}
                >
                    <span>{REACTION_TYPES.find(r => r.type === type)?.icon}</span>
                    <span className="font-medium">{count}</span>
                </button>
            ))}

            {/* Add Reaction Button */}
            <div className="relative">
                <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <Smile className="w-4 h-4" />
                </button>

                {/* Reaction Picker */}
                {showPicker && (
                    <div className="absolute bottom-full left-0 mb-2 flex gap-1 bg-white p-1 rounded-full shadow-lg border border-border z-10 animate-in fade-in zoom-in duration-200">
                        {REACTION_TYPES.map(({ type, icon }) => (
                            <button
                                key={type}
                                onClick={() => handleReaction(type)}
                                className={cn(
                                    "p-1.5 rounded-full hover:bg-gray-100 transition-colors text-lg leading-none",
                                    userReactions.includes(type) && "bg-terracotta/10"
                                )}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
