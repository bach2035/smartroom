'use client'

import { useMapStore } from '@/store/mapStore'
import { getTodayString } from '@/lib/utils'

export default function FilterBar() {
  const { selectedDate, startTime, endTime, setSelectedDate, setStartTime, setEndTime, resetFilters } = useMapStore()

  const today = getTodayString()

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filter inputs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={today}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-slate-50 hover:bg-white transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">From</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                min="07:00"
                max="21:00"
                step={1800}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-slate-50 hover:bg-white transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">To</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                min={startTime}
                max="22:00"
                step={1800}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-slate-50 hover:bg-white transition-colors"
              />
            </div>

            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>

          {/* Legend */}
          <div className="ml-auto flex items-center gap-4">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Legend:</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <span className="text-sm text-slate-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                <span className="text-sm text-slate-600">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                <span className="text-sm text-slate-600">Selected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
