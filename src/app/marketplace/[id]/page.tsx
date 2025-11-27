import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'
import { ArrowLeft, MapPin, Truck, User } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ListingDetailsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const supabase = await createClient()
    const { id } = await params

    const { data: item } = await supabase
        .from('marketplace_items')
        .select(`
            *,
            seller:profiles(*)
        `)
        .eq('id', id)
        .single()

    if (!item) notFound()

    const deliveryOptions = item.delivery_options as string[] || []

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
                    <h1 className="text-xl font-bold truncate flex-1">{item.title}</h1>
                </div>

                <div className="space-y-6">
                    {/* Image Gallery */}
                    <div className="bg-white/5 p-4 rounded-2xl shadow-sm border border-terracotta/10">
                        <div className="aspect-square bg-black/20 rounded-xl overflow-hidden mb-4">
                            {item.image_urls?.[0] && (
                                <img
                                    src={item.image_urls[0]}
                                    alt={item.title}
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </div>
                        {item.image_urls && item.image_urls.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                                {item.image_urls.map((url: string, i: number) => (
                                    <div key={i} className="aspect-square rounded-lg overflow-hidden border border-terracotta/10">
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="bg-white/5 p-6 rounded-2xl shadow-sm border border-terracotta/10 space-y-6">
                        <div>
                            <p className="text-3xl font-bold text-terracotta mb-2">${item.price}</p>
                            <h2 className="text-xl font-bold text-white mb-4">{item.title}</h2>

                            <div className="flex flex-wrap gap-3 mb-6">
                                {item.condition && (
                                    <span className="px-3 py-1 bg-white/10 text-terracotta rounded-full text-sm font-bold">
                                        {item.condition}
                                    </span>
                                )}
                                <div className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300">
                                    <MapPin className="w-4 h-4" />
                                    <span>{item.location || 'Local'}</span>
                                </div>
                            </div>

                            <div className="prose prose-sm max-w-none text-gray-300">
                                <p className="whitespace-pre-wrap">{item.description}</p>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-6">
                            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                <Truck className="w-5 h-5 text-terracotta" />
                                Delivery Options
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {deliveryOptions.map((opt) => (
                                    <span key={opt} className="px-3 py-1 border border-terracotta/20 text-terracotta rounded-full text-sm capitalize">
                                        {opt.replace(/_/g, ' ')}
                                    </span>
                                ))}
                                {deliveryOptions.length === 0 && (
                                    <span className="text-gray-400 text-sm">Contact seller for details</span>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-6">
                            <h3 className="font-bold text-white mb-3">Seller Info</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden">
                                    {item.seller?.avatar_url ? (
                                        <img src={item.seller.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-terracotta/10 text-terracotta">
                                            <User className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-white">{item.seller?.full_name || 'Anonymous'}</p>
                                    <p className="text-sm text-gray-400">@{item.seller?.username}</p>
                                </div>
                                <Link
                                    href={`/messages/chat/${item.seller_id}`}
                                    className="ml-auto px-4 py-2 bg-terracotta text-white rounded-full font-bold text-sm hover:bg-terracotta/90 transition-colors"
                                >
                                    Message
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
