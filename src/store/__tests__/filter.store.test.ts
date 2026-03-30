import { act } from '@testing-library/react'
import { useFilterStore } from '../filter.store'
import type { Filter, FilterBinding } from '@/types'

// Reset Zustand store state between tests
beforeEach(() => {
  act(() => {
    useFilterStore.setState({ filters: [] })
  })
})

const dateFilter: Filter = {
  id: 'date',
  label: 'Date',
  type: 'date-range',
  order: 0,
  value: null,
}

const statusFilter: Filter = {
  id: 'status',
  label: 'Status',
  type: 'single-select',
  order: 1,
  options: [{ value: 'active', label: 'Active' }],
  value: null,
}

describe('filter.store', () => {
  describe('initFilters', () => {
    it('sets the filters array', () => {
      act(() => useFilterStore.getState().initFilters([dateFilter, statusFilter]))
      expect(useFilterStore.getState().filters).toHaveLength(2)
    })
  })

  describe('setFilterValue', () => {
    it('updates only the targeted filter', () => {
      act(() => useFilterStore.getState().initFilters([dateFilter, statusFilter]))
      act(() =>
        useFilterStore
          .getState()
          .setFilterValue('status', 'active'),
      )

      const { filters } = useFilterStore.getState()
      expect(filters.find((f) => f.id === 'status')?.value).toBe('active')
      expect(filters.find((f) => f.id === 'date')?.value).toBeNull()
    })

    it('sets date range value', () => {
      act(() => useFilterStore.getState().initFilters([dateFilter]))
      act(() =>
        useFilterStore
          .getState()
          .setFilterValue('date', { from: '2024-01-01', to: '2024-12-31' }),
      )

      const filter = useFilterStore.getState().filters[0] as { value: { from: string; to: string } }
      expect(filter.value).toEqual({ from: '2024-01-01', to: '2024-12-31' })
    })
  })

  describe('resetFilter', () => {
    it('sets a specific filter value back to null', () => {
      act(() => useFilterStore.getState().initFilters([statusFilter]))
      act(() => useFilterStore.getState().setFilterValue('status', 'active'))
      act(() => useFilterStore.getState().resetFilter('status'))
      expect(useFilterStore.getState().filters[0].value).toBeNull()
    })
  })

  describe('resetAllFilters', () => {
    it('clears all filter values', () => {
      act(() => useFilterStore.getState().initFilters([dateFilter, statusFilter]))
      act(() => useFilterStore.getState().setFilterValue('status', 'active'))
      act(() =>
        useFilterStore.getState().setFilterValue('date', { from: '2024-01-01', to: '2024-12-31' }),
      )
      act(() => useFilterStore.getState().resetAllFilters())

      const { filters } = useFilterStore.getState()
      filters.forEach((f) => expect(f.value).toBeNull())
    })
  })

  describe('getFilterValue', () => {
    it('returns the current value for a filter', () => {
      act(() => useFilterStore.getState().initFilters([statusFilter]))
      act(() => useFilterStore.getState().setFilterValue('status', 'active'))
      expect(useFilterStore.getState().getFilterValue('status')).toBe('active')
    })

    it('returns null for unknown filter id', () => {
      expect(useFilterStore.getState().getFilterValue('nonexistent')).toBeNull()
    })
  })

  describe('getFiltersForWidget', () => {
    it('returns resolved query params for bound filters', () => {
      act(() => useFilterStore.getState().initFilters([statusFilter]))
      act(() => useFilterStore.getState().setFilterValue('status', 'active'))

      const bindings: FilterBinding[] = [
        {
          filterId: 'status',
          paramMappings: [{ paramTarget: 'query', paramName: 'statusParam' }],
        },
      ]

      const result = useFilterStore.getState().getFiltersForWidget(bindings)
      expect(result.queryParams).toEqual({ statusParam: 'active' })
    })

    it('returns empty params when filter has no value', () => {
      act(() => useFilterStore.getState().initFilters([statusFilter]))

      const bindings: FilterBinding[] = [
        {
          filterId: 'status',
          paramMappings: [{ paramTarget: 'query', paramName: 'status' }],
        },
      ]

      const result = useFilterStore.getState().getFiltersForWidget(bindings)
      expect(result.queryParams).toEqual({})
    })

    it('ignores unbound filters', () => {
      act(() => useFilterStore.getState().initFilters([statusFilter, dateFilter]))
      act(() => useFilterStore.getState().setFilterValue('status', 'active'))
      act(() =>
        useFilterStore.getState().setFilterValue('date', { from: '2024-01-01', to: '2024-12-31' }),
      )

      // Only bind status
      const bindings: FilterBinding[] = [
        {
          filterId: 'status',
          paramMappings: [{ paramTarget: 'query', paramName: 'status' }],
        },
      ]

      const result = useFilterStore.getState().getFiltersForWidget(bindings)
      expect(Object.keys(result.queryParams)).toHaveLength(1)
      expect(result.queryParams).toEqual({ status: 'active' })
    })
  })
})
