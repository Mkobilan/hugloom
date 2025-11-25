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
}

const TASK_TYPE_CONFIG = {
    medication: { icon: Pill, label: 'Medication', color: 'text-terracotta' },
    personal_care: { icon: Bath, label: 'Personal Care', color: 'text-sage' },
    appointment: { icon: CalendarIcon, label: 'Appointment', color: 'text-slate-blue' },
    task: { icon: CheckSquare, label: 'Task', color: 'text-mustard' },
};

export const TaskModal = ({ isOpen, onClose, onSave, taskType, editingTask }: TaskModalProps) => {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '', dosage: '', frequency: '', notes: '', times: ['08:00'],
        active: true, reminderEnabled: true,
        startDate: new Date().toISOString().split('T')[0], endDate: '',
        taskCategory: taskType, description: '', duration: 30, recurrencePattern: 'daily',
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
                // Just read the string directly as it is stored (Local Time)
                const timePart = editingTask.start_time.split('T')[1];
                if (timePart) {
                    times = [timePart.substring(0, 5)]; // "14:30"
                }
                startDate = editingTask.start_time.split('T')[0];
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
                endDate: editingTask.end_date || '',
                taskCategory: editingTask.task_category || taskType,
                description: editingTask.description || '',
                duration: editingTask.duration || 30,
                recurrencePattern: editingTask.recurrence_pattern || 'daily',
            });
        } else {
            setFormData({
                name: '', dosage: '', frequency: '', notes: '', times: ['08:00'],
                active: true, reminderEnabled: true,
                startDate: new Date().toISOString().split('T')[0], endDate: '',
                taskCategory: taskType, description: '', duration: 30, recurrencePattern: 'daily',
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
                const medicationData = {
                    name: formData.name.trim(), dosage: formData.dosage.trim(),
                    frequency: formData.frequency.trim(), notes: formData.notes.trim(),
                    times: formData.times, active: formData.active,
                    reminder_enabled: formData.reminderEnabled,
                    start_date: formData.startDate, end_date: formData.endDate || null,
                    user_id: user.id,
                };

                if (editingTask?.id) {
                    await supabase.from('medications').update(medicationData).eq('id', editingTask.id);
                } else {
                    await supabase.from('medications').insert(medicationData);
                }
            } else {
                // For calendar events (personal_care, appointment, task)
                if (editingTask?.id) {
                    // EDITING: Update existing event
                    const time = formData.times[0]; // Use first time for single event

                    // Construct Local ISO String manually to avoid UTC conversion
                    // Format: YYYY-MM-DDTHH:mm:ss
                    const startDateTimeStr = `${formData.startDate}T${time}:00`;

                    // Calculate end time
                    const startDateObj = new Date(`${formData.startDate}T${time}`);
                    const endDateObj = new Date(startDateObj.getTime() + formData.duration * 60000);

                    const endYear = endDateObj.getFullYear();
                    const endMonth = (endDateObj.getMonth() + 1).toString().padStart(2, '0');
                    const endDay = endDateObj.getDate().toString().padStart(2, '0');
                    const endHours = endDateObj.getHours().toString().padStart(2, '0');
                    const endMinutes = endDateObj.getMinutes().toString().padStart(2, '0');
                    const endDateTimeStr = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}:00`;

                    const eventData = {
                        title: formData.name.trim(),
                        description: formData.notes.trim(),
                        task_category: formData.taskCategory,
                        event_type: formData.taskCategory,
                        recurrence_pattern: formData.recurrencePattern,
                        start_time: startDateTimeStr,
                        end_time: endDateTimeStr,
                    };

                    // Extract the actual event ID (remove 'event-' prefix if present)
                    const eventId = editingTask.id.toString().startsWith('event-')
                        ? editingTask.id.toString().replace('event-', '')
                        : editingTask.id;

                    await supabase.from('calendar_events').update(eventData).eq('id', eventId);
                } else {
                    // CREATING: Insert new event(s)
                    for (const time of formData.times) {
                        // Construct Local ISO String manually
                        const startDateTimeStr = `${formData.startDate}T${time}:00`;

                        const startDateObj = new Date(`${formData.startDate}T${time}`);
                        const endDateObj = new Date(startDateObj.getTime() + formData.duration * 60000);

                        const endYear = endDateObj.getFullYear();
                        const endMonth = (endDateObj.getMonth() + 1).toString().padStart(2, '0');
                        const endDay = endDateObj.getDate().toString().padStart(2, '0');
                        const endHours = endDateObj.getHours().toString().padStart(2, '0');
                        const endMinutes = endDateObj.getMinutes().toString().padStart(2, '0');
                        const endDateTimeStr = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}:00`;

                        await supabase.from('calendar_events').insert({
                            title: formData.name.trim(),
                            description: formData.notes.trim(),
                            task_category: formData.taskCategory,
                            event_type: formData.taskCategory,
                            recurrence_pattern: formData.recurrencePattern,
                            created_by: user.id,
                            start_time: startDateTimeStr,
                            end_time: endDateTimeStr,
                        });
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
                        <Icon className={`w-5 h-5 ${config.color}`} />
                        <h2 className="text-xl font-heading font-bold text-foreground">
                            {editingTask ? 'Edit' : 'Add'} {config.label}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-dusty-rose rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Task Type Selector */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Task Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(TASK_TYPE_CONFIG).map(([type, typeConfig]) => {
                                const TypeIcon = typeConfig.icon;
                                const isSelected = formData.taskCategory === type;
                                return (
                                    <button key={type} type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, taskCategory: type as any }))}
                                        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${isSelected ? 'border-slate-blue bg-slate-blue/10' : 'border-border hover:border-slate-blue/50'
                                            }`}>
                                        <TypeIcon className={`w-5 h-5 ${isSelected ? typeConfig.color : 'text-muted-foreground'}`} />
                                        <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {typeConfig.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input type="text" value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Lisinopril"
                            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-blue/50 transition-all"
                        />
                    </div>

                    {formData.taskCategory === 'medication' && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Dosage</label>
                            <input type="text" value={formData.dosage}
                                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                                placeholder="e.g., 10mg"
                                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-blue/50 transition-all"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Frequency</label>
                        <select value={formData.frequency}
                            onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-blue/50 transition-all">
                            <option value="">Select frequency</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Three times daily">Three times daily</option>
                        </select>
                    </div>

                    {/* Date Picker for Non-Recurring Tasks (Appointments, One-off Tasks) */}
                    {(formData.taskCategory === 'appointment' || formData.taskCategory === 'task' || formData.taskCategory === 'personal_care') && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-blue/50 transition-all"
                            />
                        </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-foreground">
                                {formData.taskCategory === 'medication' ? 'Times' : 'Time'} <span className="text-red-500">*</span>
                            </label>
                            {formData.taskCategory === 'medication' && (
                                <button type="button" onClick={addTime}
                                    className="flex items-center gap-1 text-xs text-slate-blue hover:text-deep-slate transition-colors">
                                    <Plus className="w-4 h-4" /> Add Time
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {formData.times.map((time, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <input type="time" value={time}
                                        onChange={(e) => updateTime(index, e.target.value)}
                                        className="flex-1 px-4 py-2 rounded-xl border border-border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-blue/50 transition-all"
                                    />
                                    {formData.times.length > 1 && formData.taskCategory === 'medication' && (
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
                        <label className="block text-sm font-medium text-foreground mb-2">Notes</label>
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
