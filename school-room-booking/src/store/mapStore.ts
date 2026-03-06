import { create } from 'zustand'
import { getTodayString, getNextSlotTime } from '@/lib/utils'

interface AvailableRoom {
  id: string
  name: string
  roomNumber: string
  capacity: number
  description: string | null
  building: { id: string; name: string }
  floor: { id: string; name: string; level: number }
  equipment: { id: string; name: string; icon: string | null; quantity: number }[]
}

interface SearchResult {
  rooms: AvailableRoom[]
  availableCount: number
  totalRooms: number
}

interface MapState {
  selectedDate: string
  startTime: string
  endTime: string
  selectedRoomId: string | null
  searchResult: SearchResult | null
  searched: boolean
  setSelectedDate: (date: string) => void
  setStartTime: (time: string) => void
  setEndTime: (time: string) => void
  setSelectedRoomId: (roomId: string | null) => void
  setSearchResult: (result: SearchResult | null) => void
  setSearched: (searched: boolean) => void
  resetFilters: () => void
}

const today = getTodayString()
const nextSlot = getNextSlotTime()
const initialStart = nextSlot > '08:00' && nextSlot < '22:00' ? nextSlot : '08:00'

export const useMapStore = create<MapState>((set) => ({
  selectedDate: today,
  startTime: initialStart,
  endTime: '18:00',
  selectedRoomId: null,
  searchResult: null,
  searched: false,
  setSelectedDate: (date) => set({ selectedDate: date }),
  setStartTime: (time) => set({ startTime: time }),
  setEndTime: (time) => set({ endTime: time }),
  setSelectedRoomId: (roomId) => set({ selectedRoomId: roomId }),
  setSearchResult: (result) => set({ searchResult: result }),
  setSearched: (searched) => set({ searched }),
  resetFilters: () =>
    set({
      selectedDate: today,
      startTime: initialStart,
      endTime: '18:00',
      selectedRoomId: null,
      searchResult: null,
      searched: false,
    }),
}))
