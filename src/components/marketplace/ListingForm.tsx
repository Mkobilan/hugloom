'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2 } from 'lucide-react'
import { createListing } from '@/app/marketplace/actions'

const CONDITIONS = ['New', 'Like New', 'Used - Good', 'Used - Fair']
const DELIVERY_OPTIONS = [
    { id: 'public_meetup', label: 'Public Meetup' },
    { id: 'door_drop_off', label: 'Door Drop-off' },
    { id: 'shipping', label: 'Shipping' },
]

export function ListingForm() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [images, setImages] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            if (images.length + newFiles.length > 7) {
                alert('Maximum 7 images allowed')
                return
            }

            setImages([...images, ...newFiles])

            const newPreviews = newFiles.map(file => URL.createObjectURL(file))
            setPreviews([...previews, ...newPreviews])
        }
    }

    const removeImage = (index: number) => {
        const newImages = [...images]
        newImages.splice(index, 1)
        setImages(newImages)

        const newPreviews = [...previews]
        URL.revokeObjectURL(newPreviews[index])
        newPreviews.splice(index, 1)
        setPreviews(newPreviews)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            const formData = new FormData(e.currentTarget)
            const supabase = createClient()

            // Upload images
            const imageUrls: string[] = []
            for (const file of images) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const { data, error: uploadError } = await supabase.storage
                    .from('marketplace-images')
                    .upload(fileName, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('marketplace-images')
                    .getPublicUrl(fileName)

                imageUrls.push(publicUrl)
            }

            // Prepare data for server action
            const listingData = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                price: parseFloat(formData.get('price') as string),
                condition: formData.get('condition') as string,
                location: formData.get('location') as string,
                delivery_options: DELIVERY_OPTIONS
                    .filter(opt => formData.get(opt.id) === 'on')
                    .map(opt => opt.id),
                image_urls: imageUrls
            }

            await createListing(listingData)
            router.push('/marketplace')
            router.refresh()

        } catch (err) {
            console.error(err)
            setError('Failed to create listing. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Image Upload */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-white">Photos (Max 7)</label>
                <div className="grid grid-cols-4 gap-2">
                    {previews.map((src, i) => (
                        <div key={i} className="aspect-square relative rounded-xl overflow-hidden group">
                            <img src={src} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {images.length < 7 && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-terracotta/20 flex flex-col items-center justify-center text-terracotta hover:bg-terracotta/5 transition-colors bg-white/5"
                        >
                            <Upload className="w-6 h-6 mb-1" />
                            <span className="text-xs font-bold">Add Photo</span>
                        </button>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    multiple
                    className="hidden"
                />
            </div>

            {/* Title */}
            <div>
                <label htmlFor="title" className="block text-sm font-bold text-white mb-1">Title</label>
                <input
                    type="text"
                    name="title"
                    required
                    placeholder="What are you selling?"
                    className="w-full px-4 py-2 rounded-xl border-none bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                />
            </div>

            {/* Price */}
            <div>
                <label htmlFor="price" className="block text-sm font-bold text-white mb-1">Price ($)</label>
                <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-2 rounded-xl border-none bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                />
            </div>

            {/* Condition */}
            <div>
                <label htmlFor="condition" className="block text-sm font-bold text-white mb-1">Condition</label>
                <select
                    name="condition"
                    required
                    className="w-full px-4 py-2 rounded-xl border-none bg-white text-black focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                >
                    <option value="">Select condition</option>
                    {CONDITIONS.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            {/* Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-bold text-white mb-1">Description</label>
                <textarea
                    name="description"
                    rows={4}
                    placeholder="Describe your item..."
                    className="w-full px-4 py-2 rounded-xl border-none bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20 resize-none"
                />
            </div>

            {/* Location */}
            <div>
                <label htmlFor="location" className="block text-sm font-bold text-white mb-1">Location</label>
                <input
                    type="text"
                    name="location"
                    required
                    placeholder="City, State, or Zip"
                    className="w-full px-4 py-2 rounded-xl border-none bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                />
            </div>

            {/* Delivery Options */}
            <div>
                <label className="block text-sm font-bold text-white mb-2">Delivery Options</label>
                <div className="space-y-2">
                    {DELIVERY_OPTIONS.map(opt => (
                        <label key={opt.id} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name={opt.id}
                                className="rounded border-gray-300 text-terracotta focus:ring-terracotta"
                            />
                            <span className="text-sm text-white">{opt.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-terracotta text-white py-3 rounded-xl font-bold hover:bg-terracotta/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating Listing...
                    </>
                ) : (
                    'Post Listing'
                )}
            </button>
        </form>
    )
}
