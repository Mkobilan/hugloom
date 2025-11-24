"use client";
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Image, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const CreatePost = () => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { error } = await supabase.from('posts').insert({
            content,
            user_id: user.id,
        });

        if (!error) {
            setContent('');
            router.refresh();
        }
        setLoading(false);
    };

    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-terracotta/10 mb-6">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share what's on your heart..."
                className="w-full p-3 rounded-xl bg-cream/50 border-none focus:ring-2 focus:ring-terracotta/20 resize-none min-h-[100px] placeholder:text-muted-foreground/70 text-foreground"
            />
            <div className="flex items-center justify-between mt-3">
                <button className="p-2 text-muted-foreground hover:text-terracotta transition-colors rounded-full hover:bg-terracotta/10">
                    <Image className="w-5 h-5" />
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading || !content.trim()}
                    className="px-4 py-2 bg-terracotta text-white rounded-full font-bold text-sm hover:bg-terracotta/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-terracotta/20"
                >
                    <span>{loading ? 'Posting...' : 'Post'}</span>
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
