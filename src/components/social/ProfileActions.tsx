"use client";

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { CreatePost } from '@/components/social/CreatePost';

interface ProfileActionsProps {
    isOwner: boolean;
}

export const ProfileActions = ({ isOwner }: ProfileActionsProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!isOwner) return null;

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="absolute top-6 right-6 w-10 h-10 bg-terracotta text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-10"
                title="Create Post"
            >
                <Plus className="w-6 h-6" />
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#3C3434] rounded-3xl w-full max-w-lg p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200 border border-white/10">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold text-white mb-4">Create a Public Post</h2>

                        <div className="mt-2">
                            {/* We can wrap CreatePost or just use it. 
                                Since CreatePost has its own container styling, we might want to adjust it or just use it as is.
                                CreatePost has a margin-bottom that we might want to negate or accept.
                             */}
                            <CreatePost onSuccess={() => setIsModalOpen(false)} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
