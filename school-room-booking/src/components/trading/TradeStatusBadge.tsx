'use client'

import type { TradeListingStatus, TradeMatchStatus } from '@/types'

const statusColors: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  MATCHED: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REJECTED: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  ACCEPTED: 'IN PROGRESS',
  MATCHED: 'MATCHED',
}

export default function TradeStatusBadge({ status }: { status: TradeListingStatus | TradeMatchStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {statusLabels[status] || status}
    </span>
  )
}
