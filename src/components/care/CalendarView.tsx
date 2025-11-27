"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskModal } from './TaskModal';
import { DayTasksModal } from './DayTasksModal';

interface CalendarViewProps {
    events: any[];
    medications: any[];
    circleId?: string;
}

export const CalendarView = ({ events, medications, circleId }: CalendarViewProps) => {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState<Date | null>(null);

    useEffect(() => {
        setCurrentDate(new Date());
    }, []);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [taskType, setTaskType] = useState<'medication' | 'personal_care' | 'appointment' | 'task'>('medication');
    const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string; description: string } | null>(null);
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [selectedDayTasks, setSelectedDayTasks] = useState<any[]>([]);

    if (!currentDate) {
        return <div className="h-[600px] bg-white rounded-3xl animate-pulse" />;
    }

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const getTasksForDay = (day: Date) => {
        const dayStr = format(day, 'yyyy-MM-dd');

        // Handle regular calendar events (non-recurring and recurring)
        const dayEvents = events.flatMap(e => {
            // Check if this is a recurring daily event
            if (e.recurrence_pattern === 'daily') {
                // Get the start date from start_time
                const eventStartDate = new Date(e.start_time);
                const eventStartDateStr = format(eventStartDate, 'yyyy-MM-dd');

                // Check if the current day is within the recurrence range
                if (eventStartDateStr > dayStr) return [];
                if (e.recurrence_end_date && e.recurrence_end_date < dayStr) return [];

                // Extract the time from the original start_time
                const eventTime = format(eventStartDate, 'HH:mm');

                return [{
                    id: `event-${e.id}-${dayStr}`,
                    title: e.title,
                    description: e.description || 'No details',
                    task_category: e.task_category,
                    start_time: `${dayStr}T${eventTime}`,
                    originalData: e,
                    isRecurring: true,
                    time: eventTime
                }];
            } else {
                // Non-recurring event - only show on the exact date
                const eventDate = new Date(e.start_time);
                const eventDayStr = format(eventDate, 'yyyy-MM-dd');
                if (eventDayStr !== dayStr) return [];

                return [e];
            }
        });

        const medTasks = medications.flatMap(med => {
            if (med.start_date > dayStr) return [];
            if (med.end_date && med.end_date < dayStr) return [];

            return med.times.map((time: string) => ({
                id: `med-${med.id}-${dayStr}-${time}`,
                title: med.name,
                description: `${med.dosage} - ${med.frequency}`,
                task_category: 'medication',
                start_time: `${dayStr}T${time}`,
                originalData: med,
                isMedication: true,
                time: time
            }));
        });

        return [...dayEvents, ...medTasks].sort((a, b) => {
            const timeA = a.isMedication || a.isRecurring ? a.time : format(new Date(a.start_time), 'HH:mm');
            const timeB = b.isMedication || b.isRecurring ? b.time : format(new Date(b.start_time), 'HH:mm');
            return timeA.localeCompare(timeB);
        });
    };

    const handleEdit = (task: any) => {
        setTooltip(null);
        if (task.isMedication) {
            setEditingTask(task.originalData);
            setTaskType('medication');
        } else if (task.isRecurring) {
            // For recurring events, edit the original event
            setEditingTask(task.originalData);
            setTaskType(task.task_category || 'task');
        } else {
            setEditingTask(task);
            setTaskType(task.task_category || 'task');
        }
        setIsModalOpen(true);
    };

    const handleMouseEnter = (e: React.MouseEvent, task: any) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            x: rect.left + rect.width / 2,
            y: rect.top,
            title: task.title,
            description: task.description || 'No details'
        });
    };

    const getEventColor = (category: string) => {
        switch (category) {
            case 'medication': return 'bg-terracotta text-white';
            case 'personal_care': return 'bg-sage text-white';
            case 'appointment': return 'bg-slate-blue text-white';
            case 'task': return 'bg-mustard text-gray-900';
            default: return 'bg-sage text-white';
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-terracotta/10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-heading font-bold text-2xl text-gray-900">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-cream rounded-full transition-colors">
                            <ChevronLeft className="w-6 h-6 text-muted-foreground" />
                        </button>
                        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-cream rounded-full transition-colors">
                            <ChevronRight className="w-6 h-6 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <div key={`day-header-${index}`} className="bg-soft-blush p-3 text-center text-sm font-bold text-gray-700">
                            {day}
                        </div>
                    ))}

                    {days.map((day, i) => {
                        const tasks = getTasksForDay(day);
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={day.toISOString()}
                                onClick={() => {
                                    setSelectedDay(day);
                                    setSelectedDayTasks(tasks);
                                    setIsDayModalOpen(true);
                                }}
                                className={cn(
                                    "min-h-[140px] bg-white p-2 flex flex-col gap-1 transition-colors hover:bg-gray-50 cursor-pointer",
                                    !isCurrentMonth && "bg-gray-50/50 text-gray-400"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={cn(
                                        "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                                        isToday ? "bg-terracotta text-white" : "text-gray-700"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1 max-h-[100px]">
                                    {tasks.map((task: any) => (
                                        <div
                                            key={task.id}
                                            onClick={(e) => { e.stopPropagation(); handleEdit(task); }}
                                            onMouseEnter={(e) => handleMouseEnter(e, task)}
                                            onMouseLeave={() => setTooltip(null)}
                                            className={cn(
                                                "group relative text-xs p-1.5 rounded-md cursor-pointer transition-all hover:opacity-90 hover:shadow-sm truncate flex items-center gap-1",
                                                getEventColor(task.task_category)
                                            )}
                                        >
                                            <span className="font-bold shrink-0">
                                                {task.isMedication || task.isRecurring ? task.time : format(new Date(task.start_time), 'h:mm a')}
                                            </span>
                                            <span className="truncate">{task.title}</span>

                                            {/* Edit Icon on Hover */}
                                            <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded p-0.5">
                                                <Edit2 className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Fixed Position Tooltip */}
            {tooltip && (
                <div
                    className="fixed z-[100] bg-gray-900 text-white text-xs rounded-lg p-2 shadow-xl pointer-events-none"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y - 8,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <p className="font-bold">{tooltip.title}</p>
                    <p className="opacity-80">{tooltip.description}</p>
                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
            )}

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={() => {
                    setIsModalOpen(false);
                    router.refresh();
                }}
                taskType={taskType}
                editingTask={editingTask}
                circleId={circleId}
            />

            <DayTasksModal
                isOpen={isDayModalOpen}
                onClose={() => setIsDayModalOpen(false)}
                selectedDay={selectedDay}
                tasks={selectedDayTasks}
            />
        </div>
    );
};
