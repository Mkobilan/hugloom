import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { Heart, MapPin, HandHeart } from 'lucide-react'

export default async function LocalHugsPage() {
    const supabase = await createClient()
    // For now, we might not have a separate table, so we can either mock it or use a filtered view of marketplace/posts.
    // Given the prompt "Local Hugs will be a place for people to find services like med pickup, and other support services",
    // I'll create a placeholder UI that looks like a service directory.

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <div className="bg-sky-100 p-4 rounded-xl mb-6 border border-sky-200">
                    <p className="text-xs text-sky-800 font-bold text-center">
                        🤝 Connect with local volunteers and professionals for support services.
                    </p>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-heading font-bold text-terracotta">Local Hugs</h1>
                    <button className="px-4 py-2 bg-terracotta text-white rounded-full font-bold text-sm shadow-md hover:bg-terracotta/90 transition-colors">
                        Request Help
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {/* Placeholder Service Cards */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-border/50 flex items-start gap-4">
                        <div className="p-3 bg-rose-100 rounded-full text-rose-600">
                            <HandHeart className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-foreground">Medication Pickup</h3>
                            <p className="text-sm text-muted-foreground mb-2">Volunteer available to pick up prescriptions from CVS on Main St.</p>
                            <div className="flex items-center gap-2 text-xs text-terracotta font-medium">
                                <MapPin className="w-3 h-3" />
                                <span>0.5 miles away • Sarah J.</span>
                            </div>
                        </div>
                        <button className="px-3 py-1 bg-cream text-foreground text-xs font-bold rounded-full hover:bg-terracotta/10 transition-colors">
                            Connect
                        </button>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-border/50 flex items-start gap-4">
                        <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                            <Heart className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-foreground">Respite Care</h3>
                            <p className="text-sm text-muted-foreground mb-2">Certified caregiver available for 2-hour slots this weekend.</p>
                            <div className="flex items-center gap-2 text-xs text-terracotta font-medium">
                                <MapPin className="w-3 h-3" />
                                <span>1.2 miles away • David M.</span>
                            </div>
                        </div>
                        <button className="px-3 py-1 bg-cream text-foreground text-xs font-bold rounded-full hover:bg-terracotta/10 transition-colors">
                            Connect
                        </button>
                    </div>

                    <div className="text-center py-8 text-muted-foreground">
                        <p>More local services coming soon!</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
