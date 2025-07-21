import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { languages, fallbackLng, cookieName } from '@/app/i18n/settings'

export function middleware(request: NextRequest) {
  // Check if there is any supported locale in the pathname
  const pathname = request.nextUrl.pathname
  const pathnameHasLocale = languages.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return

  // Get language from cookie or accept-language header
  let lng = request.cookies.get(cookieName)?.value

  if (!lng) {
    // Parse Accept-Language header
    const acceptLang = request.headers.get('accept-language') || ''
    const detected = acceptLang
      .split(',')
      .map((lang) => {
        const [code] = lang.trim().split('-')
        return code.toLowerCase()
      })
      .find((code) => languages.includes(code))

    lng = detected || fallbackLng
  }

  // Always set/update the cookie to ensure consistency
  const response = NextResponse.next()
  
  // Set the language cookie
  response.cookies.set(cookieName, lng, {
    path: '/',
    sameSite: 'lax',
    httpOnly: false, // Allow client-side access
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api|favicon.ico).*)',
  ],
}