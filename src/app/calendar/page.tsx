import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarView } from '@/components/care/CalendarView'
import { AppLayout } from '@/components/layout/AppLayout'

export default async function CalendarPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Load medications
    const { data: meds } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)

    // Load calendar events
    const { data: events } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('created_by', user.id)
        .order('start_time', { ascending: true })

    // Combine into unified event list
    const allEvents = [
        // Convert medications to calendar events
        ...(meds || []).flatMap((med: any) =>
            med.times.map((time: string) => ({
                id: `med-${med.id}-${time}`,
                title: med.name,
                description: `${med.dosage} - ${med.frequency}`,
                start_time: `${new Date().toISOString().split('T')[0]}T${time}`,
                task_category: 'medication',
            }))
        ),
        // Add calendar events
        ...(events || []),
    ]

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-heading font-bold text-terracotta mb-6">Care Calendar</h1>
                <CalendarView events={allEvents} />
            </div>
        </AppLayout>
    )
}

