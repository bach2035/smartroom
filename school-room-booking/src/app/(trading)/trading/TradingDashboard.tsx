'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TradeListing } from '@/types'
import ListingCard from '@/components/trading/ListingCard'
import TradingFilterBar from '@/components/trading/TradingFilterBar'
import CourseTag from '@/components/trading/CourseTag'
import TradeStatusBadge from '@/components/trading/TradeStatusBadge'
import MatchingListings from '@/components/trading/MatchingListings'
import ListingForm from '@/components/trading/ListingForm'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'
import { useTradingStore } from '@/store/tradingStore'

interface ListingDetail {
  id: string
  userId: string
  listingType: 'TRADE' | 'GIVEAWAY'
  status: string
  notes: string | null
  createdAt: string
  userName: string | null
  username: string | null
  contactEmail: string | null
  phone: string | null
  studentClass: string | null
  studentId: string | null
  isOwn: boolean
  haveCourses: { id: string; courseCode: string; courseName: string; classCode: string | null; section: string | null; schedule: string | null; credits: number | null; type: string }[]
  wantCourses: { id: string; courseCode: string; courseName: string; classCode: string | null; section: string | null; schedule: string | null; credits: number | null; type: string }[]
}

export default function TradingDashboard() {
  const [listings, setListings] = useState<TradeListing[]>([])
  const [loading, setLoading] = useState(true)
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [activeTab, setActiveTab] = useState<'TRADE' | 'GIVEAWAY'>('TRADE')
  const { searchQuery, courseCodeFilter } = useTradingStore()
  const { showToast } = useToast()

  // Suggested matches state
  const [suggestedMatches, setSuggestedMatches] = useState<(TradeListing & { matchScore?: number })[]>([])
  const [myOpenListings, setMyOpenListings] = useState<TradeListing[]>([])

  // Propose trade state
  const [selectedMyListingId, setSelectedMyListingId] = useState<string | null>(null)
  const [proposing, setProposing] = useState(false)
  const [proposedListingIds, setProposedListingIds] = useState<Set<string>>(new Set())

  // Modal state
  const [selectedListing, setSelectedListing] = useState<ListingDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [showMatches, setShowMatches] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Confirm modal state
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  // Check first visit
  useEffect(() => {
    const visited = sessionStorage.getItem('trading_visited')
    if (!visited) {
      setIsFirstVisit(true)
      sessionStorage.setItem('trading_visited', '1')
    }
  }, [])

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (courseCodeFilter) params.set('courseCode', courseCodeFilter)
      params.set('listingType', activeTab)
      const res = await fetch(`/api/trading/listings?${params}`)
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings || [])
      }
    } finally {
      setLoading(false)
    }
  }, [searchQuery, courseCodeFilter, activeTab])

  // Fetch user's open listings + suggested matches
  const fetchMyOpenListings = useCallback(async () => {
    try {
      const res = await fetch('/api/trading/listings/me')
      if (!res.ok) return
      const data = await res.json()
      const openOnes = (data.listings || []).filter((l: TradeListing) => l.status === 'OPEN')
      setMyOpenListings(openOnes)

      if (!openOnes.length) return
      const firstOpen = openOnes.find((l: TradeListing) => l.listingType !== 'GIVEAWAY') || openOnes[0]
      if (firstOpen.listingType === 'GIVEAWAY') return
      const matchRes = await fetch(`/api/trading/listings/${firstOpen.id}/matches`)
      if (matchRes.ok) {
        const matchData = await matchRes.json()
        setSuggestedMatches((matchData.matches || []).slice(0, 4))
      }
    } catch {
      // Silently fail
    }
  }, [])

  // Fetch already-requested giveaway IDs
  const fetchRequestedGiveaways = useCallback(async () => {
    try {
      const res = await fetch('/api/trading/matches')
      if (!res.ok) return
      const data = await res.json()
      const ids = new Set<string>()
      for (const m of (data.matches || [])) {
        // isGiveawayRequest + otherListing exists = I'm the requester viewing the giveaway
        if (m.isGiveawayRequest && m.otherListing) {
          ids.add(m.otherListing.id)
        }
      }
      setRequestedGiveawayIds(ids)
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    fetchMyOpenListings()
    fetchRequestedGiveaways()
  }, [fetchMyOpenListings])

  useEffect(() => {
    const timeout = setTimeout(fetchListings, 300)
    return () => clearTimeout(timeout)
  }, [fetchListings])

  const openDetail = async (listingId: string) => {
    setDetailLoading(true)
    setSelectedListing(null)
    setDetailError(null)
    setShowMatches(false)
    try {
      const res = await fetch(`/api/trading/listings/${listingId}`)
      const data = await res.json()
      if (res.ok && data.listing) {
        setSelectedListing(data.listing)
      } else {
        setDetailError(data.error || 'Failed to load listing')
        console.error('Listing detail error:', res.status, data)
      }
    } catch (error) {
      setDetailError('Network error')
      console.error('Error fetching listing detail:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    if (!detailLoading) {
      setSelectedListing(null)
      setDetailError(null)
      setShowMatches(false)
      setGiveawayMessage('')
    }
  }

  const handleCreate = async (data: { notes: string; haveCourses: { courseName: string; courseCode: string; section: string; schedule: string; credits: string }[]; wantCourses: { courseName: string; courseCode: string; section: string; schedule: string; credits: string }[]; listingType?: string }) => {
    const res = await fetch('/api/trading/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: data.notes,
        listingType: data.listingType || 'TRADE',
        haveCourses: data.haveCourses.map((c) => ({ ...c, credits: c.credits ? parseInt(c.credits) : null })),
        wantCourses: data.wantCourses.map((c) => ({ ...c, credits: c.credits ? parseInt(c.credits) : null })),
      }),
    })
    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error || 'Failed to create listing')
    }
    setShowCreateModal(false)
    showToast('Listing created successfully!')
    fetchListings()
    fetchMyOpenListings()
  }

  const handleEdit = async (data: { notes: string; haveCourses: { courseName: string; courseCode: string; section: string; schedule: string; credits: string }[]; wantCourses: { courseName: string; courseCode: string; section: string; schedule: string; credits: string }[] }) => {
    if (!selectedListing) return
    const res = await fetch(`/api/trading/listings/${selectedListing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: data.notes,
        haveCourses: data.haveCourses.map((c) => ({ ...c, credits: c.credits ? parseInt(c.credits) : null })),
        wantCourses: data.wantCourses.map((c) => ({ ...c, credits: c.credits ? parseInt(c.credits) : null })),
      }),
    })
    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error || 'Failed to update listing')
    }
    setShowEditModal(false)
    showToast('Listing updated successfully!')
    // Refresh the detail
    openDetail(selectedListing.id)
    fetchListings()
  }

  const handleCancel = async () => {
    if (!selectedListing) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/trading/listings/${selectedListing.id}`, { method: 'DELETE' })
      if (res.ok) {
        setConfirmCancel(false)
        setSelectedListing(null)
        showToast('Listing cancelled')
        fetchListings()
      }
    } finally {
      setCancelling(false)
    }
  }

  // Giveaway request state
  const [requestingGiveaway, setRequestingGiveaway] = useState(false)
  const [giveawayMessage, setGiveawayMessage] = useState('')
  const [requestedGiveawayIds, setRequestedGiveawayIds] = useState<Set<string>>(new Set())

  // Track which suggested listing we're proposing for (inline)
  const [proposingForId, setProposingForId] = useState<string | null>(null)

  const handleRequestGiveaway = async (giveawayListingId: string) => {
    setRequestingGiveaway(true)
    try {
      const res = await fetch('/api/trading/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theirListingId: giveawayListingId,
          message: giveawayMessage.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Course requested successfully!', 'success')
        setRequestedGiveawayIds((prev) => new Set(prev).add(giveawayListingId))
        setSelectedListing(null)
        setGiveawayMessage('')
      } else {
        showToast(data.error || 'Failed to request course', 'error')
      }
    } finally {
      setRequestingGiveaway(false)
    }
  }

  const handleProposeTrade = async (myListingId: string, theirListingId: string) => {
    setProposing(true)
    setProposingForId(theirListingId)
    try {
      const res = await fetch('/api/trading/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ myListingId, theirListingId }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Trade proposed successfully!', 'success')
        setProposedListingIds((prev) => new Set(prev).add(theirListingId))
      } else {
        showToast(data.error || 'Failed to propose trade', 'error')
      }
    } finally {
      setProposing(false)
      setProposingForId(null)
      setSelectedMyListingId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Onboarding banner for first-time visitors */}
      {isFirstVisit && (
        <div className="bg-gradient-to-r from-red-50 to-blue-50 border border-red-100 rounded-xl p-5 mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-3">How Course Trading Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm shrink-0">1</div>
              <div>
                <p className="font-medium text-slate-800 text-sm">Create a Listing</p>
                <p className="text-xs text-slate-500">List courses you have and want to trade</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">2</div>
              <div>
                <p className="font-medium text-slate-800 text-sm">Get Matched</p>
                <p className="text-xs text-slate-500">Find students with compatible courses</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">3</div>
              <div>
                <p className="font-medium text-slate-800 text-sm">Chat & Complete</p>
                <p className="text-xs text-slate-500">Negotiate, agree, and confirm the swap</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsFirstVisit(false)}
            className="mt-3 text-xs text-slate-400 hover:text-slate-600"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Browse Listings</h1>
          <p className="text-sm text-slate-500">Find course swap offers from other students</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          + New Listing
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('TRADE')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'TRADE'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Trading
          </span>
        </button>
        <button
          onClick={() => setActiveTab('GIVEAWAY')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'GIVEAWAY'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            Giveaways
          </span>
        </button>
      </div>

      {/* Suggested matches section (only for trading tab) */}
      {activeTab === 'TRADE' && suggestedMatches.length > 0 && !searchQuery && !courseCodeFilter && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h2 className="text-lg font-bold text-slate-800">Suggested for You</h2>
          </div>
          <div className="space-y-2">
            {suggestedMatches.map((match) => {
              const have = match.haveCourses?.map((c) => `${c.courseCode} - ${c.courseName}`).join(', ') || '—'
              const want = match.wantCourses?.map((c) => `${c.courseCode} - ${c.courseName}`).join(', ') || '—'
              const isProposed = proposedListingIds.has(match.id)
              const isProposing = proposingForId === match.id && proposing
              return (
                <div
                  key={match.id}
                  className="rounded-lg border border-yellow-200 bg-yellow-50/30 hover:bg-yellow-50 transition-colors"
                >
                  <button
                    onClick={() => openDetail(match.id)}
                    className="w-full flex items-center gap-4 px-4 py-3 text-left"
                  >
                    <div className="w-32 shrink-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{match.userName || 'Anonymous'}</p>
                    </div>
                    <div className="flex-1 min-w-0 text-sm space-y-0.5">
                      <p className="truncate">
                        <span className="text-xs font-medium text-slate-400 mr-1.5">HAS</span>
                        <span className="text-green-700">{have}</span>
                      </p>
                      <p className="truncate">
                        <span className="text-xs font-medium text-slate-400 mr-1.5">WANTS</span>
                        <span className="text-blue-700">{want}</span>
                      </p>
                    </div>
                    {match.matchScore && (
                      <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full shrink-0">
                        {match.matchScore} overlap{match.matchScore > 1 ? 's' : ''}
                      </span>
                    )}
                    <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="px-4 pb-3 flex items-center gap-2">
                    {isProposed ? (
                      <span className="inline-flex items-center text-sm text-green-700 font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Proposed
                      </span>
                    ) : myOpenListings.length === 1 ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleProposeTrade(myOpenListings[0].id, match.id) }}
                        disabled={isProposing}
                        className="btn btn-primary text-xs py-1.5 px-3"
                      >
                        {isProposing ? 'Proposing...' : 'Propose Trade'}
                      </button>
                    ) : myOpenListings.length > 1 ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          className="form-select text-xs py-1.5 px-2 rounded-lg border border-slate-200"
                          value={selectedMyListingId || ''}
                          onChange={(e) => setSelectedMyListingId(e.target.value || null)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">Select your listing</option>
                          {myOpenListings.map((ml) => {
                            const h = ml.haveCourses.map((c) => c.courseCode).join(', ')
                            const w = ml.wantCourses.map((c) => c.courseCode).join(', ')
                            return <option key={ml.id} value={ml.id}>{h} → {w}</option>
                          })}
                        </select>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (selectedMyListingId) handleProposeTrade(selectedMyListingId, match.id) }}
                          disabled={!selectedMyListingId || isProposing}
                          className="btn btn-primary text-xs py-1.5 px-3"
                        >
                          {isProposing ? 'Proposing...' : 'Propose'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowCreateModal(true) }}
                        className="btn btn-secondary text-xs py-1.5 px-3"
                      >
                        Create Listing to Trade
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {myOpenListings.length > 0 && suggestedMatches.length >= 4 && (
            <p className="text-xs text-slate-400 mt-2 text-center">
              View all matches from My Listings page
            </p>
          )}
        </div>
      )}

      <div className="mb-6">
        <TradingFilterBar />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading listings...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {activeTab === 'GIVEAWAY' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            )}
          </svg>
          <p className="text-slate-600 font-medium mb-1">
            {activeTab === 'GIVEAWAY' ? 'No giveaways available' : 'No listings found'}
          </p>
          <p className="text-sm text-slate-400 mb-4">
            {activeTab === 'GIVEAWAY'
              ? 'No one is giving away courses right now. Check back later!'
              : 'Be the first to list a course you want to trade!'}
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Create a Listing
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onClick={() => openDetail(listing.id)} />
          ))}
        </div>
      )}

      {/* Listing Detail Modal */}
      <Modal
        isOpen={detailLoading || !!selectedListing || !!detailError}
        onClose={closeDetail}
        title="Listing Detail"
        size="lg"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : detailError ? (
          <div className="text-center py-8 text-red-600">{detailError}</div>
        ) : selectedListing && (
          <div className="space-y-5">
            {/* Owner info + status */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {selectedListing.userName || 'Anonymous'}
                </h2>
                {selectedListing.username && (
                  <p className="text-sm text-slate-400">@{selectedListing.username}</p>
                )}
              </div>
              <TradeStatusBadge status={selectedListing.status as 'OPEN' | 'MATCHED' | 'COMPLETED' | 'CANCELLED'} />
            </div>

            {/* Owner details */}
            <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
              {selectedListing.contactEmail && (
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="font-medium text-slate-700">{selectedListing.contactEmail}</p>
                </div>
              )}
              {selectedListing.phone && (
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="font-medium text-slate-700">{selectedListing.phone}</p>
                </div>
              )}
              {selectedListing.studentClass && (
                <div>
                  <p className="text-xs text-slate-400">Class</p>
                  <p className="font-medium text-slate-700">{selectedListing.studentClass}</p>
                </div>
              )}
              {selectedListing.studentId && (
                <div>
                  <p className="text-xs text-slate-400">Student ID</p>
                  <p className="font-medium text-slate-700">{selectedListing.studentId}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400">Posted</p>
                <p className="font-medium text-slate-700">{new Date(selectedListing.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Have courses */}
            {selectedListing.haveCourses.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-700 mb-2">
                  {selectedListing.listingType === 'GIVEAWAY' ? 'Course to Give Away' : 'Courses to Trade Away'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.haveCourses.map((c) => (
                    <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="HAVE" classCode={c.classCode} section={c.section} schedule={c.schedule} />
                  ))}
                </div>
              </div>
            )}

            {/* Want courses */}
            {selectedListing.wantCourses.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-blue-700 mb-2">Courses Wanted</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.wantCourses.map((c) => (
                    <CourseTag key={c.id} courseCode={c.courseCode} courseName={c.courseName} type="WANT" classCode={c.classCode} section={c.section} schedule={c.schedule} />
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedListing.notes && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-700">{selectedListing.notes}</p>
              </div>
            )}

            {/* Own listing actions */}
            {selectedListing.isOwn && selectedListing.status === 'OPEN' && (
              <div className="flex gap-3 border-t border-slate-100 pt-4">
                {selectedListing.listingType !== 'GIVEAWAY' && (
                  <button
                    onClick={() => setShowMatches(!showMatches)}
                    className="btn btn-primary"
                  >
                    {showMatches ? 'Hide Matches' : 'Find Matches'}
                  </button>
                )}
                <button
                  onClick={() => setShowEditModal(true)}
                  className="btn btn-secondary"
                >
                  Edit Listing
                </button>
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="btn btn-secondary text-red-600 hover:text-red-700"
                >
                  Cancel Listing
                </button>
              </div>
            )}

            {/* Request giveaway (non-owner) */}
            {!selectedListing.isOwn && selectedListing.status === 'OPEN' && selectedListing.listingType === 'GIVEAWAY' && (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                {requestedGiveawayIds.has(selectedListing.id) ? (
                  <div className="flex items-center justify-center gap-2 py-3 text-green-700 font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Requested
                  </div>
                ) : (
                  <>
                    <input
                      className="form-input w-full text-sm"
                      placeholder="Add a message with your request (optional)..."
                      value={giveawayMessage}
                      onChange={(e) => setGiveawayMessage(e.target.value)}
                    />
                    <button
                      onClick={() => handleRequestGiveaway(selectedListing.id)}
                      disabled={requestingGiveaway}
                      className="btn btn-primary w-full"
                    >
                      {requestingGiveaway ? 'Requesting...' : 'Request This Course'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Matching listings (trade only) */}
            {showMatches && selectedListing.listingType !== 'GIVEAWAY' && (
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Matching Listings</h3>
                <MatchingListings listingId={selectedListing.id} listingType={selectedListing.listingType} />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Listing Modal */}
      {selectedListing && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Listing"
          size="lg"
        >
          <ListingForm
            initialNotes={selectedListing.notes || ''}
            initialListingType={selectedListing.listingType}
            initialHaveCourses={selectedListing.haveCourses.map((c) => ({
              courseName: c.courseName,
              courseCode: c.courseCode,
              classCode: c.classCode || '',
              section: c.section || '',
              schedule: c.schedule || '',
              credits: c.credits?.toString() || '',
            }))}
            initialWantCourses={selectedListing.wantCourses.map((c) => ({
              courseName: c.courseName,
              courseCode: c.courseCode,
              classCode: c.classCode || '',
              section: c.section || '',
              schedule: c.schedule || '',
              credits: c.credits?.toString() || '',
            }))}
            onSubmit={handleEdit}
            submitLabel="Save Changes"
          />
        </Modal>
      )}

      {/* Create Listing Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Listing"
        size="lg"
      >
        <p className="text-sm text-slate-500 mb-4">List the courses you have and want to trade.</p>
        <ListingForm onSubmit={handleCreate} />
      </Modal>

      {/* Confirm Cancel Modal */}
      <ConfirmModal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        title="Cancel Listing"
        message="This will cancel your listing and it cannot be undone. Any pending matches will also be affected."
        confirmLabel="Cancel Listing"
        confirmVariant="danger"
        loading={cancelling}
      />
    </div>
  )
}
