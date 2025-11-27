"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function ChatRedirectPage({ params }: { params: Promise<{ userId: string }> }) {
    const router = useRouter();

    useEffect(() => {
        const redirect = async () => {
            try {
                const { userId } = await params;
                const supabase = createClient();

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                // Call the database function to get or create conversation
                const { data: conversationId, error } = await supabase
                    .rpc('get_or_create_conversation', {
                        user1_id: user.id,
                        user2_id: userId
                    });

                if (error) {
                    console.error('Error getting/creating conversation:', error);
                    router.push('/messages');
                    return;
                }

                router.push(`/messages/${conversationId}`);
            } catch (error) {
                console.error('Error redirecting to chat:', error);
                router.push('/messages');
            }
        };

        redirect();
    }, [params, router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
        </div>
    );
}
