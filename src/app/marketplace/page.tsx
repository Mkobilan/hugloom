import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { ShoppingBag, Tag, MapPin } from 'lucide-react'

export default async function MarketplacePage() {
    const supabase = await createClient()
    const { data: items } = await supabase.from('marketplace_items').select('*')

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
                    <button className="px-4 py-2 bg-terracotta text-white rounded-full font-bold text-sm shadow-md hover:bg-terracotta/90 transition-colors">
                        Sell Item
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {items?.map((item) => (
                        <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-terracotta/10 flex flex-col h-full">
                            <div className="aspect-square bg-cream rounded-xl mb-3 flex items-center justify-center text-muted-foreground/30">
                                {item.image_urls?.[0] ? (
                                    <img src={item.image_urls[0]} alt={item.title} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <ShoppingBag className="w-12 h-12" />
                                )}
                            </div>
                            <h3 className="font-bold text-foreground text-sm line-clamp-2 mb-1">{item.title}</h3>
                            <p className="text-terracotta font-bold text-lg mb-2">${item.price}</p>
                            <div className="mt-auto flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span>{item.location || 'Local'}</span>
                            </div>
                        </div>
                    ))}
                    {(!items || items.length === 0) && (
                        <div className="col-span-2 text-center py-10 text-muted-foreground bg-white rounded-2xl border border-dashed border-terracotta/20">
                            <p>No items listed yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
