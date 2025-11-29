'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CreateListingData {
    title: string
    description: string
    price: number
    condition: string
    location: string
    delivery_options: string[]
    image_urls: string[]
}

export async function createListing(data: CreateListingData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase.from('marketplace_items').insert({
        seller_id: user.id,
        title: data.title,
        description: data.description,
        price: data.price,
        condition: data.condition,
        location: data.location,
        delivery_options: data.delivery_options,
        image_urls: data.image_urls,
        status: 'available'
    })

    if (error) {
        console.error('Error creating listing:', error)
        throw error
    }

    revalidatePath('/marketplace')
}

export async function deleteListing(listingId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // First, get the listing to find associated images
    const { data: listing } = await supabase
        .from('marketplace_items')
        .select('image_urls, seller_id')
        .eq('id', listingId)
        .single()

    if (!listing) throw new Error('Listing not found')
    if (listing.seller_id !== user.id) throw new Error('Unauthorized')

    // Delete images from storage
    if (listing.image_urls && listing.image_urls.length > 0) {
        const filePaths = listing.image_urls.map((url: string) => {
            const urlParts = url.split('/')
            return urlParts[urlParts.length - 1]
        })

        await supabase.storage
            .from('marketplace-images')
            .remove(filePaths)
    }

    // Delete the listing
    const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', listingId)

    if (error) {
        console.error('Error deleting listing:', error)
        throw error
    }

    revalidatePath('/marketplace/my-listings')
}

export async function updateListing(listingId: string, data: CreateListingData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify ownership
    const { data: listing } = await supabase
        .from('marketplace_items')
        .select('seller_id')
        .eq('id', listingId)
        .single()

    if (!listing) throw new Error('Listing not found')
    if (listing.seller_id !== user.id) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('marketplace_items')
        .update({
            title: data.title,
            description: data.description,
            price: data.price,
            condition: data.condition,
            location: data.location,
            delivery_options: data.delivery_options,
            image_urls: data.image_urls,
        })
        .eq('id', listingId)

    if (error) {
        console.error('Error updating listing:', error)
        throw error
    }

    revalidatePath('/marketplace')
    revalidatePath('/marketplace/my-listings')
    revalidatePath(`/marketplace/${listingId}`)
}
