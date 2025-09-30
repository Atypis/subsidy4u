import { create } from 'zustand'
import type { Message } from 'ai'
import type { CompanyProfile, FilterCriteria, ProgramWithStatus } from '@/types'

interface AppState {
  // Chat state
  messages: Message[]
  isLoading: boolean
  
  // Company profile
  companyProfile: CompanyProfile | null
  
  // Programs state
  allPrograms: ProgramWithStatus[]
  visiblePrograms: ProgramWithStatus[]
  
  // Active filters
  activeFilters: FilterCriteria
  filterHistory: FilterCriteria[]
  
  // UI state
  selectedProgramId: string | null
  
  // Actions
  setMessages: (messages: Message[]) => void
  setIsLoading: (loading: boolean) => void
  setCompanyProfile: (profile: CompanyProfile | null) => void
  setAllPrograms: (programs: ProgramWithStatus[]) => void
  setVisiblePrograms: (programs: ProgramWithStatus[]) => void
  applyFilters: (filters: FilterCriteria) => void
  setSelectedProgram: (id: string | null) => void
  resetState: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  messages: [],
  isLoading: false,
  companyProfile: null,
  allPrograms: [],
  visiblePrograms: [],
  activeFilters: {},
  filterHistory: [],
  selectedProgramId: null,
  
  // Actions
  setMessages: (messages) => set({ messages }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setCompanyProfile: (companyProfile) => set({ companyProfile }),
  setAllPrograms: (allPrograms) => set({ allPrograms }),
  setVisiblePrograms: (visiblePrograms) => set({ visiblePrograms }),
  
  applyFilters: (filters) => set((state) => ({
    activeFilters: filters,
    filterHistory: [...state.filterHistory, filters]
  })),
  
  setSelectedProgram: (selectedProgramId) => set({ selectedProgramId }),
  
  resetState: () => set({
    messages: [],
    isLoading: false,
    companyProfile: null,
    allPrograms: [],
    visiblePrograms: [],
    activeFilters: {},
    filterHistory: [],
    selectedProgramId: null,
  })
}))
