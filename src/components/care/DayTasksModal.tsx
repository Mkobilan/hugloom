"use client";
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
    id: string;
    title: string;
    description?: string;
    task_category: string;
    start_time: string;
    isMedication?: boolean;
    time?: string;
}

interface DayTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDay: Date | null;
    tasks: Task[];
}

export const DayTasksModal = ({ isOpen, onClose, selectedDay, tasks }: DayTasksModalProps) => {
    if (!isOpen || !selectedDay) return null;

    const getEventColor = (category: string) => {
        switch (category) {
            case 'medication': return 'bg-terracotta text-white';
            case 'personal_care': return 'bg-sage text-white';
            case 'appointment': return 'bg-slate-blue text-white';
            case 'task': return 'bg-mustard text-gray-900';
            default: return 'bg-sage text-white';
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'medication': return 'Medication';
            case 'personal_care': return 'Personal Care';
            case 'appointment': return 'Appointment';
            case 'task': return 'Task';
            default: return 'Task';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-[#3C3434] rounded-3xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="font-heading font-bold text-2xl text-white">
                            {format(selectedDay, 'EEEE, MMMM d, yyyy')}
                        </h2>
                        <p className="text-sm text-white/60 mt-1">
                            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} scheduled
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {tasks.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-white/50 text-lg">No tasks scheduled for this day</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="bg-[#4A4042] rounded-2xl p-4 border border-white/10 hover:border-white/30 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Time */}
                                        <div className="flex-shrink-0 text-center min-w-[80px]">
                                            <div className="font-bold text-lg text-white">
                                                {task.isMedication
                                                    ? task.time
                                                    : format(new Date(task.start_time), 'h:mm a')}
                                            </div>
                                        </div>

                                        {/* Task Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-white text-lg">
                                                    {task.title}
                                                </h3>
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                    getEventColor(task.task_category)
                                                )}>
                                                    {getCategoryLabel(task.task_category)}
                                                </span>
                                            </div>
                                            {task.description && (
                                                <p className="text-white/70 text-sm leading-relaxed">
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="w-full bg-terracotta text-white font-semibold py-3 px-6 rounded-full hover:bg-terracotta/90 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
