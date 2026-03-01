'use client'

import { useState, useEffect } from 'react'
import CourseTag from '@/components/trading/CourseTag'
import TradeStatusBadge from '@/components/trading/TradeStatusBadge'
import Modal from '@/components/ui/Modal'
import type { TradeMatchStatus } from '@/types'

interface MatchCourse {
  id: string
  courseName: string
  courseCode: string
  classCode?: string | null
  type: string
}

interface MatchSide {
  id: string
  status: string
  userName: string
  username: string
  userId: string
  haveCourses: MatchCourse[]
  wantCourses: MatchCourse[]
}

interface Match {
  id: string
  status: TradeMatchStatus
  initiatedBy: string
  createdAt: string
  updatedAt: string
  listingA: MatchSide | null
  listingB: MatchSide | null
}

interface MatchDetailCourse extends MatchCourse {
  classCode?: string | null
  section?: string | null
  schedule?: string | null
  credits?: number | null
}

interface MatchDetailSide {
  id: string
  status: string
  notes: string | null
  createdAt: string
  user: { id: string; fullName: string; username: string; email: string } | null
  haveCourses: MatchDetailCourse[]
  wantCourses: MatchDetailCourse[]
}

interface MatchDetail {
  id: string
  status: TradeMatchStatus
  initiatedBy: string
  createdAt: string
  updatedAt: string
  listingA: MatchDetailSide | null
  listingB: MatchDetailSide | null
  messages: { id: string; content: string; createdAt: string; senderName: string; senderUsername: string }[]
}

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'COMPLETED', label: 'Completed' },
]

export default function TradingMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedDetail, setSelectedDetail] = useState<MatchDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = filter !== 'all' ? `?status=${filter}` : ''
    fetch(`/api/admin/trading/matches${params}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setMatches(data))
      .catch(err => console.error('Error fetching matches:', err))
      .finally(() => setLoading(false))
  }, [filter])

  const openDetail = async (id: string) => {
    setDetailLoading(true)
    setSelectedDetail(null)
    try {
      const res = await fetch(`/api/admin/trading/matches/${id}`)
      if (res.ok) setSelectedDetail(await res.json())
    } catch (error) {
      console.error('Error fetching match detail:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === option.value
                ? 'bg-red-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Match list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <p>No matches found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <button
              key={match.id}
              onClick={() => openDetail(match.id)}
              className="w-full text-left bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="font-semibold text-slate-800">
                      {match.listingA?.userName || '?'}
                    </span>
                    <span className="text-slate-400">↔</span>
                    <span className="font-semibold text-slate-800">
                      {match.listingB?.userName || '?'}
                    </span>
                    <TradeStatusBadge status={match.status} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {match.listingA?.haveCourses.map(c => (
                      <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="HAVE" classCode={c.classCode} />
                    ))}
                    {match.listingA?.wantCourses.map(c => (
                      <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="WANT" classCode={c.classCode} />
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400">{formatDate(match.createdAt)}</span>
                  {match.initiatedBy === match.listingA?.userId && (
                    <p className="text-xs text-slate-400 mt-0.5">Initiated by {match.listingA.userName}</p>
                  )}
                  {match.initiatedBy === match.listingB?.userId && (
                    <p className="text-xs text-slate-400 mt-0.5">Initiated by {match.listingB.userName}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={detailLoading || !!selectedDetail}
        onClose={() => { if (!detailLoading) setSelectedDetail(null) }}
        title="Match Detail"
        size="xl"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : selectedDetail && (
          <div className="space-y-5">
            {/* Match metadata */}
            <div className="flex items-center gap-3 flex-wrap">
              <TradeStatusBadge status={selectedDetail.status} />
              <span className="text-sm text-slate-500">Created {formatDate(selectedDetail.createdAt)}</span>
              {selectedDetail.updatedAt !== selectedDetail.createdAt && (
                <span className="text-sm text-slate-400">· Updated {formatDate(selectedDetail.updatedAt)}</span>
              )}
            </div>

            {/* Side-by-side listings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ListingSide label="Listing A" listing={selectedDetail.listingA} />
              <ListingSide label="Listing B" listing={selectedDetail.listingB} />
            </div>

            {/* Chat history */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Chat History ({selectedDetail.messages.length} messages)
              </p>
              {selectedDetail.messages.length === 0 ? (
                <p className="text-sm text-slate-400 bg-slate-50 rounded-xl p-3">No messages exchanged.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 bg-slate-50 rounded-xl p-3">
                  {selectedDetail.messages.map(msg => (
                    <div key={msg.id} className="text-sm">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-slate-800">{msg.senderName}</span>
                        <span className="text-xs text-slate-400">{formatDateTime(msg.createdAt)}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function ListingSide({ label, listing }: { label: string; listing: MatchDetail['listingA'] }) {
  if (!listing) return <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-400">No data</div>
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{label}</p>
      <p className="font-medium text-slate-800">{listing.user?.fullName || 'Unknown'}</p>
      <p className="text-xs text-slate-400 mb-3">@{listing.user?.username} · {listing.user?.email}</p>
      <div className="space-y-2">
        <div>
          <p className="text-xs text-slate-500 mb-1">Has:</p>
          <div className="flex flex-wrap gap-1">
            {listing.haveCourses.map(c => (
              <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="HAVE" classCode={c.classCode} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Wants:</p>
          <div className="flex flex-wrap gap-1">
            {listing.wantCourses.map(c => (
              <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="WANT" classCode={c.classCode} />
            ))}
          </div>
        </div>
      </div>
      {listing.notes && (
        <p className="text-xs text-slate-500 mt-2 italic">{listing.notes}</p>
      )}
    </div>
  )
}
