"use client";

import React, { useState } from 'react';
import { MapPin, Heart, HandHeart, Trash2, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { HugDetailsModal } from './HugDetailsModal';

interface LocalHug {
    id: string;
    user_id: string;
    type: 'volunteer' | 'request';
    services: string[];
    city: string;
    state: string;
    description: string;
    created_at: string;
    profiles?: {
        username: string;
        avatar_url?: string;
    };
}

interface LocalHugCardProps {
    hug: LocalHug;
    currentUserId?: string;
    onDelete: (id: string) => void;
}

export const LocalHugCard = ({ hug, currentUserId, onDelete }: LocalHugCardProps) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const supabase = createClient();

    const isOwner = currentUserId === hug.user_id;

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this hug?')) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('local_hugs')
                .delete()
                .eq('id', hug.id);

            if (error) throw error;
            onDelete(hug.id);
        } catch (error) {
            console.error('Error deleting hug:', error);
            alert('Failed to delete hug');
        } finally {
            setIsDeleting(false);
        }
    };

    const getIcon = () => {
        if (hug.type === 'volunteer') {
            return <Heart className="w-6 h-6 text-rose-600" />;
        }
        return <HandHeart className="w-6 h-6 text-emerald-600" />;
    };

    const getBgColor = () => {
        if (hug.type === 'volunteer') {
            return 'bg-rose-100';
        }
        return 'bg-emerald-100';
    };

    return (
        <>
            <div
                onClick={() => setIsDetailsOpen(true)}
                className="bg-[#3C3434] p-4 rounded-2xl shadow-sm border border-white/10 flex items-start gap-4 cursor-pointer hover:bg-[#4A4042] transition-colors group"
            >
                <div className={`p-3 rounded-full ${getBgColor()} shrink-0`}>
                    {getIcon()}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-white truncate">
                            {hug.services.join(', ')}
                        </h3>
                        {isOwner && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <p className="text-sm text-white/70 mb-3 line-clamp-2">
                        {hug.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-terracotta font-medium">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{hug.city}, {hug.state}</span>
                        </div>
                        <span className="text-white/20">•</span>
                        <div className="flex items-center gap-1 text-white/60">
                            <User className="w-3 h-3" />
                            <span>@{hug.profiles?.username || 'user'}</span>
                        </div>
                    </div>
                </div>

                <div className="self-center">
                    <button
                        className="px-4 py-2 bg-cream text-[#3C3434] text-xs font-bold rounded-full hover:bg-white transition-colors shadow-sm"
                    >
                        Connect
                    </button>
                </div>
            </div>

            <HugDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                hug={hug}
            />
        </>
    );
};
