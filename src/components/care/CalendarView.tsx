"use client";
import { useState } from 'react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CalendarView = ({ events }: { events: any[] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    });

    const selectedEvents = events.filter(event => isSameDay(new Date(event.start_time), selectedDate));

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-terracotta/10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading font-bold text-lg text-terracotta">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-cream rounded-full transition-colors">
                            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-cream rounded-full transition-colors">
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                        <div key={`day-header-${index}`} className="text-xs text-muted-foreground font-medium">{day}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, i) => {
                        const dayEvents = events.filter(e => isSameDay(new Date(e.start_time), day));
                        const hasEvents = dayEvents.length > 0;
                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => setSelectedDate(day)}
                                className={cn(
                                    "h-10 rounded-full flex items-center justify-center text-sm relative transition-all",
                                    isSameDay(day, selectedDate) ? "bg-terracotta text-white font-bold shadow-md shadow-terracotta/20" : "hover:bg-cream text-foreground",
                                    !isSameMonth(day, currentDate) && "text-muted-foreground/30"
                                )}
                            >
                                {format(day, 'd')}
                                {hasEvents && !isSameDay(day, selectedDate) && (
                                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-sage" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-terracotta/10">
                <h3 className="font-bold text-foreground mb-4 font-heading">
                    {format(selectedDate, 'EEEE, MMMM do')}
                </h3>
                <div className="space-y-3">
                    {selectedEvents.length > 0 ? (
                        selectedEvents.map(event => {
                            // Get color based on task category
                            const getEventColor = (category: string) => {
                                switch (category) {
                                    case 'medication': return 'bg-terracotta';
                                    case 'personal_care': return 'bg-sage';
                                    case 'appointment': return 'bg-slate-blue';
                                    case 'task': return 'bg-mustard';
                                    default: return 'bg-sage';
                                }
                            };

                            const getCategoryIcon = (category: string) => {
                                switch (category) {
                                    case 'medication': return '💊';
                                    case 'personal_care': return '🛁';
                                    case 'appointment': return '📅';
                                    case 'task': return '✅';
                                    default: return '📋';
                                }
                            };

                            return (
                                <div key={event.id} className="flex items-center gap-3 p-3 bg-cream/50 rounded-xl border border-border/50">
                                    <div className={cn("w-1.5 h-10 rounded-full", getEventColor(event.task_category))} />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{getCategoryIcon(event.task_category)}</span>
                                            <h4 className="font-bold text-sm text-foreground">{event.title}</h4>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(event.start_time), 'h:mm a')}
                                            {event.description && ` • ${event.description}`}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-sm text-muted-foreground">No events for this day.</p>
                        </div>
                    )}
                    <Link href="/meds" className="w-full py-3 mt-2 text-sm text-terracotta font-bold border border-terracotta/20 rounded-xl hover:bg-terracotta/5 transition-colors flex items-center justify-center gap-2">
                        <span>+ Add Event</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};
