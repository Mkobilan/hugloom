"use client";

import React from 'react';
import { X, MapPin, Heart, HandHeart, MessageCircle, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

interface HugDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    hug: LocalHug;
}

export const HugDetailsModal = ({ isOpen, onClose, hug }: HugDetailsModalProps) => {
    const router = useRouter();

    if (!isOpen) return null;

    const handleChat = () => {
        router.push(`/messages/chat/${hug.user_id}`);
        onClose();
    };

    const getIcon = () => {
        if (hug.type === 'volunteer') {
            return <Heart className="w-8 h-8 text-rose-600" />;
        }
        return <HandHeart className="w-8 h-8 text-emerald-600" />;
    };

    const getBgColor = () => {
        if (hug.type === 'volunteer') {
            return 'bg-rose-100';
        }
        return 'bg-emerald-100';
    };

    const getTitle = () => {
        if (hug.type === 'volunteer') {
            return 'Volunteer Offer';
        }
        return 'Help Request';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-[#3C3434] rounded-3xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${getBgColor()}`}>
                            {getIcon()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{getTitle()}</h2>
                            <p className="text-sm text-white/60">Posted by @{hug.profiles?.username}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Services */}
                    <div>
                        <h3 className="text-sm font-bold text-terracotta uppercase tracking-wider mb-2">
                            Services
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {hug.services.map((service, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-white/5 rounded-full text-white text-sm border border-white/10"
                                >
                                    {service}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <h3 className="text-sm font-bold text-terracotta uppercase tracking-wider mb-2">
                            Location
                        </h3>
                        <div className="flex items-center gap-2 text-white">
                            <MapPin className="w-5 h-5 text-terracotta" />
                            <span>{hug.city}, {hug.state}</span>
                        </div>
                    </div>

                    {/* Details/Availability */}
                    <div>
                        <h3 className="text-sm font-bold text-terracotta uppercase tracking-wider mb-2">
                            {hug.type === 'volunteer' ? 'Availability' : 'Details'}
                        </h3>
                        <div className="bg-[#4A4042] p-4 rounded-xl border border-white/5">
                            <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                                {hug.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-[#362F2F]">
                    <button
                        onClick={handleChat}
                        className="w-full py-3 bg-terracotta text-white rounded-xl font-bold hover:bg-terracotta/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-terracotta/20"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Chat with @{hug.profiles?.username}
                    </button>
                </div>
            </div>
        </div>
    );
};
