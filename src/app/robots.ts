import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/settings/', '/profile/'],
        },
        sitemap: 'https://hugloom.vercel.app/sitemap.xml',
    }
}
