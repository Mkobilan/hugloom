"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2, Check, Heart, HandHeart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
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

interface CreateHugModalProps {
    isOpen: boolean;
    onClose: () => void;
    type?: 'volunteer' | 'request';
    onSuccess: () => void;
    hug?: LocalHug;
}

const SERVICES = [
    'Medication Pickup',
    'Grocery Pickup',
    'Respite Care',
    'Appointment Ride'
];

export const CreateHugModal = ({ isOpen, onClose, type, onSuccess, hug }: CreateHugModalProps) => {
    const [loading, setLoading] = useState(false);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        if (isOpen && hug) {
            setSelectedServices(hug.services);
            setCity(hug.city);
            setState(hug.state);
            setDescription(hug.description);
        } else if (isOpen && !hug) {
            // Reset form for new post
            setSelectedServices([]);
            setCity('');
            setState('');
            setDescription('');
        }
    }, [isOpen, hug]);

    if (!isOpen) return null;

    const toggleService = (service: string) => {
        if (selectedServices.includes(service)) {
            setSelectedServices(selectedServices.filter(s => s !== service));
        } else {
            setSelectedServices([...selectedServices, service]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (selectedServices.length === 0) {
            setError('Please select at least one service');
            return;
        }

        if (!city || !state || !description) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            if (hug) {
                // Update existing hug
                const { error: updateError } = await supabase
                    .from('local_hugs')
                    .update({
                        services: selectedServices,
                        city,
                        state,
                        description
                    })
                    .eq('id', hug.id);

                if (updateError) throw updateError;
            } else {
                // Create new hug
                const { error: insertError } = await supabase
                    .from('local_hugs')
                    .insert({
                        user_id: user.id,
                        type: type!,
                        services: selectedServices,
                        city,
                        state,
                        description
                    });

                if (insertError) throw insertError;
            }

            onSuccess();
            onClose();
            // Reset form
            if (!hug) {
                setSelectedServices([]);
                setCity('');
                setState('');
                setDescription('');
            }
            router.refresh();

        } catch (err: any) {
            console.error('Error saving hug:', err);
            setError(err.message || 'Failed to save post');
        } finally {
            setLoading(false);
        }
    };

    // Determine display values based on hug prop or type prop
    const currentType = hug ? hug.type : type!;
    const isVolunteer = currentType === 'volunteer';
    const title = hug ? 'Edit Local Hug' : (isVolunteer ? 'Volunteer to Help' : 'Request Help');
    const descriptionLabel = isVolunteer ? 'Availability' : 'Details';
    const descriptionPlaceholder = isVolunteer
        ? 'e.g. Available weekends and evenings...'
        : 'e.g. Need someone to pick up my prescription from CVS on Main St...';

    const themeColor = isVolunteer ? 'rose' : 'emerald';
    const Icon = isVolunteer ? Heart : HandHeart;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-[#3C3434] rounded-3xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full bg-${themeColor}-100`}>
                            <Icon className={`w-6 h-6 text-${themeColor}-600`} />
                        </div>
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Services Selection */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-3">
                            Select Services
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {SERVICES.map((service) => {
                                const isSelected = selectedServices.includes(service);
                                return (
                                    <button
                                        key={service}
                                        type="button"
                                        onClick={() => toggleService(service)}
                                        className={`p-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center justify-between ${isSelected
                                            ? `bg-${themeColor}-600 border-${themeColor}-600 text-white`
                                            : 'bg-[#4A4042] border-white/10 text-white/70 hover:border-white/30'
                                            }`}
                                    >
                                        {service}
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                City
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[#4A4042] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                                placeholder="e.g. Austin"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-white mb-2">
                                State
                            </label>
                            <input
                                type="text"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[#4A4042] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                                placeholder="e.g. TX"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2">
                            {descriptionLabel}
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-[#4A4042] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-terracotta/50 resize-none"
                            placeholder={descriptionPlaceholder}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${isVolunteer
                            ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {hug ? 'Saving Changes...' : 'Post Local Hug'}
                            </>
                        ) : (
                            hug ? 'Save Changes' : 'Post Local Hug'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
