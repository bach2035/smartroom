'use client'

import Link from 'next/link'
import type { TradeListing } from '@/types'
import CourseTag from './CourseTag'
import TradeStatusBadge from './TradeStatusBadge'

interface ListingCardProps {
  listing: TradeListing
  showStatus?: boolean
}

export default function ListingCard({ listing, showStatus }: ListingCardProps) {
  return (
    <Link href={`/trading/${listing.id}`} className="block">
      <div className="card card-hover p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-medium text-slate-800">
              {listing.userName || 'Anonymous'}
            </p>
            <p className="text-xs text-slate-500">
              {new Date(listing.createdAt).toLocaleDateString()}
            </p>
          </div>
          {showStatus && <TradeStatusBadge status={listing.status} />}
        </div>

        {listing.haveCourses.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-medium text-slate-500 mb-1">HAS</p>
            <div className="flex flex-wrap gap-1.5">
              {listing.haveCourses.map((c) => (
                <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="HAVE" />
              ))}
            </div>
          </div>
        )}

        {listing.wantCourses.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-medium text-slate-500 mb-1">WANTS</p>
            <div className="flex flex-wrap gap-1.5">
              {listing.wantCourses.map((c) => (
                <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="WANT" />
              ))}
            </div>
          </div>
        )}

        {listing.notes && (
          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{listing.notes}</p>
        )}
      </div>
    </Link>
  )
}
