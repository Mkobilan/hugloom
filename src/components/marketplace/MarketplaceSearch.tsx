'use client'

import { Search, MapPin } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

export function MarketplaceSearch() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const [keyword, setKeyword] = useState(searchParams.get('q') || '')
    const [location, setLocation] = useState(searchParams.get('location') || '')

    const handleSearch = () => {
        startTransition(() => {
            const params = new URLSearchParams()
            if (keyword) params.set('q', keyword)
            if (location) params.set('location', location)
            router.push(`/marketplace?${params.toString()}`)
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    return (
        <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search items (e.g. walker, wheelchair)..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border-none bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="City, State, or Zip..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border-none bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={isPending}
                    className="bg-terracotta text-white px-6 py-2 rounded-xl font-bold hover:bg-terracotta/90 transition-colors disabled:opacity-50"
                >
                    {isPending ? 'Searching...' : 'Search'}
                </button>
            </div>
        </div>
    )
}
