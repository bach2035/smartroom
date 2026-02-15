'use client'

import { useState, useEffect } from 'react'
import ReportStatusBadge from '@/components/reports/ReportStatusBadge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface Report {
  id: string
  title: string
  description: string | null
  category: string
  status: string
  adminNotes: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  reporter: {
    id: string
    name: string
    email: string
  }
  room: {
    name: string
    roomNumber: string
    floor: string
    building: string
  }
  resolver: string | null
}

const categoryLabels: Record<string, string> = {
  EQUIPMENT_MALFUNCTION: 'Equipment Malfunction',
  DEVICE_MISSING: 'Device Missing',
  FURNITURE_DAMAGE: 'Furniture Damage',
  CLEANLINESS: 'Cleanliness',
  OTHER: 'Other',
}

const categoryStyles: Record<string, string> = {
  EQUIPMENT_MALFUNCTION: 'bg-red-50 text-red-700',
  DEVICE_MISSING: 'bg-purple-50 text-purple-700',
  FURNITURE_DAMAGE: 'bg-orange-50 text-orange-700',
  CLEANLINESS: 'bg-teal-50 text-teal-700',
  OTHER: 'bg-slate-50 text-slate-700',
}

export default function ReportManagement() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Modal state for resolve action
  const [resolveModal, setResolveModal] = useState<{ open: boolean; reportId: string | null }>({ open: false, reportId: null })
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    fetchReports()
  }, [filter])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await fetch(`/api/admin/reports${params}`)
      if (res.ok) {
        const data = await res.json()
        setReports(data)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (reportId: string, status: string, notes?: string) => {
    setActionLoading(reportId)
    try {
      const body: Record<string, string> = { status }
      if (notes !== undefined) body.adminNotes = notes

      const res = await fetch(`/api/admin/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        fetchReports()
      }
    } catch (error) {
      console.error('Error updating report:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleResolve = async () => {
    if (!resolveModal.reportId) return
    await updateStatus(resolveModal.reportId, 'RESOLVED', adminNotes)
    setResolveModal({ open: false, reportId: null })
    setAdminNotes('')
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: 'all', label: 'All' },
          { value: 'OPEN', label: 'Open' },
          { value: 'IN_PROGRESS', label: 'In Progress' },
          { value: 'RESOLVED', label: 'Resolved' },
          { value: 'CLOSED', label: 'Closed' },
        ].map((option) => (
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No reports found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <h3 className="text-lg font-semibold text-slate-800">{report.title}</h3>
                    <ReportStatusBadge status={report.status} />
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryStyles[report.category] || 'bg-slate-50 text-slate-700'}`}>
                      {categoryLabels[report.category] || report.category}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-slate-600">{report.room.name} ({report.room.building})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-slate-600">{report.reporter.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-slate-600">{formatDate(report.createdAt)}</span>
                    </div>
                    {report.resolver && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-slate-600">Resolved by {report.resolver}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {report.description && (
                    <p className="mt-3 text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                      {report.description}
                    </p>
                  )}

                  {/* Admin notes */}
                  {report.adminNotes && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-sm font-medium text-red-900">Admin Notes</p>
                      <p className="text-sm text-red-700 mt-0.5">{report.adminNotes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                  {report.status === 'OPEN' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(report.id, 'IN_PROGRESS')}
                      disabled={actionLoading === report.id}
                      loading={actionLoading === report.id}
                    >
                      Start Review
                    </Button>
                  )}
                  {report.status === 'IN_PROGRESS' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setResolveModal({ open: true, reportId: report.id })
                        setAdminNotes(report.adminNotes || '')
                      }}
                      disabled={actionLoading === report.id}
                      loading={actionLoading === report.id}
                    >
                      Mark Resolved
                    </Button>
                  )}
                  {report.status !== 'CLOSED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateStatus(report.id, 'CLOSED')}
                      disabled={actionLoading === report.id}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      <Modal
        isOpen={resolveModal.open}
        onClose={() => {
          setResolveModal({ open: false, reportId: null })
          setAdminNotes('')
        }}
        title="Resolve Report"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Add any notes about how this issue was resolved.
          </p>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={4}
            placeholder="Resolution notes (optional)..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setResolveModal({ open: false, reportId: null })
                setAdminNotes('')
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              loading={actionLoading === resolveModal.reportId}
              className="flex-1"
            >
              Mark Resolved
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
