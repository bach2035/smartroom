'use client'

import { useState, useEffect, useRef } from 'react'
import { useTradingStore } from '@/store/tradingStore'

interface CatalogCourse {
  name: string
  code: string
}

export default function TradingFilterBar() {
  const { searchQuery, courseCodeFilter, setSearchQuery, setCourseCodeFilter, resetFilters } =
    useTradingStore()

  const [catalog, setCatalog] = useState<CatalogCourse[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const codeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/courses')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCatalog(data.map((c: { name: string; code: string }) => ({ name: c.name, code: c.code })))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (codeRef.current && !codeRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredCodes = courseCodeFilter
    ? catalog.filter((c) =>
        c.code.toLowerCase().includes(courseCodeFilter.toLowerCase()) ||
        c.name.toLowerCase().includes(courseCodeFilter.toLowerCase())
      )
    : catalog

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input
        className="form-input flex-1 min-w-[200px]"
        placeholder="Search by course, name, or notes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="relative" ref={codeRef}>
        <input
          className="form-input w-40"
          placeholder="Course code"
          value={courseCodeFilter}
          onChange={(e) => {
            setCourseCodeFilter(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        {showSuggestions && filteredCodes.length > 0 && (
          <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
            {filteredCodes.slice(0, 8).map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setCourseCodeFilter(c.code)
                  setShowSuggestions(false)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex justify-between items-center"
              >
                <span className="font-medium text-slate-800">{c.code}</span>
                <span className="text-xs text-slate-400 truncate ml-2">{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
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
