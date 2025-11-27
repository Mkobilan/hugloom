"use client";

import { useState } from "react";
import { Users, UserPlus, AlertTriangle, Calendar, ClipboardList } from "lucide-react";
import { CareDashboard } from "./CareDashboard";
import { addMemberToCircle } from "@/lib/actions/care-circles";
import { CalendarView } from "./CalendarView";
import { createClient } from "@/lib/supabase/client";
import { searchUsers } from "@/lib/actions/user";

interface CircleMember {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    role: string;
    joined_at: string;
}

interface CircleData {
    circle: {
        id: string;
        name: string;
        created_by: string;
        created_at: string;
    };
    members: CircleMember[];
    myRole: string;
}

interface CircleDetailViewProps {
    circleData: CircleData;
    circleId: string;
}

export const CircleDetailView = ({ circleData, circleId }: CircleDetailViewProps) => {
    const [activeTab, setActiveTab] = useState<"tasks" | "calendar">("tasks");
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [newMemberUsername, setNewMemberUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [showWarning, setShowWarning] = useState(false);

    // Search state
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (newMemberUsername.trim().length >= 2 && !newMemberUsername.includes('@')) {
                setIsSearching(true);
                try {
                    const users = await searchUsers(newMemberUsername);
                    setSearchResults(users);
                    setShowResults(true);
                } catch (error) {
                    console.error("Error searching users:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [newMemberUsername]);

    const handleSelectUser = (username: string) => {
        setNewMemberUsername(username);
        setShowResults(false);
    };

    // Calendar data state
    const [events, setEvents] = useState<any[]>([]);
    const [medications, setMedications] = useState<any[]>([]);
    const [calendarLoading, setCalendarLoading] = useState(false);

    const isAdmin = circleData.myRole === "admin";

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberUsername.trim()) return;

        try {
            setLoading(true);
            await addMemberToCircle(circleId, newMemberUsername);
            setNewMemberUsername("");
            setIsAddingMember(false);
            setShowWarning(false);
            window.location.reload(); // Refresh to show new member
        } catch (error: any) {
            console.error("Error adding member:", error);
            alert(error.message || "Failed to add member");
        } finally {
            setLoading(false);
        }
    };

    const loadCalendarData = async () => {
        if (calendarLoading) return;

        try {
            setCalendarLoading(true);
            const supabase = createClient();

            // Load medications for this circle
            const { data: medsData, error: medsError } = await supabase
                .from("medications")
                .select("*")
                .eq("circle_id", circleId)
                .eq("active", true);

            if (medsError) throw medsError;

            // Load calendar events for this circle
            const { data: eventsData, error: eventsError } = await supabase
                .from("calendar_events")
                .select("*")
                .eq("circle_id", circleId);

            if (eventsError) throw eventsError;

            setMedications(medsData || []);
            setEvents(eventsData || []);
        } catch (error) {
            console.error("Error loading calendar data:", error);
        } finally {
            setCalendarLoading(false);
        }
    };

    // Load calendar data when switching to calendar tab
    const handleTabChange = (tab: "tasks" | "calendar") => {
        setActiveTab(tab);
        if (tab === "calendar") {
            loadCalendarData();
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-terracotta mb-2">
                            {circleData.circle.name}
                        </h1>
                        <p className="text-gray-600 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {circleData.members.length} member{circleData.members.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => {
                                setShowWarning(true);
                                setIsAddingMember(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-xl hover:bg-deep-slate transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add Member
                        </button>
                    )}
                </div>

                {/* Members List */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Circle Members</h3>
                    <div className="flex flex-wrap gap-3">
                        {circleData.members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center gap-2 px-3 py-2 bg-soft-blush rounded-lg"
                            >
                                <div className="w-8 h-8 rounded-full bg-terracotta/20 flex items-center justify-center text-terracotta font-bold text-sm">
                                    {member.full_name?.substring(0, 2).toUpperCase() || member.username.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{member.full_name || member.username}</p>
                                    <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Warning when adding member */}
                {showWarning && isAddingMember && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-900 mb-1">Important: Shared Access</p>
                            <p className="text-sm text-amber-800">
                                Members you add will have full access to view, edit, and manage all Care Tasks and Calendar events in this circle. Only add people you trust.
                            </p>
                        </div>
                    </div>
                )}

                {/* Add Member Form */}
                {isAddingMember && (
                    <form onSubmit={handleAddMember} className="p-4 bg-white rounded-xl border border-slate-blue/20 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={newMemberUsername}
                                    onChange={(e) => setNewMemberUsername(e.target.value)}
                                    placeholder="Enter username (e.g., @johndoe)"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-blue/20 text-black"
                                    autoFocus
                                />
                                {showResults && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                        {searchResults.map((user) => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => handleSelectUser(user.username)}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-slate-blue/10 flex items-center justify-center text-slate-blue font-bold text-xs">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt={user.username} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        (user.full_name?.[0] || user.username?.[0] || "?").toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{user.full_name || user.username}</p>
                                                    <p className="text-xs text-gray-500">@{user.username}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-deep-slate disabled:opacity-50"
                            >
                                {loading ? "Adding..." : "Add"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddingMember(false);
                                    setShowWarning(false);
                                }}
                                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                    <button
                        onClick={() => handleTabChange("tasks")}
                        className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${activeTab === "tasks"
                            ? "text-slate-blue border-b-2 border-slate-blue"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <ClipboardList className="w-4 h-4" />
                        Care Tasks
                    </button>
                    <button
                        onClick={() => handleTabChange("calendar")}
                        className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${activeTab === "calendar"
                            ? "text-slate-blue border-b-2 border-slate-blue"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Calendar
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="mt-6">
                {activeTab === "tasks" && (
                    <CareDashboard circleId={circleId} isOwner={isAdmin} />
                )}
                {activeTab === "calendar" && (
                    <div>
                        {calendarLoading ? (
                            <div className="text-center py-10 text-gray-500">Loading calendar...</div>
                        ) : (
                            <CalendarView events={events} medications={medications} circleId={circleId} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
