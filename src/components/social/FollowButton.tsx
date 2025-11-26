"use client";

import { useState, useEffect } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';

interface FollowButtonProps {
    userId: string;
    initialFollowing?: boolean;
    onFollowChange?: (isFollowing: boolean) => void;
}

export const FollowButton = ({ userId, initialFollowing = false, onFollowChange }: FollowButtonProps) => {
    const [isFollowing, setIsFollowing] = useState(initialFollowing);
    const [isLoading, setIsLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        // Fetch initial follow status
        const fetchFollowStatus = async () => {
            try {
                const response = await fetch(`/api/follow/status?userId=${userId}`);
                const data = await response.json();
                setIsFollowing(data.isFollowing);
            } catch (error) {
                console.error('Error fetching follow status:', error);
            }
        };

        fetchFollowStatus();
    }, [userId]);

    const handleFollowToggle = async () => {
        if (isLoading) return;

        // Optimistic update
        const previousState = isFollowing;
        setIsFollowing(!isFollowing);
        setIsLoading(true);

        try {
            const response = await fetch('/api/follow', {
                method: isFollowing ? 'DELETE' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ followingId: userId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update follow status');
            }

            // Update with server response
            setIsFollowing(data.isFollowing);
            onFollowChange?.(data.isFollowing);
        } catch (error) {
            console.error('Error toggling follow:', error);
            // Revert optimistic update on error
            setIsFollowing(previousState);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleFollowToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={isLoading}
            className={`
                px-6 py-2 rounded-full font-bold text-sm transition-all duration-200 shadow-md
                flex items-center gap-2 min-w-[120px] justify-center
                ${isFollowing
                    ? isHovered
                        ? 'bg-red-500 text-white border-red-500 shadow-red-500/20'
                        : 'bg-white text-gray-900 border border-border hover:bg-cream shadow-slate-blue/10'
                    : 'bg-slate-blue text-white hover:bg-slate-blue/90 shadow-slate-blue/20'
                }
                ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            {isLoading ? (
                <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                </>
            ) : (
                <>
                    {isFollowing ? (
                        <>
                            <UserCheck className="w-4 h-4" />
                            <span>{isHovered ? 'Unfollow' : 'Following'}</span>
                        </>
                    ) : (
                        <>
                            <UserPlus className="w-4 h-4" />
                            <span>Follow</span>
                        </>
                    )}
                </>
            )}
        </button>
    );
};
