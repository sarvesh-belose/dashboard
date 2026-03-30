import { create } from 'zustand'
import type { Filter, FilterBinding, FilterValue, ResolvedFilterParams } from '@/types'
import { buildResolvedParams } from '@/utils/filter-param-builder'

interface FilterState {
  filters: Filter[]
}

interface FilterActions {
  initFilters: (filters: Filter[]) => void
  setFilterValue: (filterId: string, value: FilterValue) => void
  resetFilter: (filterId: string) => void
  resetAllFilters: () => void
  getFilterValue: (filterId: string) => FilterValue | null
  getFiltersForWidget: (bindings: FilterBinding[]) => ResolvedFilterParams
}

type FilterStore = FilterState & FilterActions

export const useFilterStore = create<FilterStore>()((set, get) => ({
  filters: [],

  initFilters: (filters) => set({ filters }),

  setFilterValue: (filterId, value) =>
    set((state) => ({
      filters: state.filters.map((f) =>
        f.id === filterId ? { ...f, value } as Filter : f,
      ),
    })),

  resetFilter: (filterId) =>
    set((state) => ({
      filters: state.filters.map((f) =>
        f.id === filterId ? { ...f, value: null } as Filter : f,
      ),
    })),

  resetAllFilters: () =>
    set((state) => ({
      filters: state.filters.map((f) => ({ ...f, value: null }) as Filter),
    })),

  getFilterValue: (filterId) => {
    const filter = get().filters.find((f) => f.id === filterId)
    return filter?.value ?? null
  },

  getFiltersForWidget: (bindings) => {
    return buildResolvedParams(bindings, get().filters)
  },
}))
