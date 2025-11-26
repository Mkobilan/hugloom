'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, uploadMessageAttachment } from '@/app/messages/actions'

interface MessageInputProps {
    conversationId: string
    onTyping: (isTyping: boolean) => void
}

export function MessageInput({ conversationId, onTyping }: MessageInputProps) {
    const [content, setContent] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [attachment, setAttachment] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [content])

    const handleTyping = () => {
        onTyping(true)
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }
        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false)
        }, 2000) as unknown as NodeJS.Timeout
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 10 * 1024 * 1024) {
                alert('File too large (max 10MB)')
                return
            }
            setAttachment(file)
        }
    }

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if ((!content.trim() && !attachment) || isSending) return

        setIsSending(true)
        try {
            let mediaUrl = undefined
            let mediaType: 'image' | 'file' | undefined = undefined
            let mediaFilename = undefined
            let mediaSize = undefined

            if (attachment) {
                const formData = new FormData()
                formData.append('file', attachment)
                formData.append('conversationId', conversationId)

                mediaUrl = await uploadMessageAttachment(formData)
                mediaType = attachment.type.startsWith('image/') ? 'image' : 'file'
                mediaFilename = attachment.name
                mediaSize = attachment.size
            }

            await sendMessage(
                conversationId,
                content,
                mediaUrl,
                mediaType,
                mediaFilename,
                mediaSize
            )

            setContent('')
            setAttachment(null)
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
            onTyping(false)
        } catch (error) {
            console.error('Failed to send message', error)
            alert('Failed to send message')
        } finally {
            setIsSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="p-4 bg-[#3C3434] border-t border-border">
            {attachment && (
                <div className="flex items-center gap-3 mb-3 p-2 bg-gray-50 rounded-lg border border-border w-fit">
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                        {attachment.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                    </div>
                    <div className="flex flex-col max-w-[200px]">
                        <span className="text-sm font-medium truncate">{attachment.name}</span>
                        <span className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button
                        onClick={() => setAttachment(null)}
                        className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-gray-400 hover:bg-gray-700 rounded-full transition-colors"
                    title="Attach file"
                >
                    <Paperclip size={20} />
                </button>

                <div className="flex-1 bg-purple-500 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-purple-400/50 transition-all">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value)
                            handleTyping()
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full bg-transparent border-none focus:outline-none resize-none max-h-32 text-sm text-white placeholder:text-white/50"
                        rows={1}
                    />
                </div>

                <button
                    type="submit"
                    disabled={(!content.trim() && !attachment) || isSending}
                    className={cn(
                        "p-3 rounded-full transition-all shadow-sm flex items-center justify-center",
                        (!content.trim() && !attachment) || isSending
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-terracotta text-white hover:bg-terracotta/90 hover:shadow-md"
                    )}
                >
                    <Send size={20} className={cn(isSending && "opacity-50")} />
                </button>
            </form>
        </div>
    )
}
