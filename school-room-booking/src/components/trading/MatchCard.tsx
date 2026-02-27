'use client'

import Link from 'next/link'
import type { TradeMatch } from '@/types'
import TradeStatusBadge from './TradeStatusBadge'

export default function MatchCard({ match }: { match: TradeMatch }) {
  const otherCourses = match.otherListing
  const haveSummary = otherCourses?.haveCourses?.map((c) => c.courseCode).join(', ') || '-'
  const wantSummary = otherCourses?.wantCourses?.map((c) => c.courseCode).join(', ') || '-'

  return (
    <Link href={`/trading/matches/${match.id}`} className="block">
      <div className="card card-hover p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-medium text-slate-800">{match.otherUserName || 'Unknown'}</p>
            <p className="text-xs text-slate-500">
              {new Date(match.createdAt).toLocaleDateString()}
            </p>
          </div>
          <TradeStatusBadge status={match.status} />
        </div>
        <div className="text-sm text-slate-600 space-y-1">
          <p><span className="text-green-700 font-medium">They have:</span> {haveSummary}</p>
          <p><span className="text-blue-700 font-medium">They want:</span> {wantSummary}</p>
        </div>
      </div>
    </Link>
  )
}
