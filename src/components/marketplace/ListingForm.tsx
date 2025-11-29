'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2 } from 'lucide-react'
import { createListing, updateListing } from '@/app/marketplace/actions'

const CONDITIONS = ['New', 'Like New', 'Used - Good', 'Used - Fair']
const DELIVERY_OPTIONS = [
    { id: 'public_meetup', label: 'Public Meetup' },
    { id: 'door_drop_off', label: 'Door Drop-off' },
    { id: 'shipping', label: 'Shipping' },
]

interface ListingFormProps {
    initialData?: {
        id: string
        title: string
        description: string
        price: number
        condition: string
        location: string | null
        delivery_options: string[] | null
        image_urls: string[] | null
    }
}

export function ListingForm({ initialData }: ListingFormProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [images, setImages] = useState<File[]>([])
    // Initialize previews from initialData images or empty array
    const [previews, setPreviews] = useState<string[]>(initialData?.image_urls || [])
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
        // If removing an existing image (from initialData), we need to handle it differently
        // But for simplicity, we'll just remove it from previews and not include it in the final submission
        // Note: This logic assumes new images are appended to the end. 
        // A more robust approach would be to track existing vs new images separately.

        // Current simple approach:
        // If index < initialData.image_urls.length (and we haven't removed any before), it's an existing image.
        // But since we mix them in previews, let's just rely on previews for display 
        // and reconstruct the final list.

        // Actually, we need to know which are existing URLs and which are new Files.
        // Let's split the logic in handleSubmit.
        // For now, just update previews and images state.

        // If we remove an image that was a File:
        // We need to find which File it corresponds to.
        // This is tricky with a single array if we mix types.

        // Let's refine: 
        // previews contains ALL images (existing URLs + new File blobs).
        // images contains ONLY new Files.

        // If we remove an image at index `i`:
        // If `i` < (previews.length - images.length), it's an existing image.
        // If `i` >= (previews.length - images.length), it's a new image.

        const numExisting = previews.length - images.length

        if (index < numExisting) {
            // Removing an existing image
            const newPreviews = [...previews]
            newPreviews.splice(index, 1)
            setPreviews(newPreviews)
        } else {
            // Removing a new image
            const newImageIndex = index - numExisting

            const newImages = [...images]
            newImages.splice(newImageIndex, 1)
            setImages(newImages)

            const newPreviews = [...previews]
            URL.revokeObjectURL(newPreviews[index])
            newPreviews.splice(index, 1)
            setPreviews(newPreviews)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            const formData = new FormData(e.currentTarget)
            const supabase = createClient()

            // Upload new images
            const newImageUrls: string[] = []
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

                newImageUrls.push(publicUrl)
            }

            // Combine existing images (that weren't removed) with new images
            // We can filter `previews` to find strings that are not blob: URLs (meaning they are existing Supabase URLs)
            const existingImageUrls = previews.filter(url => !url.startsWith('blob:'))
            const finalImageUrls = [...existingImageUrls, ...newImageUrls]

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
                image_urls: finalImageUrls
            }

            if (initialData) {
                await updateListing(initialData.id, listingData)
                router.push('/marketplace/my-listings') // Redirect to my listings after edit
            } else {
                await createListing(listingData)
                router.push('/marketplace')
            }

            router.refresh()

        } catch (err) {
            console.error(err)
            setError(initialData ? 'Failed to update listing.' : 'Failed to create listing. Please try again.')
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
                    defaultValue={initialData?.title}
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
                    defaultValue={initialData?.price}
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
                    defaultValue={initialData?.condition}
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
                    defaultValue={initialData?.description}
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
                    defaultValue={initialData?.location || ''}
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
                                defaultChecked={initialData?.delivery_options?.includes(opt.id)}
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
                        {initialData ? 'Updating...' : 'Creating Listing...'}
                    </>
                ) : (
                    initialData ? 'Update Listing' : 'Post Listing'
                )}
            </button>
        </form>
    )
}
