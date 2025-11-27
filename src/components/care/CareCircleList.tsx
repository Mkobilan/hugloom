"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users, ChevronRight } from "lucide-react";
import { createCareCircle } from "@/lib/actions/care-circles";

interface CareCircle {
    id: string;
    name: string;
    created_by: string;
    created_at: string;
    my_role: string;
}

export const CareCircleList = ({ circles }: { circles: CareCircle[] }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newCircleName, setNewCircleName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCircleName.trim()) return;

        try {
            setLoading(true);
            await createCareCircle(newCircleName);
            setNewCircleName("");
            setIsCreating(false);
        } catch (error) {
            console.error("Error creating circle:", error);
            alert("Failed to create circle");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-terracotta">My Circles</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-xl hover:bg-deep-slate transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create Circle
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreate} className="p-4 bg-white rounded-xl border border-slate-blue/20 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Circle Name</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newCircleName}
                            onChange={(e) => setNewCircleName(e.target.value)}
                            placeholder="e.g. Mom's Care Team"
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-blue/20"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-deep-slate disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="grid gap-4">
                {circles.length === 0 ? (
                    <div className="text-center py-12 bg-soft-blush/30 rounded-2xl border-2 border-dashed border-slate-blue/10">
                        <Users className="w-12 h-12 text-slate-blue/40 mx-auto mb-3" />
                        <p className="text-gray-500">You haven't joined any Care Circles yet.</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="text-slate-blue font-medium hover:underline mt-2"
                        >
                            Create one now
                        </button>
                    </div>
                ) : (
                    circles.map((circle) => (
                        <Link
                            key={circle.id}
                            href={`/care-circles/${circle.id}`}
                            className="block p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-slate-blue/30 transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-soft-blush flex items-center justify-center text-terracotta font-bold text-lg">
                                        {circle.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-slate-blue transition-colors">
                                            {circle.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Role: <span className="capitalize">{circle.my_role}</span>
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-slate-blue" />
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};
