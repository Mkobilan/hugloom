"use client";

import { useEffect, useState, useCallback } from 'react';
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
    circle_id: string | null;
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
    circle_id: string | null;
    created_at: string;
}

interface TaskWithTime {
    id: string;
    name: string;
    dosage?: string;
    frequency?: string;
    notes: string;
    scheduledTime: string;
    date: string;
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

interface CareDashboardProps {
    circleId?: string;
    isOwner?: boolean;
}

export const CareDashboard = ({ circleId, isOwner = false }: CareDashboardProps) => {
    const supabase = createClient();
    const [medications, setMedications] = useState<Medication[]>([]);
    const [todayTasks, setTodayTasks] = useState<TaskWithTime[]>([]);
    const [completions, setCompletions] = useState<TaskCompletion[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Medication | CalendarEvent | undefined>(undefined);
    const [activeTaskType, setActiveTaskType] = useState<'medication' | 'personal_care' | 'appointment' | 'task'>('medication');
    const [filter, setFilter] = useState<'all' | 'medication' | 'personal_care' | 'appointment' | 'task'>('all');

    // Load tasks function
    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            // Build query based on context (Personal vs Circle)
            let medsQuery = supabase
                .from('medications')
                .select('*')
                .eq('active', true)
                .order('created_at', { ascending: false });

            let eventsQuery = supabase
                .from('calendar_events')
                .select('*')
                .order('start_time', { ascending: true });

            if (circleId) {
                // Circle mode: fetch by circle_id
                medsQuery = medsQuery.eq('circle_id', circleId);
                eventsQuery = eventsQuery.eq('circle_id', circleId);
            } else {
                // Personal mode: fetch by user_id (and circle_id is null)
                medsQuery = medsQuery.eq('user_id', user.id).is('circle_id', null);
                eventsQuery = eventsQuery.eq('created_by', user.id).is('circle_id', null);
            }

            const { data: medsData, error: medsError } = await medsQuery;
            if (medsError) throw medsError;

            const { data: eventsData, error: eventsError } = await eventsQuery;
            if (eventsError) throw eventsError;

            // Load task completions
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
    }, [filter, circleId]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const generateTodayTasks = (meds: Medication[], events: CalendarEvent[], taskCompletions: TaskCompletion[], currentFilter: string) => {
        const tasks: TaskWithTime[] = [];
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        const checkCompletion = (type: 'medication' | 'event', id: string, scheduledTimeStr: string) => {
            if (type === 'medication') {
                const scheduledTimeText = `${today}T${scheduledTimeStr}`;
                return taskCompletions.some(c =>
                    c.medication_id === id &&
                    c.scheduled_time.startsWith(scheduledTimeText)
                );
            } else {
                return taskCompletions.some(c => c.event_id === id);
            }
        };

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

        events.forEach(event => {
            const eventDate = event.start_time.split('T')[0];
            const isToday = eventDate === today;
            const isFuture = eventDate > today;

            const shouldInclude = (currentFilter === 'all' && isToday) ||
                (currentFilter === event.task_category && (isToday || isFuture));

            if (shouldInclude) {
                const scheduledDateTime = new Date(event.start_time);
                const isPast = scheduledDateTime < now;
                const time = event.start_time.split('T')[1].substring(0, 5);
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

            setTodayTasks(prev =>
                prev.map(t =>
                    t.id === task.id
                        ? { ...t, isCompleted: !t.isCompleted }
                        : t
                )
            );

            if (task.isCompleted) {
                if (task.taskCategory === 'medication') {
                    const scheduledTimeText = `${task.date}T${task.scheduledTime}`;
                    const startTime = `${scheduledTimeText}:00`;
                    const endTime = `${scheduledTimeText}:59`;

                    const { error } = await supabase
                        .from('task_completions')
                        .delete()
                        .eq('medication_id', task.originalData.id)
                        .gte('scheduled_time', startTime)
                        .lte('scheduled_time', endTime);

                    if (error) throw error;

                    setCompletions(prev => prev.filter(c => {
                        if (c.medication_id !== task.originalData.id) return true;
                        return !c.scheduled_time.startsWith(scheduledTimeText);
                    }));
                } else {
                    const { error } = await supabase
                        .from('task_completions')
                        .delete()
                        .eq('event_id', task.originalData.id);

                    if (error) throw error;

                    setCompletions(prev => prev.filter(c => c.event_id !== task.originalData.id));
                }
            } else {
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

                if (data && data.length > 0) {
                    setCompletions(prev => [...prev, data[0]]);
                }
            }

        } catch (error) {
            console.error('Error toggling task completion:', error);
            alert('Error updating task status');
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
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-heading font-bold text-terracotta">Care Tasks</h2>
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
                circleId={circleId}
            />
        </div>
    );
};
