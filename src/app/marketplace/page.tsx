import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { MarketplaceSearch } from '@/components/marketplace/MarketplaceSearch'
import { ListingCard } from '@/components/marketplace/ListingCard'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function MarketplacePage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; location?: string }>
}) {
    const supabase = await createClient()
    const { q, location } = await searchParams

    let query = supabase
        .from('marketplace_items')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })

    if (q) {
        query = query.ilike('title', `%${q}%`)
    }

    if (location) {
        query = query.ilike('location', `%${location}%`)
    }

    const { data: items } = await query

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <div className="bg-mustard/10 p-4 rounded-xl mb-6 border border-mustard/20">
                    <p className="text-xs text-mustard font-bold text-center">
                        ⚠️ ElderCare Connect is not liable for transactions. Verify condition/seller; consult pros for medical fit.
                    </p>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-heading font-bold text-terracotta">Marketplace</h1>
                    <div className="flex gap-2">
                        <Link
                            href="/marketplace/my-listings"
                            className="px-4 py-2 bg-sky-600 text-white rounded-full font-bold text-sm shadow-md hover:bg-sky-700 transition-colors"
                        >
                            My Listings
                        </Link>
                        <Link
                            href="/marketplace/sell"
                            className="px-4 py-2 bg-terracotta text-white rounded-full font-bold text-sm shadow-md hover:bg-terracotta/90 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Sell Item
                        </Link>
                    </div>
                </div>

                <MarketplaceSearch />

                <div className="grid grid-cols-2 gap-4">
                    {items?.map((item) => (
                        <ListingCard key={item.id} item={item} />
                    ))}
                    {(!items || items.length === 0) && (
                        <div className="col-span-2 text-center py-10 text-muted-foreground rounded-2xl border border-dashed border-terracotta/20">
                            <p>No items found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
