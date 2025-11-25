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

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-heading font-bold text-terracotta mb-6">Care Calendar</h1>
                <CalendarView events={events || []} medications={meds || []} />
            </div>
        </AppLayout>
    )
}

