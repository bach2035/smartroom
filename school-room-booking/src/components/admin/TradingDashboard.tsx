'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Stats {
  listingCounts: { OPEN: number; MATCHED: number; COMPLETED: number; CANCELLED: number }
  matchCounts: { PENDING: number; ACCEPTED: number; REJECTED: number; COMPLETED: number }
  totalListings: number
  totalMatches: number
  completionRate: number
  activeTraders: number
  topCourses: { courseCode: string; courseName: string; haveCount: number; wantCount: number }[]
  recentActivity: { type: 'listing' | 'match'; description: string; userName: string; timestamp: string }[]
}

export default function TradingDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/trading/stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => setStats(data))
      .catch(err => console.error('Error fetching trading stats:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return <p className="text-center py-12 text-gray-500">Failed to load trading stats.</p>
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Listings"
          value={stats.totalListings}
          breakdown={`${stats.listingCounts.OPEN} open · ${stats.listingCounts.MATCHED} matched · ${stats.listingCounts.COMPLETED} done · ${stats.listingCounts.CANCELLED} cancelled`}
          icon={<ListIcon />}
          color="blue"
        />
        <StatCard
          title="Total Matches"
          value={stats.totalMatches}
          breakdown={`${stats.matchCounts.PENDING} pending · ${stats.matchCounts.ACCEPTED} accepted · ${stats.matchCounts.REJECTED} rejected · ${stats.matchCounts.COMPLETED} done`}
          icon={<SwapIcon />}
          color="purple"
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          breakdown={`${stats.matchCounts.COMPLETED} completed of ${stats.totalMatches} matches`}
          icon={<CheckIcon />}
          color="green"
        />
        <StatCard
          title="Active Traders"
          value={stats.activeTraders}
          breakdown="Users with open listings"
          icon={<UsersIcon />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Courses */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Popular Courses</h2>
            <Link href="/trading/admin/listings" className="text-sm text-red-700 hover:text-red-800 font-medium">
              View all →
            </Link>
          </div>
          {stats.topCourses.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No courses yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 font-medium text-slate-500">Code</th>
                    <th className="text-left py-2 font-medium text-slate-500">Name</th>
                    <th className="text-center py-2 font-medium text-slate-500">Have</th>
                    <th className="text-center py-2 font-medium text-slate-500">Want</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topCourses.map((c) => (
                    <tr key={c.courseCode} className="border-b border-slate-50">
                      <td className="py-2 font-semibold text-slate-800">{c.courseCode}</td>
                      <td className="py-2 text-slate-600">{c.courseName}</td>
                      <td className="py-2 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                          {c.haveCount}
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                          {c.wantCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Activity</h2>
            <Link href="/trading/admin/matches" className="text-sm text-red-700 hover:text-red-800 font-medium">
              View matches →
            </Link>
          </div>
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    a.type === 'listing' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {a.type === 'listing' ? <ListIcon size="sm" /> : <SwapIcon size="sm" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800">{a.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(a.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, breakdown, icon, color }: {
  title: string
  value: string | number
  breakdown: string
  icon: React.ReactNode
  color: 'blue' | 'purple' | 'green' | 'amber'
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{breakdown}</p>
    </div>
  )
}

function ListIcon({ size }: { size?: 'sm' }) {
  const cls = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
}

function SwapIcon({ size }: { size?: 'sm' }) {
  const cls = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
}

function CheckIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}

function UsersIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
}
