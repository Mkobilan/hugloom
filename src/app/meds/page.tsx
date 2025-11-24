import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { Pill, Plus } from 'lucide-react'

export default async function MedsPage() {
    const supabase = await createClient()
    const { data: meds } = await supabase.from('medications').select('*')

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-heading font-bold text-terracotta">Medications</h1>
                    <button className="p-2 bg-terracotta text-white rounded-full shadow-lg shadow-terracotta/20 hover:scale-105 transition-transform">
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    {meds?.map((med) => (
                        <div key={med.id} className="bg-white p-4 rounded-2xl shadow-sm border border-terracotta/10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-sage/10 rounded-xl text-sage">
                                    <Pill className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground">{med.name}</h3>
                                    <p className="text-sm text-muted-foreground">{med.dosage} • {med.frequency}</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-cream text-terracotta font-bold text-sm rounded-xl hover:bg-terracotta/10 transition-colors">
                                Log
                            </button>
                        </div>
                    ))}
                    {(!meds || meds.length === 0) && (
                        <div className="text-center py-10 text-muted-foreground bg-white rounded-2xl border border-dashed border-terracotta/20">
                            <p>No medications added yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
