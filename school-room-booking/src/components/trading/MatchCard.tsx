'use client'

import Link from 'next/link'
import type { TradeMatch } from '@/types'
import TradeStatusBadge from './TradeStatusBadge'
import { relativeTime } from '@/lib/utils'

export default function MatchCard({ match }: { match: TradeMatch }) {
  const otherCourses = match.otherListing
  const haveSummary = otherCourses?.haveCourses?.map((c) => `${c.courseCode} - ${c.courseName}`).join(', ') || '-'
  const wantSummary = otherCourses?.wantCourses?.map((c) => `${c.courseCode} - ${c.courseName}`).join(', ') || '-'

  return (
    <Link href={`/trading/matches/${match.id}`} className="block">
      <div className="flex items-center gap-4 px-4 py-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-colors">
        <div className="w-32 shrink-0">
          <p className="font-medium text-slate-800 text-sm truncate">{match.otherUserName || 'Unknown'}</p>
          <p className="text-xs text-slate-400">{relativeTime(match.createdAt)}</p>
        </div>
        <div className="flex-1 min-w-0 text-sm space-y-0.5">
          <p className="truncate">
            <span className="text-xs font-medium text-slate-400 mr-1.5">HAS</span>
            <span className="text-green-700">{haveSummary}</span>
          </p>
          <p className="truncate">
            <span className="text-xs font-medium text-slate-400 mr-1.5">WANTS</span>
            <span className="text-blue-700">{wantSummary}</span>
          </p>
        </div>
        <div className="shrink-0">
          <TradeStatusBadge status={match.status} />
        </div>
        <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
