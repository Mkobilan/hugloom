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
          // Increase Max-Age for better persistence
          const cookieOptions = {
            ...options,
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
          }

          request.cookies.set({
            name,
            value,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
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
            maxAge: 0,
          })
        },
      },
    }
  )

  // This will refresh the session if it's expired
  const { data: { session } } = await supabase.auth.getSession()

  // If user is not authenticated and not on public pages, redirect to login
  if (!session &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/auth/callback') &&
    !request.nextUrl.pathname.startsWith('/auth/forgot-password') &&
    !request.nextUrl.pathname.startsWith('/auth/reset-password') &&
    !request.nextUrl.pathname.startsWith('/post/') &&
    !request.nextUrl.pathname.startsWith('/u/') &&
    !request.nextUrl.pathname.startsWith('/api/') &&
    !request.nextUrl.pathname.startsWith('/sitemap.xml') &&
    !request.nextUrl.pathname.startsWith('/robots.txt') &&
    request.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is authenticated and tries to access login/signup, redirect to home
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