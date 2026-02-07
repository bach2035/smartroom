import { create } from 'zustand'

interface MapState {
  selectedDate: string
  startTime: string
  endTime: string
  selectedRoomId: string | null
  setSelectedDate: (date: string) => void
  setStartTime: (time: string) => void
  setEndTime: (time: string) => void
  setSelectedRoomId: (roomId: string | null) => void
  resetFilters: () => void
}

const today = new Date().toISOString().split('T')[0]

export const useMapStore = create<MapState>((set) => ({
  selectedDate: today,
  startTime: '08:00',
  endTime: '18:00',
  selectedRoomId: null,
  setSelectedDate: (date) => set({ selectedDate: date }),
  setStartTime: (time) => set({ startTime: time }),
  setEndTime: (time) => set({ endTime: time }),
  setSelectedRoomId: (roomId) => set({ selectedRoomId: roomId }),
  resetFilters: () =>
    set({
      selectedDate: today,
      startTime: '08:00',
      endTime: '18:00',
      selectedRoomId: null,
    }),
}))
