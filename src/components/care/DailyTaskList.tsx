"use client";

import { CheckCircle2, Circle, Clock, Edit2, Trash2, Pill } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types (mirrored from page for now, ideally in a shared types file)
interface TaskWithTime {
    id: string;
    name: string;
    dosage?: string;
    frequency?: string;
    notes: string;
    scheduledTime: string;
    date: string; // Added date field
    isCompleted: boolean;
    isPast: boolean;
    taskCategory: 'medication' | 'personal_care' | 'appointment' | 'task';
    originalData: any;
}

interface DailyTaskListProps {
    tasks: TaskWithTime[];
    loading: boolean;
    onComplete: (task: TaskWithTime) => void;
    onEdit: (task: any, type: any) => void;
    onDelete: (id: string, category: string) => void;
    onAddFirst: () => void;
}

export const DailyTaskList = ({ tasks, loading, onComplete, onEdit, onDelete, onAddFirst }: DailyTaskListProps) => {
    const overdueTasks = tasks.filter(t => t.isPast && !t.isCompleted);
    const upcomingTasks = tasks.filter(t => !t.isPast && !t.isCompleted);
    const completedTasks = tasks.filter(t => t.isCompleted);

    if (loading) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                Loading tasks...
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="text-center py-16 bg-soft-blush rounded-2xl border-2 border-dashed border-slate-blue/20">
                <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No tasks scheduled for today.</p>
                <button
                    onClick={onAddFirst}
                    className="px-6 py-3 bg-slate-blue text-white rounded-xl font-medium hover:bg-deep-slate transition-colors"
                >
                    Add Your First Task
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overdue Tasks */}
            {overdueTasks.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">
                        <Circle className="w-4 h-4 fill-red-600" />
                        Overdue ({overdueTasks.length})
                    </h2>
                    <div className="space-y-2">
                        {overdueTasks.map((task, idx) => (
                            <TaskCard
                                key={`${task.id}-${task.scheduledTime}-${idx}`}
                                task={task}
                                onComplete={onComplete}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                variant="overdue"
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Upcoming Tasks */}
            {upcomingTasks.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold text-slate-blue mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Coming Up ({upcomingTasks.length})
                    </h2>
                    <div className="space-y-2">
                        {upcomingTasks.map((task, idx) => (
                            <TaskCard
                                key={`${task.id}-${task.scheduledTime}-${idx}`}
                                task={task}
                                onComplete={onComplete}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                variant="upcoming"
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold text-sage mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Completed Today ({completedTasks.length})
                    </h2>
                    <div className="space-y-2">
                        {completedTasks.map((task, idx) => (
                            <TaskCard
                                key={`${task.id}-${task.scheduledTime}-${idx}`}
                                task={task}
                                onComplete={onComplete}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                variant="completed"
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

// Internal Task Card Component
const TaskCard = ({
    task,
    onComplete,
    onEdit,
    onDelete,
    variant
}: {
    task: TaskWithTime;
    onComplete: (task: TaskWithTime) => void;
    onEdit: (task: any, type: any) => void;
    onDelete: (id: string, category: string) => void;
    variant: 'overdue' | 'upcoming' | 'completed';
}) => {
    const borderColor = variant === 'overdue' ? 'border-red-200' : variant === 'completed' ? 'border-sage/30' : 'border-slate-blue/20';
    const bgColor = variant === 'overdue' ? 'bg-red-50' : variant === 'completed' ? 'bg-sage/5' : 'bg-soft-blush';

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'medication': return '💊';
            case 'personal_care': return '🛁';
            case 'appointment': return '📅';
            case 'task': return '✅';
            default: return '📋';
        }
    };

    // Format date for display if not today
    const getDisplayDate = (dateStr: string) => {
        const today = new Date().toISOString().split('T')[0];
        if (dateStr === today) return '';

        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const displayDate = getDisplayDate(task.date);

    return (
        <div className={cn("p-4 rounded-xl border flex items-center justify-between", borderColor, bgColor)}>
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={() => !task.isCompleted && onComplete(task)}
                    disabled={task.isCompleted}
                    className="flex-shrink-0"
                >
                    {task.isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-sage fill-sage/20" />
                    ) : (
                        <Circle className={cn("w-6 h-6", variant === 'overdue' ? 'text-red-500' : 'text-slate-blue')} />
                    )}
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs">{getCategoryIcon(task.taskCategory)}</span>
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded", variant === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-slate-blue/10 text-slate-blue')}>
                            {displayDate ? `${displayDate} • ` : ''}{task.scheduledTime}
                        </span>
                        <h3 className={cn("font-bold truncate", task.isCompleted ? 'line-through text-muted-foreground' : 'text-gray-900')}>
                            {task.name}
                        </h3>
                    </div>
                    <p className="text-sm text-gray-700 truncate">
                        {task.dosage && task.frequency ? `${task.dosage} • ${task.frequency}` : task.notes}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
                <button
                    onClick={() => onEdit(task.originalData, task.taskCategory)}
                    className="p-2 text-slate-blue hover:bg-slate-blue/10 rounded-lg transition-colors"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(task.id, task.taskCategory)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
