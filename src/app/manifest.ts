import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'HugLoom - Caregiver Support App',
        short_name: 'HugLoom',
        description: 'The supportive community for caregivers. Manage care, track meds, and connect with others.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#e11d48',
        icons: [
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
