import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Admin routes protection
    if (pathname.startsWith('/admin') || pathname.startsWith('/trading/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/map', req.url))
      }
    }

    // Admins cannot access student interfaces — redirect to admin panels
    if (token?.role === 'ADMIN') {
      if (pathname.startsWith('/map') || pathname.startsWith('/room') || pathname.startsWith('/bookings') || pathname.startsWith('/reports')) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      if (pathname.startsWith('/trading') && !pathname.startsWith('/trading/admin')) {
        return NextResponse.redirect(new URL('/trading/admin', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // Public routes
        if (
          pathname === '/' ||
          pathname.startsWith('/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/api/auth')
        ) {
          return true
        }

        // Protected routes require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|maps|.*\\.svg).*)',
  ],
}
