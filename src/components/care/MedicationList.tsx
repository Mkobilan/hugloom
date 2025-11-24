"use client";

import { Calendar, Pill, Edit2, Trash2 } from 'lucide-react';

interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    notes: string;
    times: string[];
    active: boolean;
    reminder_enabled: boolean;
    start_date: string;
    end_date: string | null;
    user_id: string;
    created_at: string;
}

interface MedicationListProps {
    medications: Medication[];
    onEdit: (med: Medication, type: 'medication') => void;
    onDelete: (id: string, category: string) => void;
}

export const MedicationList = ({ medications, onEdit, onDelete }: MedicationListProps) => {
    if (medications.length === 0) return null;

    return (
        <section className="mt-8">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                All Medications ({medications.length})
            </h2>
            <div className="space-y-2">
                {medications.map(med => (
                    <div key={med.id} className="bg-soft-blush p-4 rounded-xl border border-slate-blue/20 flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 bg-terracotta/10 rounded-xl text-terracotta">
                                <Pill className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-foreground">{med.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {med.dosage} {med.dosage && med.frequency && '•'} {med.frequency}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {med.times.length} time{med.times.length !== 1 ? 's' : ''} daily: {med.times.join(', ')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onEdit(med, 'medication')}
                                className="p-2 text-slate-blue hover:bg-slate-blue/10 rounded-lg transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDelete(med.id, 'medication')}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
