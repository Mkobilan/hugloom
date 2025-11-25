"use client";

import { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TaskModal } from '@/components/care/TaskModal';
import { TaskFilters } from '@/components/care/TaskFilters';
import { DailyTaskList } from '@/components/care/DailyTaskList';
import { MedicationList } from '@/components/care/MedicationList';
import { createClient } from '@/lib/supabase/client';
import { Plus } from 'lucide-react';

// Types
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

interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    task_category: 'personal_care' | 'appointment' | 'task';
    event_type: string;
    start_time: string;
    end_time: string;
    recurrence_pattern: string;
    created_by: string;
    created_at: string;
}

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
    originalData: Medication | CalendarEvent;
}

interface TaskCompletion {
    id: string;
    medication_id?: string;
    event_id?: string;
    completed_by: string;
    scheduled_time: string;
    status: string;
    created_at: string;
}

export default function CareTasksPage() {
    const supabase = createClient();
    const [medications, setMedications] = useState<Medication[]>([]);
    const [todayTasks, setTodayTasks] = useState<TaskWithTime[]>([]);
    const [completions, setCompletions] = useState<TaskCompletion[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Medication | CalendarEvent | undefined>(undefined);
    const [activeTaskType, setActiveTaskType] = useState<'medication' | 'personal_care' | 'appointment' | 'task'>('medication');
    const [filter, setFilter] = useState<'all' | 'medication' | 'personal_care' | 'appointment' | 'task'>('all');

    // Load tasks function wrapped in useCallback to avoid dependency loops
    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            // Load medications
            const { data: medsData, error: medsError } = await supabase
                .from('medications')
                .select('*')
                .eq('user_id', user.id)
                .eq('active', true)
                .order('created_at', { ascending: false });

            if (medsError) throw medsError;

            // Load calendar events
            const { data: eventsData, error: eventsError } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('created_by', user.id)
                .order('start_time', { ascending: true });

            if (eventsError) throw eventsError;

            // Load task completions for today (and future for appointments view)
            const { data: completionsData, error: completionsError } = await supabase
                .from('task_completions')
                .select('*')
                .eq('completed_by', user.id);

            if (completionsError) throw completionsError;

            setMedications(medsData || []);
            setCompletions(completionsData || []);
            generateTodayTasks(medsData || [], eventsData || [], completionsData || [], filter);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]); // Re-create when filter changes

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const generateTodayTasks = (meds: Medication[], events: CalendarEvent[], taskCompletions: TaskCompletion[], currentFilter: string) => {
        const tasks: TaskWithTime[] = [];
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Helper to check completion
        const checkCompletion = (type: 'medication' | 'event', id: string, scheduledTimeStr: string) => {
            if (type === 'medication') {
                // Simple text-based matching - no timezone conversions
                const scheduledTimeText = `${today}T${scheduledTimeStr}`;
                return taskCompletions.some(c =>
                    c.medication_id === id &&
                    c.scheduled_time.startsWith(scheduledTimeText)
                );
            } else {
                // For events, ID is unique per row
                return taskCompletions.some(c => c.event_id === id);
            }
        };

        // Add medication tasks (Always for today)
        // If filter is 'medication' or 'all', we show them.
        if (currentFilter === 'all' || currentFilter === 'medication') {
            meds.forEach(med => {
                med.times.forEach(time => {
                    const scheduledDateTime = new Date(`${today}T${time}`);
                    const isPast = scheduledDateTime < now;
                    const isCompleted = checkCompletion('medication', med.id, time);

                    tasks.push({
                        id: `med-${med.id}-${time}`,
                        name: med.name,
                        dosage: med.dosage,
                        frequency: med.frequency,
                        notes: med.notes,
                        scheduledTime: time,
                        date: today,
                        isCompleted,
                        isPast,
                        taskCategory: 'medication',
                        originalData: med,
                    });
                });
            });
        }

        // Add calendar event tasks
        events.forEach(event => {
            const eventDate = event.start_time.split('T')[0];
            const isToday = eventDate === today;
            const isFuture = eventDate > today;

            // Logic for showing events:
            // 1. If filter is 'all', show ONLY today's events (to keep the main view clean)
            // 2. If filter is specific (e.g. 'appointment'), show ALL future events of that type + today's
            // 3. Always show past incomplete events if they are from today (or maybe recent past? for now just today)

            const shouldInclude = (currentFilter === 'all' && isToday) ||
                (currentFilter === event.task_category && (isToday || isFuture));

            if (shouldInclude) {
                const scheduledDateTime = new Date(event.start_time);
                const isPast = scheduledDateTime < now;
                const time = event.start_time.split('T')[1].substring(0, 5); // Extract HH:MM
                const isCompleted = checkCompletion('event', event.id, '');

                tasks.push({
                    id: `event-${event.id}`,
                    name: event.title,
                    notes: event.description,
                    scheduledTime: time,
                    date: eventDate,
                    isCompleted,
                    isPast,
                    taskCategory: event.task_category,
                    originalData: event,
                });
            }
        });

        // Sort by date then time
        tasks.sort((a, b) => {
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date);
            }
            return a.scheduledTime.localeCompare(b.scheduledTime);
        });

        setTodayTasks(tasks);
    };

    const handleAddTask = () => {
        setEditingTask(undefined);
        setActiveTaskType(filter !== 'all' ? filter : 'medication');
        setIsModalOpen(true);
    };

    const handleEditTask = (task: Medication | CalendarEvent, type: 'medication' | 'personal_care' | 'appointment' | 'task') => {
        setEditingTask(task);
        setActiveTaskType(type);
        setIsModalOpen(true);
    };

    const handleDeleteTask = async (taskId: string, category: string) => {
        const isMedication = category === 'medication';
        const message = isMedication
            ? 'Are you sure you want to delete this medication?'
            : 'Are you sure you want to delete this event?';

        if (!confirm(message)) return;

        try {
            let table = '';
            let idToDelete = taskId;

            if (isMedication) {
                table = 'medications';
                if (taskId.startsWith('med-')) {
                    idToDelete = taskId.split('-')[1];
                }
            } else {
                table = 'calendar_events';
                if (taskId.startsWith('event-')) {
                    idToDelete = taskId.replace('event-', '');
                }
            }

            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', idToDelete);

            if (error) throw error;

            // Reload tasks immediately after successful deletion
            await loadTasks();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Error deleting item');
        }
    };

    const handleCompleteTask = async (task: TaskWithTime) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Optimistic update
            setTodayTasks(prev =>
                prev.map(t =>
                    t.id === task.id
                        ? { ...t, isCompleted: !t.isCompleted }
                        : t
                )
            );

            if (task.isCompleted) {
                // UNCHECK: Delete completion record
                if (task.taskCategory === 'medication') {
                    // Simple text-based matching - no timezone conversions
                    const scheduledTimeText = `${task.date}T${task.scheduledTime}`;

                    const { error } = await supabase
                        .from('task_completions')
                        .delete()
                        .eq('medication_id', task.originalData.id)
                        .like('scheduled_time', `${scheduledTimeText}%`);

                    if (error) throw error;

                    // Update local completions state - simple text matching
                    setCompletions(prev => prev.filter(c => {
                        if (c.medication_id !== task.originalData.id) return true;
                        // Keep completions that DON'T start with this scheduled time
                        return !c.scheduled_time.startsWith(scheduledTimeText);
                    }));
                } else {
                    // For events, delete by event_id
                    const { error } = await supabase
                        .from('task_completions')
                        .delete()
                        .eq('event_id', task.originalData.id);

                    if (error) throw error;

                    // Update local completions state
                    setCompletions(prev => prev.filter(c => c.event_id !== task.originalData.id));
                }
            } else {
                // CHECK: Insert completion record
                // Use simple text format - no timezone conversion
                const scheduledTimeText = `${task.date}T${task.scheduledTime}:00`;

                const completionData: any = {
                    completed_by: user.id,
                    scheduled_time: scheduledTimeText,
                    status: 'completed',
                };

                if (task.taskCategory === 'medication') {
                    completionData.medication_id = task.originalData.id;
                } else {
                    completionData.event_id = task.originalData.id;
                }

                const { data, error } = await supabase
                    .from('task_completions')
                    .insert(completionData)
                    .select();

                if (error) throw error;

                // Update local completions state
                if (data && data.length > 0) {
                    setCompletions(prev => [...prev, data[0]]);
                }
            }

        } catch (error) {
            console.error('Error toggling task completion:', error);
            alert('Error updating task status');
            // Revert optimistic update on error
            setTodayTasks(prev =>
                prev.map(t =>
                    t.id === task.id
                        ? { ...t, isCompleted: task.isCompleted }
                        : t
                )
            );
        }
    };

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-heading font-bold text-terracotta">Care Tasks</h1>
                    <button
                        onClick={handleAddTask}
                        className="p-2 bg-slate-blue text-white rounded-full shadow-lg hover:bg-deep-slate transition-all hover:scale-105"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                <TaskFilters
                    activeFilter={filter}
                    onFilterChange={setFilter}
                />

                <DailyTaskList
                    tasks={todayTasks}
                    loading={loading}
                    onComplete={handleCompleteTask}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onAddFirst={handleAddTask}
                />

                <MedicationList
                    medications={medications}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                />

                <TaskModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingTask(undefined);
                    }}
                    onSave={loadTasks}
                    taskType={activeTaskType}
                    editingTask={editingTask}
                />
            </div>
        </AppLayout>
    );
}
