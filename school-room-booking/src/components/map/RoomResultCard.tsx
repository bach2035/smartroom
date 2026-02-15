'use client'

import Link from 'next/link'

interface EquipmentItem {
  id: string
  name: string
  icon: string | null
  quantity: number
}

interface RoomResultCardProps {
  id: string
  name: string
  roomNumber: string
  capacity: number
  building: { id: string; name: string }
  floor: { id: string; name: string; level: number }
  equipment: EquipmentItem[]
  date: string
}

export default function RoomResultCard({
  id,
  name,
  roomNumber,
  capacity,
  floor,
  equipment,
  date,
}: RoomResultCardProps) {
  return (
    <Link
      href={`/room/${id}?date=${date}`}
      className="block p-4 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800 group-hover:text-red-700 transition-colors">
              {roomNumber}
            </p>
            <span className="text-slate-400">·</span>
            <p className="text-sm text-slate-600 truncate">{name}</p>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Floor {floor.level} — {floor.name}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium">{capacity}</span>
        </div>
      </div>

      {equipment.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {equipment.map((eq) => (
            <span
              key={eq.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-xs text-slate-600 group-hover:bg-red-100/50"
            >
              {eq.icon && <span className="text-xs">{eq.icon}</span>}
              {eq.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
