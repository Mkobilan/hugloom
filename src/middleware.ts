// src/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  // If user is not authenticated and not on login/signup pages, redirect to signup
  // EXCEPT for public routes like post pages, user profiles, and password reset pages
  if (!session &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/auth/callback') &&
    !request.nextUrl.pathname.startsWith('/auth/forgot-password') &&
    !request.nextUrl.pathname.startsWith('/auth/reset-password') &&
    !request.nextUrl.pathname.startsWith('/post/') &&
    !request.nextUrl.pathname.startsWith('/u/') &&
    !request.nextUrl.pathname.startsWith('/api/') && // Exclude API routes (including webhooks)
    !request.nextUrl.pathname.startsWith('/sitemap.xml') &&
    !request.nextUrl.pathname.startsWith('/robots.txt')) {
    return NextResponse.redirect(new URL('/signup', request.url))
  }

  // If user is authenticated and tries to access login/signup, redirect to dashboard
  if (session &&
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    // Exclude Service Worker, manifest, and static assets from middleware
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|api/auth/).*)',
  ],
}