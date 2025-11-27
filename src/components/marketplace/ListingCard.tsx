import Link from 'next/link'
import { MapPin, ShoppingBag } from 'lucide-react'

interface ListingCardProps {
    item: {
        id: string
        title: string
        price: number
        image_urls: string[] | null
        location: string | null
        condition: string | null
    }
}

export function ListingCard({ item }: ListingCardProps) {
    return (
        <Link href={`/marketplace/${item.id}`} className="block h-full">
            <div className="bg-white/5 p-3 rounded-2xl shadow-sm border border-terracotta/10 flex flex-col h-full hover:bg-white/10 transition-colors">
                <div className="aspect-square bg-black/20 rounded-xl mb-3 flex items-center justify-center text-muted-foreground/30 overflow-hidden relative">
                    {item.image_urls?.[0] ? (
                        <img
                            src={item.image_urls[0]}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <ShoppingBag className="w-12 h-12 text-white/20" />
                    )}
                    {item.condition && (
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                            {item.condition}
                        </div>
                    )}
                </div>
                <h3 className="font-bold text-white text-sm line-clamp-2 mb-1">{item.title}</h3>
                <p className="text-terracotta font-bold text-lg mb-2">${item.price}</p>
                <div className="mt-auto flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{item.location || 'Local'}</span>
                </div>
            </div>
        </Link>
    )
}
