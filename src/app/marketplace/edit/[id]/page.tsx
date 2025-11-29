import { AppLayout } from '@/components/layout/AppLayout'
import { ListingForm } from '@/components/marketplace/ListingForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface EditListingPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditListingPage({ params }: EditListingPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: listing } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('id', id)
        .single()

    if (!listing) redirect('/marketplace')
    if (listing.seller_id !== user.id) redirect('/marketplace')

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Link
                        href="/marketplace/my-listings"
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-heading font-bold text-terracotta">Edit Listing</h1>
                </div>

                <div className="p-6 rounded-2xl border border-terracotta/10 bg-transparent">
                    <ListingForm initialData={listing} />
                </div>
            </div>
        </AppLayout>
    )
}
