"use client";

import { cn } from '@/lib/utils';

interface TaskFiltersProps {
    activeFilter: 'all' | 'medication' | 'personal_care' | 'appointment' | 'task';
    onFilterChange: (filter: 'all' | 'medication' | 'personal_care' | 'appointment' | 'task') => void;
}

export const TaskFilters = ({ activeFilter, onFilterChange }: TaskFiltersProps) => {
    const filters = [
        { value: 'all', label: 'All', icon: '📋' },
        { value: 'medication', label: 'Medications', icon: '💊' },
        { value: 'personal_care', label: 'Personal Care', icon: '🛁' },
        { value: 'appointment', label: 'Appointments', icon: '📅' },
        { value: 'task', label: 'Tasks', icon: '✅' },
    ] as const;

    return (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map(({ value, label, icon }) => (
                <button
                    key={value}
                    onClick={() => onFilterChange(value)}
                    className={cn(
                        "px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all border",
                        activeFilter === value
                            ? "bg-slate-blue text-white border-slate-blue shadow-md"
                            : "bg-[#3C3434] text-gray-300 border-terracotta/10 hover:bg-[#453C3C] hover:shadow-md"
                    )}
                >
                    {icon} {label}
                </button>
            ))}
        </div>
    );
};
