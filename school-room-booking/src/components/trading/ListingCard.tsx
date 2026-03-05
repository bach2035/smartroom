'use client'

import Link from 'next/link'
import type { TradeListing } from '@/types'
import TradeStatusBadge from './TradeStatusBadge'
import { relativeTime } from '@/lib/utils'

interface ListingCardProps {
  listing: TradeListing
  showStatus?: boolean
  onClick?: () => void
}

function courseSummary(courses: TradeListing['haveCourses']) {
  return courses.map((c) => {
    let label = `${c.courseCode} - ${c.courseName}`
    if (c.classCode) label += ` [${c.classCode}]`
    return label
  }).join(', ')
}

export default function ListingCard({ listing, showStatus, onClick }: ListingCardProps) {
  const have = courseSummary(listing.haveCourses)
  const want = courseSummary(listing.wantCourses)

  const content = (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-colors">
      {/* User + time */}
      <div className="w-32 shrink-0">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-slate-800 text-sm truncate">{listing.userName || 'Anonymous'}</p>
          {listing.listingType === 'GIVEAWAY' && (
            <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-700">FREE</span>
          )}
        </div>
        <p className="text-xs text-slate-400">{relativeTime(listing.createdAt)}</p>
      </div>

      {/* Courses */}
      <div className="flex-1 min-w-0 text-sm space-y-0.5">
        {have && (
          <p className="truncate">
            <span className="text-xs font-medium text-slate-400 mr-1.5">{listing.listingType === 'GIVEAWAY' ? 'GIVING' : 'HAS'}</span>
            <span className={listing.listingType === 'GIVEAWAY' ? 'text-emerald-700' : 'text-green-700'}>{have}</span>
          </p>
        )}
        {want && listing.listingType !== 'GIVEAWAY' && (
          <p className="truncate">
            <span className="text-xs font-medium text-slate-400 mr-1.5">WANTS</span>
            <span className="text-blue-700">{want}</span>
          </p>
        )}
        {listing.notes && (
          <p className="text-xs text-slate-400 truncate">{listing.notes}</p>
        )}
      </div>

      {/* Status badge */}
      {showStatus && (
        <div className="shrink-0">
          <TradeStatusBadge status={listing.status} />
        </div>
      )}

      {/* Chevron */}
      <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  )

  if (onClick) {
    return <button onClick={onClick} className="block w-full text-left">{content}</button>
  }

  return <Link href={`/trading/${listing.id}`} className="block">{content}</Link>
}
