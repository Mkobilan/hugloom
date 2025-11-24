import { createClient } from '@/lib/supabase/server'
import { CalendarView } from '@/components/care/CalendarView'
import { AppLayout } from '@/components/layout/AppLayout'

export default async function CalendarPage() {
    const supabase = await createClient()
    const { data: events } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_time', { ascending: true })

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-heading font-bold text-terracotta mb-6">Care Calendar</h1>
                <CalendarView events={events || []} />
            </div>
        </AppLayout>
    )
}
