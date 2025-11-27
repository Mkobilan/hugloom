import { AppLayout } from '@/components/layout/AppLayout'
import { ListingForm } from '@/components/marketplace/ListingForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SellItemPage() {
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
                    <h1 className="text-2xl font-heading font-bold text-terracotta">Sell an Item</h1>
                </div>

                <div className="p-6 rounded-2xl border border-terracotta/10 bg-transparent">
                    <ListingForm />
                </div>
            </div>
        </AppLayout>
    )
}
