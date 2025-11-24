"use client";
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const PostCard = ({ post }: { post: any }) => {
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-terracotta/10 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center text-sage font-bold text-lg">
                    {post.profiles?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                    <h3 className="font-bold text-sm text-foreground">{post.profiles?.full_name || 'Anonymous'}</h3>
                    <p className="text-xs text-muted-foreground">
                        {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : 'Just now'}
                    </p>
                </div>
            </div>

            <p className="text-foreground/90 mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>

            {post.media_urls?.length > 0 && (
                <div className="mb-4 rounded-xl overflow-hidden border border-border/50">
                    <img src={post.media_urls[0]} alt="Post content" className="w-full h-auto object-cover max-h-96" />
                </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border/30">
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-terracotta transition-colors group">
                    <div className="p-1.5 rounded-full group-hover:bg-terracotta/10 transition-colors">
                        <Heart className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{post.reactions?.length || 0} Hugs</span>
                </button>

                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-sage transition-colors group">
                    <div className="p-1.5 rounded-full group-hover:bg-sage/10 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{post.comments?.length || 0} Comments</span>
                </button>

                <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-black/5">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
