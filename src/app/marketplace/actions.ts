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
