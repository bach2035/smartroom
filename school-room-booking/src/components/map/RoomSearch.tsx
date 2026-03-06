'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMapStore } from '@/store/mapStore'
import { getTodayString, getNextSlotTime } from '@/lib/utils'
import Button from '@/components/ui/Button'
import RoomResultCard from '@/components/map/RoomResultCard'

export default function RoomSearch() {
  const { selectedDate, startTime, endTime, setSelectedDate, setStartTime, setEndTime, searchResult: result, setSearchResult: setResult, searched, setSearched } = useMapStore()
  const [loading, setLoading] = useState(false)

  const today = getTodayString()
  const isToday = selectedDate === today
  const minStartTime = isToday ? getNextSlotTime() : '07:00'

  // Auto-adjust startTime if it's in the past for today
  useEffect(() => {
    if (isToday && startTime < minStartTime) {
      setStartTime(minStartTime)
      if (endTime <= minStartTime) {
        const [h, m] = minStartTime.split(':').map(Number)
        const newEnd = m === 30 ? `${(h + 1).toString().padStart(2, '0')}:00` : `${h.toString().padStart(2, '0')}:30`
        setEndTime(newEnd > '22:00' ? '22:00' : newEnd)
      }
    }
  }, [selectedDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRooms = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/rooms/available?date=${selectedDate}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`
      )
      if (res.ok) {
        const data = await res.json()
        setResult(data)
      }
    } catch (error) {
      console.error('Error searching rooms:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedDate, startTime, endTime, setResult])

  const handleSearch = () => {
    setSearched(true)
    fetchRooms()
  }

  // Auto-refresh results when filters change after initial search
  useEffect(() => {
    if (searched) {
      fetchRooms()
    }
  }, [searched, fetchRooms])

  // Group rooms by building name
  type AvailableRoom = NonNullable<typeof result>['rooms'][number]
  const groupedRooms: Record<string, AvailableRoom[]> = {}
  if (result) {
    for (const room of result.rooms) {
      const key = room.building.name
      if (!groupedRooms[key]) groupedRooms[key] = []
      groupedRooms[key].push(room)
    }
  }

  const buildingNames = Object.keys(groupedRooms).sort()

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Search form */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Find a Room</h2>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
              Date
              <span className="relative group">
                <svg className="w-3.5 h-3.5 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-slate-800 rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                  Choose the date you want to reserve a room
                </span>
              </span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-slate-50 hover:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
              From
              <span className="relative group">
                <svg className="w-3.5 h-3.5 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-slate-800 rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                  Earliest time you need the room
                </span>
              </span>
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              min={minStartTime}
              max="21:00"
              step={1800}
              className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-slate-50 hover:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
              To
              <span className="relative group">
                <svg className="w-3.5 h-3.5 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-slate-800 rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                  Latest time you need the room until
                </span>
              </span>
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min={startTime}
              max="22:00"
              step={1800}
              className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-slate-50 hover:bg-white transition-colors"
            />
          </div>

          <Button onClick={handleSearch} loading={loading} size="lg">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find Available Rooms
          </Button>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="border-t border-slate-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : result && result.availableCount > 0 ? (
            <div className="p-6 pt-5">
              <p className="text-sm text-slate-600 mb-5">
                <span className="font-semibold text-slate-800">{result.availableCount}</span> room{result.availableCount !== 1 ? 's' : ''} available on{' '}
                <span className="font-medium">{(() => {
                  const d = new Date(selectedDate + 'T12:00:00+07:00')
                  const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Bangkok' })
                  const parts = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(d)
                  return `${weekday}, ${parts}`
                })()}</span>, {startTime} – {endTime}
              </p>

              <div className="space-y-6">
                {buildingNames.map((buildingName) => (
                  <div key={buildingName}>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      {buildingName}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {groupedRooms[buildingName].map((room) => (
                        <RoomResultCard
                          key={room.id}
                          id={room.id}
                          name={room.name}
                          roomNumber={room.roomNumber}
                          capacity={room.capacity}
                          building={room.building}
                          floor={room.floor}
                          equipment={room.equipment}
                          date={selectedDate}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">No rooms available for this time</p>
              <p className="text-sm text-slate-500 mt-1">Try a different date or time slot</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
