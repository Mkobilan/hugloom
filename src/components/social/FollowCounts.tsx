"use client";

import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

interface FollowCountsProps {
    userId: string;
}

export const FollowCounts = ({ userId }: FollowCountsProps) => {
    const [counts, setCounts] = useState({ followerCount: 0, followingCount: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const response = await fetch(`/api/follow/counts?userId=${userId}`);
                const data = await response.json();
                setCounts({
                    followerCount: data.followerCount || 0,
                    followingCount: data.followingCount || 0
                });
            } catch (error) {
                console.error('Error fetching follow counts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCounts();
    }, [userId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-4 text-sm mb-4">
            <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900">{counts.followerCount}</span>
                <span className="text-muted-foreground">
                    {counts.followerCount === 1 ? 'Follower' : 'Followers'}
                </span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900">{counts.followingCount}</span>
                <span className="text-muted-foreground">Following</span>
            </div>
        </div>
    );
};
