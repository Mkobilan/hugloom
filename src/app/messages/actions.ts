'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getOrCreateConversation(otherUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    // Call the database function to get or create conversation
    const { data: conversationId, error } = await supabase
        .rpc('get_or_create_conversation', {
            user1_id: user.id,
            user2_id: otherUserId
        })

    if (error) {
        console.error('Error getting/creating conversation:', error)
        throw new Error('Failed to create conversation')
    }

    return conversationId
}

export async function sendMessage(conversationId: string, content: string, mediaUrl?: string, mediaType?: 'image' | 'file', mediaFilename?: string, mediaSize?: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content,
            media_url: mediaUrl,
            media_type: mediaType,
            media_filename: mediaFilename,
            media_size: mediaSize
        })

    if (error) {
        console.error('Error sending message:', error)
        throw new Error('Failed to send message')
    }

    revalidatePath(`/messages/${conversationId}`)
    revalidatePath('/messages')
}

export async function getMessages(conversationId: string, limit: number = 50, offset: number = 0) {
    const supabase = await createClient()

    const { data: messages, error } = await supabase
        .from('messages')
        .select(`
            *,
            sender:profiles(id, username, full_name, avatar_url),
            reactions:message_reactions(
                id,
                type,
                user_id,
                user:profiles(username)
            )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) {
        console.error('Error fetching messages:', error)
        throw new Error('Failed to fetch messages')
    }

    return messages.reverse() // Return in chronological order for display
}

export async function getConversations() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Get conversations where user is a participant
    const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
            *,
            participants:conversation_participants(
                user:profiles(id, username, full_name, avatar_url),
                last_read_at,
                is_archived
            )
        `)
        .order('last_message_at', { ascending: false })

    if (error) {
        console.error('Error fetching conversations:', JSON.stringify(error, null, 2))
        return []
    }

    // Filter to only show conversations the user is part of (double check)
    // and format the data for easier consumption
    return conversations.filter(conv =>
        conv.participants.some((p: any) => p.user.id === user.id)
    )
}

export async function markConversationAsRead(conversationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)

    revalidatePath('/messages')
}

export async function editMessage(messageId: string, newContent: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('messages')
        .update({
            content: newContent,
            is_edited: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', user.id) // Security check

    if (error) throw new Error('Failed to edit message')

    revalidatePath('/messages')
}

export async function deleteMessage(messageId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('messages')
        .update({
            is_deleted: true,
            content: 'This message was deleted',
            media_url: null
        })
        .eq('id', messageId)
        .eq('sender_id', user.id) // Security check

    if (error) throw new Error('Failed to delete message')

    revalidatePath('/messages')
}

export async function addMessageReaction(messageId: string, reactionType: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('message_reactions')
        .insert({
            message_id: messageId,
            user_id: user.id,
            type: reactionType
        })

    if (error) {
        // Ignore duplicate key errors (user already reacted with this type)
        if (error.code !== '23505') {
            throw new Error('Failed to add reaction')
        }
    }
}

export async function removeMessageReaction(messageId: string, reactionType: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('type', reactionType)

    if (error) throw new Error('Failed to remove reaction')
}

export async function uploadMessageAttachment(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const file = formData.get('file') as File
    const conversationId = formData.get('conversationId') as string

    if (!file || !conversationId) throw new Error('Missing file or conversation ID')

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size too large (max 10MB)')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `chat/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error } = await supabase
        .storage
        .from('post-media')
        .upload(fileName, file)

    if (error) {
        console.error('Error uploading file:', error)
        throw new Error('Failed to upload file')
    }

    // Return the filename/path
    return fileName
}
