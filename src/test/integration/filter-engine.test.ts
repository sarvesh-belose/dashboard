/**
 * Integration test: Filter Engine
 *
 * Verifies that when a filter value changes, only widgets bound to that filter
 * get a new TanStack Query cache key (and would therefore refetch), while
 * unbound widgets are unaffected.
 */
import { act } from '@testing-library/react'
import { useFilterStore } from '@/store/filter.store'
import { useDashboardStore } from '@/store/dashboard.store'
import { buildResolvedParams } from '@/utils/filter-param-builder'
import type { Filter, Widget, FilterBinding, Dashboard } from '@/types'

const makeDashboard = (): Dashboard => ({
  id: 'dash-1',
  name: 'Test',
  layout: { lg: [], md: [], sm: [], xs: [] },
  widgetIds: ['chart-widget', 'text-widget'],
  filterIds: ['date', 'status'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ownerId: 'u1',
})

const dateFilter: Filter = { id: 'date', label: 'Date', type: 'date-range', order: 0, value: null }
const statusFilter: Filter = { id: 'status', label: 'Status', type: 'single-select', order: 1, options: [], value: null }

// Chart widget is bound to both date AND status filters
const chartBindings: FilterBinding[] = [
  {
    filterId: 'date',
    paramMappings: [
      { paramTarget: 'query', paramName: 'from', filterField: 'from' },
      { paramTarget: 'query', paramName: 'to', filterField: 'to' },
    ],
  },
  {
    filterId: 'status',
    paramMappings: [{ paramTarget: 'query', paramName: 'status' }],
  },
]

// Text widget is NOT bound to any filters
const textBindings: FilterBinding[] = []

beforeEach(() => {
  act(() => {
    useFilterStore.setState({ filters: [] })
    useDashboardStore.setState({ dashboard: null, widgets: {}, isEditMode: false, isDirty: false, isSaving: false })
  })
})

describe('Filter Engine integration', () => {
  it('unbound widget always has empty resolved params (stable cache key)', () => {
    act(() => useFilterStore.getState().initFilters([dateFilter, statusFilter]))
    act(() => useFilterStore.getState().setFilterValue('status', 'active'))

    const filters = useFilterStore.getState().filters
    const params = buildResolvedParams(textBindings, filters)
    expect(params.queryParams).toEqual({})
    expect(params.bodyParams).toEqual({})
  })

  it('bound widget gets populated params when filter has a value', () => {
    act(() => useFilterStore.getState().initFilters([dateFilter, statusFilter]))
    act(() => useFilterStore.getState().setFilterValue('status', 'active'))

    const filters = useFilterStore.getState().filters
    const params = buildResolvedParams(chartBindings, filters)
    expect(params.queryParams).toMatchObject({ status: 'active' })
  })

  it('changing status filter only changes chart widget params, not text widget params', () => {
    act(() => useFilterStore.getState().initFilters([dateFilter, statusFilter]))

    const filtersBefore = useFilterStore.getState().filters
    const chartBefore = buildResolvedParams(chartBindings, filtersBefore)
    const textBefore = buildResolvedParams(textBindings, filtersBefore)

    // Change status filter
    act(() => useFilterStore.getState().setFilterValue('status', 'active'))

    const filtersAfter = useFilterStore.getState().filters
    const chartAfter = buildResolvedParams(chartBindings, filtersAfter)
    const textAfter = buildResolvedParams(textBindings, filtersAfter)

    // Chart widget params changed
    expect(chartBefore.queryParams).not.toEqual(chartAfter.queryParams)
    expect(chartAfter.queryParams.status).toBe('active')

    // Text widget params unchanged (both empty)
    expect(textBefore.queryParams).toEqual(textAfter.queryParams)
    expect(textAfter.queryParams).toEqual({})
  })

  it('changing date filter updates chart widget params with from/to', () => {
    act(() => useFilterStore.getState().initFilters([dateFilter, statusFilter]))
    act(() => useFilterStore.getState().setFilterValue('date', { from: '2024-01-01', to: '2024-12-31' }))

    const filters = useFilterStore.getState().filters
    const params = buildResolvedParams(chartBindings, filters)
    expect(params.queryParams).toMatchObject({ from: '2024-01-01', to: '2024-12-31' })
  })

  it('resetting filters returns all widgets to empty params', () => {
    act(() => useFilterStore.getState().initFilters([dateFilter, statusFilter]))
    act(() => {
      useFilterStore.getState().setFilterValue('status', 'active')
      useFilterStore.getState().setFilterValue('date', { from: '2024-01-01', to: '2024-12-31' })
    })
    act(() => useFilterStore.getState().resetAllFilters())

    const filters = useFilterStore.getState().filters
    const params = buildResolvedParams(chartBindings, filters)
    expect(params.queryParams).toEqual({})
  })

  it('multiple widgets with different bindings produce independent params', () => {
    // Widget A: bound to status only
    const widgetABindings: FilterBinding[] = [
      { filterId: 'status', paramMappings: [{ paramTarget: 'query', paramName: 'statusCode' }] },
    ]
    // Widget B: bound to date only
    const widgetBBindings: FilterBinding[] = [
      {
        filterId: 'date',
        paramMappings: [
          { paramTarget: 'query', paramName: 'startDate', filterField: 'from' },
        ],
      },
    ]

    act(() => useFilterStore.getState().initFilters([dateFilter, statusFilter]))
    act(() => {
      useFilterStore.getState().setFilterValue('status', 'active')
      useFilterStore.getState().setFilterValue('date', { from: '2024-06-01', to: '2024-06-30' })
    })

    const filters = useFilterStore.getState().filters
    const paramsA = buildResolvedParams(widgetABindings, filters)
    const paramsB = buildResolvedParams(widgetBBindings, filters)

    expect(paramsA.queryParams).toEqual({ statusCode: 'active' })
    expect(paramsA.queryParams.startDate).toBeUndefined()

    expect(paramsB.queryParams).toEqual({ startDate: '2024-06-01' })
    expect(paramsB.queryParams.statusCode).toBeUndefined()
  })
})
