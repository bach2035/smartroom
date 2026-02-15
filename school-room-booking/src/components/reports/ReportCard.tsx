'use client'

import ReportStatusBadge from './ReportStatusBadge'

interface Report {
  id: string
  title: string
  description: string | null
  category: string
  status: string
  adminNotes: string | null
  createdAt: string
  room: {
    name: string
    roomNumber: string
    floor: string
    building: string
  }
}

interface ReportCardProps {
  report: Report
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

export default function ReportCard({ report }: ReportCardProps) {
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all">
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <h3 className="text-lg font-semibold text-slate-800">{report.title}</h3>
          <ReportStatusBadge status={report.status} />
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryStyles[report.category] || 'bg-slate-50 text-slate-700'}`}>
            {categoryLabels[report.category] || report.category}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-slate-800 font-medium">{report.room.name}</p>
              <p className="text-slate-500 text-xs">{report.room.building} - Room {report.room.roomNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-800 font-medium">{formatDate(report.createdAt)}</p>
          </div>
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
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-900">Admin Notes</p>
                <p className="text-sm text-red-700 mt-0.5">{report.adminNotes}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
