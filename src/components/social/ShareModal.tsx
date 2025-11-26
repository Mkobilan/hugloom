"use client";
import { X, Twitter, Facebook, Linkedin, Share2, Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ShareModalProps {
    postId: string;
    postContent: string;
    username: string;
    onClose: () => void;
    commentId?: string;
}

export const ShareModal = ({ postId, postContent, username, onClose, commentId }: ShareModalProps) => {
    const [copied, setCopied] = useState(false);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Generate share URL (using current domain)
    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/post/${postId}${commentId ? `#comment-${commentId}` : ''}`
        : '';

    // Truncate content for sharing
    const shareText = postContent.length > 100
        ? `${postContent.substring(0, 100)}...`
        : postContent;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const shareOptions = [
        {
            name: 'Twitter',
            icon: Twitter,
            color: 'hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]',
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        },
        {
            name: 'Facebook',
            icon: Facebook,
            color: 'hover:bg-[#1877F2]/10 hover:text-[#1877F2]',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        },
        {
            name: 'LinkedIn',
            icon: Linkedin,
            color: 'hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]',
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        },
        {
            name: 'Reddit',
            icon: Share2,
            color: 'hover:bg-[#FF4500]/10 hover:text-[#FF4500]',
            url: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
        },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/30">
                    <h2 className="text-xl font-bold text-black">Share Post</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Social Media Options */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {shareOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                                <a
                                    key={option.name}
                                    href={option.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-3 p-4 rounded-xl border border-border/50 transition-all ${option.color} group`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium text-sm text-black group-hover:text-inherit">
                                        {option.name}
                                    </span>
                                </a>
                            );
                        })}
                    </div>

                    {/* Copy Link */}
                    <div className="pt-4 border-t border-border/30">
                        <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-terracotta/5 hover:border-terracotta/30 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                {copied ? (
                                    <Check className="w-5 h-5 text-terracotta" />
                                ) : (
                                    <Copy className="w-5 h-5 text-muted-foreground group-hover:text-terracotta" />
                                )}
                                <span className="font-medium text-sm text-black">
                                    {copied ? 'Link Copied!' : 'Copy Link'}
                                </span>
                            </div>
                            {copied && (
                                <span className="text-xs text-terracotta font-medium">✓</span>
                            )}
                        </button>
                    </div>

                    {/* URL Preview */}
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-muted-foreground break-all">{shareUrl}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
