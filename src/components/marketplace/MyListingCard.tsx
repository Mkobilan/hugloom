'use client'

import Link from 'next/link'
import { MapPin, ShoppingBag, Trash2, Edit2 } from 'lucide-react'
import { useState } from 'react'
import { deleteListing } from '@/app/marketplace/actions'
import { useRouter } from 'next/navigation'

export interface MyListingCardProps {
    item: {
        id: string
        title: string
        price: number
        image_urls: string[] | null
        location: string | null
        condition: string | null
        status: string
    }
}

export function MyListingCard({ item }: MyListingCardProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this listing?')) return

        setIsDeleting(true)
        try {
            await deleteListing(item.id)
            router.refresh()
        } catch (error) {
            console.error('Failed to delete listing:', error)
            alert('Failed to delete listing. Please try again.')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="bg-white/5 p-3 rounded-2xl shadow-sm border border-terracotta/10 flex flex-col h-full">
            <Link href={`/marketplace/${item.id}`} className="block">
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
                    {item.status !== 'available' && (
                        <div className="absolute top-2 left-2 bg-mustard text-black text-[10px] px-2 py-1 rounded-full font-bold">
                            {item.status.toUpperCase()}
                        </div>
                    )}
                </div>
                <h3 className="font-bold text-white text-sm line-clamp-2 mb-1">{item.title}</h3>
                <p className="text-terracotta font-bold text-lg mb-2">${Number(item.price).toFixed(2)}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{item.location || 'Local'}</span>
                </div>
            </Link>

            <div className="mt-auto grid grid-cols-2 gap-2">
                <Link
                    href={`/marketplace/edit/${item.id}`}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-colors"
                >
                    <Edit2 className="w-4 h-4" />
                    Edit
                </Link>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? '...' : 'Delete'}
                </button>
            </div>
        </div>
    )
}
