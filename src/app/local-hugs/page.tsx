"use client";

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { Heart, HandHeart, Search, Filter, Loader2 } from 'lucide-react';
import { LocalHugCard } from '@/components/local-hugs/LocalHugCard';
import { CreateHugModal } from '@/components/local-hugs/CreateHugModal';

const SERVICES = [
    'Medication Pickup',
    'Grocery Pickup',
    'Respite Care',
    'Appointment Ride'
];

export default function LocalHugsPage() {
    const [hugs, setHugs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Modals
    const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    // Filters
    const [searchCity, setSearchCity] = useState('');
    const [searchState, setSearchState] = useState('');
    const [selectedService, setSelectedService] = useState('');
    const [showMyHugs, setShowMyHugs] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        checkUser();
        fetchHugs();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
    };

    const fetchHugs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('local_hugs')
                .select(`
                    *,
                    profiles (
                        username,
                        avatar_url
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHugs(data || []);
        } catch (error) {
            console.error('Error fetching hugs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setHugs(hugs.filter(hug => hug.id !== id));
    };

    const filteredHugs = hugs.filter(hug => {
        // Filter by My Hugs
        if (showMyHugs && hug.user_id !== currentUser?.id) return false;

        // Filter by Service
        if (selectedService && !hug.services.includes(selectedService)) return false;

        // Filter by City
        if (searchCity && !hug.city.toLowerCase().includes(searchCity.toLowerCase())) return false;

        // Filter by State
        if (searchState && !hug.state.toLowerCase().includes(searchState.toLowerCase())) return false;

        return true;
    });

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                {/* Header Banner */}
                <div className="bg-sky-100 p-4 rounded-xl mb-8 border border-sky-200 shadow-sm">
                    <p className="text-sm text-sky-800 font-bold text-center flex items-center justify-center gap-2">
                        <HandHeart className="w-4 h-4" />
                        Connect with local volunteers and professionals for support services.
                    </p>
                </div>

                {/* Page Header & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <h1 className="text-3xl font-heading font-bold text-terracotta">Local Hugs</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsVolunteerModalOpen(true)}
                            className="px-5 py-2.5 bg-rose-500 text-white rounded-full font-bold text-sm shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center gap-2"
                        >
                            <Heart className="w-4 h-4" />
                            Volunteer
                        </button>
                        <button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="px-5 py-2.5 bg-terracotta text-white rounded-full font-bold text-sm shadow-lg shadow-terracotta/20 hover:bg-terracotta/90 transition-all flex items-center gap-2"
                        >
                            <HandHeart className="w-4 h-4" />
                            Request Help
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-[#3C3434] p-4 rounded-2xl border border-white/10 mb-6 space-y-4">
                    <div className="flex items-center gap-2 text-white/80 mb-2">
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-bold">Filters</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Location Search */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={searchCity}
                                    onChange={(e) => setSearchCity(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-[#4A4042] rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="State"
                                value={searchState}
                                onChange={(e) => setSearchState(e.target.value)}
                                className="w-20 px-3 py-2 bg-[#4A4042] rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50"
                            />
                        </div>

                        {/* Service Filter */}
                        <select
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                            className="w-full px-4 py-2 bg-[#4A4042] rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50 appearance-none cursor-pointer"
                        >
                            <option value="">All Services</option>
                            {SERVICES.map(service => (
                                <option key={service} value={service}>{service}</option>
                            ))}
                        </select>
                    </div>

                    {/* My Hugs Toggle */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowMyHugs(!showMyHugs)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${showMyHugs
                                    ? 'bg-terracotta text-white border-terracotta'
                                    : 'bg-transparent text-white/60 border-white/20 hover:border-white/40'
                                }`}
                        >
                            My Hugs
                        </button>
                    </div>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
                    </div>
                ) : filteredHugs.length > 0 ? (
                    <div className="space-y-4">
                        {filteredHugs.map((hug) => (
                            <LocalHugCard
                                key={hug.id}
                                hug={hug}
                                currentUserId={currentUser?.id}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-[#3C3434] rounded-2xl border border-white/10">
                        <div className="p-4 bg-white/5 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <HandHeart className="w-8 h-8 text-white/40" />
                        </div>
                        <h3 className="text-white font-bold mb-2">No Local Hugs Found</h3>
                        <p className="text-white/60 text-sm max-w-xs mx-auto">
                            Try adjusting your filters or be the first to post a Local Hug in this area!
                        </p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreateHugModal
                isOpen={isVolunteerModalOpen}
                onClose={() => setIsVolunteerModalOpen(false)}
                type="volunteer"
                onSuccess={fetchHugs}
            />
            <CreateHugModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                type="request"
                onSuccess={fetchHugs}
            />
        </AppLayout>
    );
}
