'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import NotificationPanel from './NotificationPanel'

type Product = 'booking' | 'trading'

const products: { key: Product; label: string; href: string; icon: React.ReactNode }[] = [
  {
    key: 'booking',
    label: 'Room Booking',
    href: '/map',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    key: 'trading',
    label: 'Course Trading',
    href: '/trading',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
]

export default function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [pendingMatchCount, setPendingMatchCount] = useState(0)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/trading/matches')
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (cancelled) return
        const pending = (data.matches || []).filter(
          (m: { status: string }) => m.status === 'PENDING'
        ).length
        setPendingMatchCount(pending)
      } catch {
        // Silently fail
      }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [session])

  const isTrading = pathname.startsWith('/trading')
  const isBooking = pathname.startsWith('/map') || pathname.startsWith('/bookings') || pathname.startsWith('/room') || pathname.startsWith('/reports') || pathname.startsWith('/admin')
  const hasExplicitProduct = isTrading || isBooking

  // Remember last active product so shared pages (profile, etc.) can restore it
  useEffect(() => {
    if (hasExplicitProduct) {
      sessionStorage.setItem('lastProduct', isTrading ? 'trading' : 'booking')
    }
  }, [hasExplicitProduct, isTrading])

  const currentProduct: Product = hasExplicitProduct
    ? (isTrading ? 'trading' : 'booking')
    : ((typeof window !== 'undefined' && sessionStorage.getItem('lastProduct')) as Product) || 'booking'
  const currentLabel = products.find((p) => p.key === currentProduct)!.label

  const isActive = (path: string) => {
    if (path === '/trading') return pathname === '/trading'
    return pathname.startsWith(path)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isAdmin = session?.user.role === 'ADMIN'

  const bookingNav = isAdmin ? (
    <Link
      href="/admin"
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        isActive('/admin') ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      <span className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Admin
      </span>
    </Link>
  ) : (
    <>
      <Link
        href="/map"
        data-tour="nav-book"
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive('/map') ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Book
        </span>
      </Link>
      <Link
        href="/bookings"
        data-tour="nav-my-bookings"
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive('/bookings') ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          My Bookings
        </span>
      </Link>
      <Link
        href="/reports"
        data-tour="nav-my-reports"
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive('/reports') ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          My Reports
        </span>
      </Link>
    </>
  )

  const isTradingBrowse = isActive('/trading') && !isActive('/trading/my-listings') && !isActive('/trading/matches') && !isActive('/trading/admin')

  const tradingNav = isAdmin ? (
    <>
      <Link
        href="/trading/admin"
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive('/trading/admin') && !isActive('/trading/admin/courses') ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Admin
        </span>
      </Link>
      <Link
        href="/trading/admin/courses"
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive('/trading/admin/courses') ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Courses
        </span>
      </Link>
    </>
  ) : (
    <>
      <Link
        href="/trading"
        data-tour="nav-browse"
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isTradingBrowse
            ? 'bg-red-50 text-red-800'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Browse
        </span>
      </Link>
      <Link
        href="/trading/my-listings"
        data-tour="nav-my-listings"
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive('/trading/my-listings') ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          My Listings
        </span>
      </Link>
      <Link
        href="/trading/matches"
        data-tour="nav-my-matches"
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive('/trading/matches') ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          My Matches
          {pendingMatchCount > 0 && (
            <span className="ml-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold px-1">
              {pendingMatchCount}
            </span>
          )}
        </span>
      </Link>
    </>
  )

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-red-700 via-red-500 to-cyan-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo, product switcher, and nav */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-700 to-red-800 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <span className="text-lg font-bold text-slate-800 tracking-tight">Smart School</span>
                </div>
              </Link>

              {/* Product switcher pill */}
              {session && (
                <>
                  <div className="hidden sm:block w-px h-6 bg-slate-200" />
                  <div className="relative" ref={dropdownRef}>
                    <button
                      data-tour="product-switcher"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className={`flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        dropdownOpen
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {currentLabel}
                      <svg
                        className={`w-3.5 h-3.5 opacity-50 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {dropdownOpen && (
                      <div className="absolute top-full left-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
                        {products.map((p) => (
                          <Link
                            key={p.key}
                            href={isAdmin ? (p.key === 'booking' ? '/admin' : '/trading/admin') : p.href}
                            onClick={() => setDropdownOpen(false)}
                            className={`flex items-center gap-3 mx-1.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                              p.key === currentProduct
                                ? 'bg-red-50 text-red-800 font-medium'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <span className={`flex-shrink-0 ${p.key === currentProduct ? 'text-red-600' : 'text-slate-400'}`}>
                              {p.icon}
                            </span>
                            {p.label}
                            {p.key === currentProduct && (
                              <svg className="w-4 h-4 ml-auto text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Static brand for unauthenticated */}
              {!session && (
                <Link href="/" className="hidden sm:block hover:opacity-80 transition-opacity">
                  <span className="text-lg font-bold text-slate-800 tracking-tight">Smart School</span>
                </Link>
              )}
            </div>

            {/* Navigation */}
            {session && (
              <nav className="hidden md:flex items-center gap-1">
                {currentProduct === 'booking' ? bookingNav : tradingNav}
              </nav>
            )}
          </div>

          {/* User section */}
          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
            ) : session ? (
              <div className="flex items-center gap-4">
                <NotificationPanel />
                <Link href="/profile" className="hidden sm:flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800">
                      {session.user.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {session.user.role === 'ADMIN' ? 'Administrator' : 'Student'}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-all"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-700 to-red-800 rounded-lg hover:from-red-800 hover:to-red-900 shadow-sm hover:shadow-md transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
