import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { MyListingCard } from '@/components/marketplace/MyListingCard'

export default async function MyListingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <AppLayout>
                <div className="max-w-2xl mx-auto text-center py-10">
                    <p className="text-white">Please log in to view your listings.</p>
                </div>
            </AppLayout>
        )
    }

    const { data: items } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Link
                        href="/marketplace"
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-heading font-bold text-terracotta">My Listings</h1>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {items?.map((item) => (
                        <MyListingCard key={item.id} item={item} />
                    ))}
                    {(!items || items.length === 0) && (
                        <div className="col-span-2 text-center py-10 text-muted-foreground rounded-2xl border border-dashed border-terracotta/20">
                            <p>You haven't listed any items yet.</p>
                            <Link
                                href="/marketplace/sell"
                                className="inline-block mt-4 px-4 py-2 bg-terracotta text-white rounded-full font-bold text-sm hover:bg-terracotta/90 transition-colors"
                            >
                                List an Item
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
