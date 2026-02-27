'use client'

import { useTradingStore } from '@/store/tradingStore'

export default function TradingFilterBar() {
  const { searchQuery, courseCodeFilter, setSearchQuery, setCourseCodeFilter, resetFilters } =
    useTradingStore()

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input
        className="form-input flex-1 min-w-[200px]"
        placeholder="Search by course, name, or notes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <input
        className="form-input w-40"
        placeholder="Course code"
        value={courseCodeFilter}
        onChange={(e) => setCourseCodeFilter(e.target.value)}
      />
      {(searchQuery || courseCodeFilter) && (
        <button
          onClick={resetFilters}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
