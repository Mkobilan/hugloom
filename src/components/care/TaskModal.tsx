"use client";

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Pill, Bath, Calendar as CalendarIcon, CheckSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    taskType: 'medication' | 'personal_care' | 'appointment' | 'task';
    editingTask?: any;
    circleId?: string;
}

const TASK_TYPE_CONFIG = {
    medication: { icon: Pill, label: 'Medication', color: 'text-terracotta' },
    personal_care: { icon: Bath, label: 'Personal Care', color: 'text-sage' },
    appointment: { icon: CalendarIcon, label: 'Appointment', color: 'text-slate-blue' },
    task: { icon: CheckSquare, label: 'Task', color: 'text-mustard' },
};

export const TaskModal = ({ isOpen, onClose, onSave, taskType, editingTask, circleId }: TaskModalProps) => {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '', dosage: '', frequency: '', notes: '', times: ['08:00'],
        active: true, reminderEnabled: true,
        startDate: new Date().toISOString().split('T')[0], endDate: '',
        taskCategory: taskType, description: '', duration: 30, recurrencePattern: null,
    });

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    useEffect(() => {
        if (editingTask) {
            // Determine times and start date
            let times = ['08:00'];
            let startDate = new Date().toISOString().split('T')[0];

            if (editingTask.times) {
                // It's a medication
                times = editingTask.times;
                startDate = editingTask.start_date || startDate;
            } else if (editingTask.start_time) {
                // It's a calendar event
                // Parse UTC string to local time
                const startDateObj = new Date(editingTask.start_time);
                const year = startDateObj.getFullYear();
                const month = (startDateObj.getMonth() + 1).toString().padStart(2, '0');
                const day = startDateObj.getDate().toString().padStart(2, '0');
                const hours = startDateObj.getHours().toString().padStart(2, '0');
                const minutes = startDateObj.getMinutes().toString().padStart(2, '0');

                startDate = `${year}-${month}-${day}`;
                times = [`${hours}:${minutes}`];
            }

            setFormData({
                name: editingTask.name || editingTask.title || '',
                dosage: editingTask.dosage || '',
                frequency: editingTask.frequency || '',
                notes: editingTask.notes || editingTask.description || '',
                times: times,
                active: editingTask.active ?? true,
                reminderEnabled: editingTask.reminder_enabled ?? true,
                startDate: startDate,
                endDate: editingTask.end_date || editingTask.recurrence_end_date || '',
                taskCategory: editingTask.task_category || taskType,
                description: editingTask.description || '',
                duration: editingTask.duration || 30,
                recurrencePattern: editingTask.recurrence_pattern || null,
            });
        } else {
            setFormData({
                name: '', dosage: '', frequency: '', notes: '', times: ['08:00'],
                active: true, reminderEnabled: true,
                startDate: new Date().toISOString().split('T')[0], endDate: '',
                taskCategory: taskType, description: '', duration: 30, recurrencePattern: null,
            });
        }
    }, [editingTask, isOpen, taskType]);

    const addTime = () => setFormData(prev => ({ ...prev, times: [...prev.times, '12:00'] }));
    const removeTime = (index: number) => setFormData(prev => ({ ...prev, times: prev.times.filter((_, i) => i !== index) }));
    const updateTime = (index: number, value: string) => setFormData(prev => ({ ...prev, times: prev.times.map((time, i) => i === index ? value : time) }));

    const handleSave = async () => {
        try {
            setLoading(true);
            if (!user || !formData.name.trim() || formData.times.length === 0) {
                alert('Please fill in required fields');
                return;
            }

            if (formData.taskCategory === 'medication') {
                const medicationData: any = {
                    name: formData.name.trim(), dosage: formData.dosage.trim(),
                    frequency: formData.frequency.trim(), notes: formData.notes.trim(),
                    times: formData.times, active: formData.active,
                    reminder_enabled: formData.reminderEnabled,
                    start_date: formData.startDate, end_date: formData.endDate || null,
                };

                // Set user_id or circle_id based on context
                if (circleId) {
                    medicationData.circle_id = circleId;
                } else {
                    medicationData.user_id = user.id;
                }

                if (editingTask?.id) {
                    await supabase.from('medications').update(medicationData).eq('id', editingTask.id);
                } else {
                    await supabase.from('medications').insert(medicationData);
                }
            } else {
                // For calendar events (personal_care, appointment, task)
                // Determine if this is a recurring daily task
                const isRecurringDaily = formData.frequency === 'Once daily' ||
                    formData.frequency === 'Twice daily' ||
                    formData.frequency === 'Three times daily';

                let recurrencePattern: string | null = formData.recurrencePattern;
                if (isRecurringDaily) {
                    recurrencePattern = 'daily';
                } else if (formData.frequency === 'One-time') {
                    recurrencePattern = null;
                }

                if (editingTask?.id) {
                    // EDITING: Update existing event
                    const time = formData.times[0]; // Use first time for single event

                    // Create date object in local time
                    const startDateObj = new Date(`${formData.startDate}T${time}:00`);
                    const endDateObj = new Date(startDateObj.getTime() + formData.duration * 60000);

                    // Convert to UTC ISO strings for storage
                    const startDateTimeStr = startDateObj.toISOString();
                    const endDateTimeStr = endDateObj.toISOString();

                    const eventData: any = {
                        title: formData.name.trim(),
                        description: `${formData.frequency ? formData.frequency + ' - ' : ''}${formData.notes.trim()}`,
                        task_category: formData.taskCategory,
                        event_type: formData.taskCategory,
                        recurrence_pattern: recurrencePattern,
                        start_time: startDateTimeStr,
                        end_time: endDateTimeStr,
                    };

                    // Add recurrence_end_date if end date is provided
                    if (isRecurringDaily && formData.endDate) {
                        eventData.recurrence_end_date = formData.endDate;
                    } else {
                        eventData.recurrence_end_date = null;
                    }

                    // Extract the actual event ID (remove 'event-' prefix if present)
                    const eventId = editingTask.id.toString().startsWith('event-')
                        ? editingTask.id.toString().replace('event-', '')
                        : editingTask.id;

                    await supabase.from('calendar_events').update(eventData).eq('id', eventId);
                } else {
                    // CREATING: Insert new event(s)
                    for (const time of formData.times) {
                        // Create date object in local time
                        const startDateObj = new Date(`${formData.startDate}T${time}:00`);
                        const endDateObj = new Date(startDateObj.getTime() + formData.duration * 60000);

                        // Convert to UTC ISO strings for storage
                        const startDateTimeStr = startDateObj.toISOString();
                        const endDateTimeStr = endDateObj.toISOString();

                        const eventData: any = {
                            title: formData.name.trim(),
                            description: `${formData.frequency ? formData.frequency + ' - ' : ''}${formData.notes.trim()}`,
                            task_category: formData.taskCategory,
                            event_type: formData.taskCategory,
                            recurrence_pattern: recurrencePattern,
                            created_by: user.id,
                            start_time: startDateTimeStr,
                            end_time: endDateTimeStr,
                        };

                        // Add recurrence_end_date if end date is provided
                        if (isRecurringDaily && formData.endDate) {
                            eventData.recurrence_end_date = formData.endDate;
                        }

                        // Set circle_id if in circle context
                        if (circleId) {
                            eventData.circle_id = circleId;
                        }

                        await supabase.from('calendar_events').insert(eventData);
                    }
                }
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Error saving task');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const config = TASK_TYPE_CONFIG[formData.taskCategory as keyof typeof TASK_TYPE_CONFIG];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-soft-blush rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-soft-blush border-b border-slate-blue/20 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 text-deep-slate`} />
                        <h2 className="text-xl font-heading font-bold text-gray-900">
                            {editingTask ? 'Edit' : 'Add'} {config.label}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-dusty-rose rounded-full transition-colors text-gray-900">
                        <X className="w-5 h-5 text-gray-900" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Task Type Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Task Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(TASK_TYPE_CONFIG).map(([type, typeConfig]) => {
                                const TypeIcon = typeConfig.icon;
                                const isSelected = formData.taskCategory === type;
                                return (
                                    <button key={type} type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, taskCategory: type as any }))}
                                        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${isSelected ? 'border-slate-blue bg-slate-blue/10' : 'border-border hover:border-slate-blue/50'
                                            }`}>
                                        <TypeIcon className={`w-5 h-5 ${isSelected ? 'text-deep-slate' : 'text-gray-700'}`} />
                                        <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {typeConfig.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Lisinopril"
                            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-blue/50 transition-all"
                        />
                    </div>

                    {formData.taskCategory === 'medication' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Dosage</label>
                            <input type="text" value={formData.dosage}
                                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                                placeholder="e.g., 10mg"
                                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-blue/50 transition-all"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Frequency</label>
                        <select value={formData.frequency}
                            onChange={(e) => {
                                const newFreq = e.target.value;
                                setFormData(prev => {
                                    // Auto-adjust times based on frequency for non-medication tasks
                                    let newTimes = prev.times;
                                    if (prev.taskCategory !== 'medication') {
                                        if (newFreq === 'Once daily' && prev.times.length !== 1) {
                                            newTimes = ['08:00'];
                                        } else if (newFreq === 'Twice daily' && prev.times.length !== 2) {
                                            newTimes = ['08:00', '20:00'];
                                        } else if (newFreq === 'Three times daily' && prev.times.length !== 3) {
                                            newTimes = ['08:00', '14:00', '20:00'];
                                        }
                                    }
                                    return { ...prev, frequency: newFreq, times: newTimes };
                                });
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-blue/50 transition-all">
                            <option value="">Select frequency</option>
                            <option value="One-time">One-time</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Three times daily">Three times daily</option>
                        </select>
                    </div>

                    {/* Date Range for All Task Types */}
                    {(formData.taskCategory === 'appointment' || formData.taskCategory === 'task' || formData.taskCategory === 'personal_care') && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Start Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-blue/50 transition-all"
                                />
                            </div>
                            {(formData.frequency === 'Once daily' || formData.frequency === 'Twice daily' || formData.frequency === 'Three times daily') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        End Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-blue/50 transition-all"
                                    />
                                </div>
                            )}
                        </>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-900">
                                {formData.times.length > 1 ? 'Times' : 'Time'} <span className="text-red-500">*</span>
                            </label>
                            {(formData.taskCategory === 'medication' || formData.frequency === 'Once daily' || formData.frequency === 'Twice daily' || formData.frequency === 'Three times daily') && (
                                <button type="button" onClick={addTime}
                                    className="flex items-center gap-1 text-xs text-slate-blue hover:text-deep-slate transition-colors">
                                    <Plus className="w-4 h-4" /> Add Time
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {formData.times.map((time, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-700" />
                                    <input type="time" value={time}
                                        onChange={(e) => updateTime(index, e.target.value)}
                                        className="flex-1 px-4 py-2 rounded-xl border border-border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-blue/50 transition-all"
                                    />
                                    {formData.times.length > 1 && (formData.taskCategory === 'medication' || formData.frequency === 'Once daily' || formData.frequency === 'Twice daily' || formData.frequency === 'Three times daily') && (
                                        <button type="button" onClick={() => removeTime(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Notes</label>
                        <textarea value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional instructions..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-blue/50 transition-all resize-none"
                        />
                    </div>
                </div>

                <div className="sticky bottom-0 bg-soft-blush border-t border-slate-blue/20 p-4 flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 px-6 py-3 rounded-xl border border-border bg-white text-gray-900 font-medium hover:bg-dusty-rose transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={loading}
                        className="flex-1 px-6 py-3 rounded-xl bg-slate-blue text-white font-medium hover:bg-deep-slate transition-colors disabled:opacity-50">
                        {loading ? 'Saving...' : editingTask ? 'Update' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};
