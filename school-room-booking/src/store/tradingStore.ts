import { create } from 'zustand'
import type { TradeListingStatus } from '@/types'

interface TradingState {
  searchQuery: string
  courseCodeFilter: string
  statusFilter: TradeListingStatus | ''
  setSearchQuery: (query: string) => void
  setCourseCodeFilter: (code: string) => void
  setStatusFilter: (status: TradeListingStatus | '') => void
  resetFilters: () => void
}

export const useTradingStore = create<TradingState>((set) => ({
  searchQuery: '',
  courseCodeFilter: '',
  statusFilter: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCourseCodeFilter: (code) => set({ courseCodeFilter: code }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  resetFilters: () =>
    set({
      searchQuery: '',
      courseCodeFilter: '',
      statusFilter: '',
    }),
}))
