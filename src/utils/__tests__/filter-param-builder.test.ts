import { buildResolvedParams } from '../filter-param-builder'
import type { Filter, FilterBinding } from '@/types'

const makeDateFilter = (value: { from: string; to: string } | null = null): Filter => ({
  id: 'date',
  label: 'Date',
  type: 'date-range',
  order: 0,
  defaultValue: undefined,
  value,
})

const makeSelectFilter = (value: string | null = null): Filter => ({
  id: 'status',
  label: 'Status',
  type: 'single-select',
  order: 1,
  options: [{ value: 'active', label: 'Active' }],
  value,
})

const makeMultiFilter = (value: string[] | null = null): Filter => ({
  id: 'region',
  label: 'Region',
  type: 'multi-select',
  order: 2,
  options: [{ value: 'us', label: 'US' }],
  value,
})

const makeTextFilter = (value: string | null = null): Filter => ({
  id: 'search',
  label: 'Search',
  type: 'text-search',
  order: 3,
  debounceMs: 300,
  value,
})

describe('buildResolvedParams', () => {
  describe('date-range filter', () => {
    it('maps from/to fields to separate query params', () => {
      const filters: Filter[] = [makeDateFilter({ from: '2024-01-01', to: '2024-12-31' })]
      const bindings: FilterBinding[] = [
        {
          filterId: 'date',
          paramMappings: [
            { filterField: 'from', paramTarget: 'query', paramName: 'startDate' },
            { filterField: 'to', paramTarget: 'query', paramName: 'endDate' },
          ],
        },
      ]

      const result = buildResolvedParams(bindings, filters)

      expect(result.queryParams).toEqual({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      })
      expect(result.bodyParams).toEqual({})
    })

    it('skips date filter when value is null', () => {
      const filters: Filter[] = [makeDateFilter(null)]
      const bindings: FilterBinding[] = [
        {
          filterId: 'date',
          paramMappings: [{ filterField: 'from', paramTarget: 'query', paramName: 'startDate' }],
        },
      ]

      const result = buildResolvedParams(bindings, filters)
      expect(result.queryParams).toEqual({})
    })

    it('maps date param to body target', () => {
      const filters: Filter[] = [makeDateFilter({ from: '2024-01-01', to: '2024-12-31' })]
      const bindings: FilterBinding[] = [
        {
          filterId: 'date',
          paramMappings: [
            { filterField: 'from', paramTarget: 'body', paramName: 'start' },
          ],
        },
      ]

      const result = buildResolvedParams(bindings, filters)
      expect(result.bodyParams).toEqual({ start: '2024-01-01' })
      expect(result.queryParams).toEqual({})
    })
  })

  describe('single-select filter', () => {
    it('maps selected value to query param', () => {
      const filters: Filter[] = [makeSelectFilter('active')]
      const bindings: FilterBinding[] = [
        {
          filterId: 'status',
          paramMappings: [{ paramTarget: 'query', paramName: 'status' }],
        },
      ]

      const result = buildResolvedParams(bindings, filters)
      expect(result.queryParams).toEqual({ status: 'active' })
    })

    it('skips when value is null', () => {
      const filters: Filter[] = [makeSelectFilter(null)]
      const bindings: FilterBinding[] = [
        {
          filterId: 'status',
          paramMappings: [{ paramTarget: 'query', paramName: 'status' }],
        },
      ]

      expect(buildResolvedParams(bindings, filters).queryParams).toEqual({})
    })
  })

  describe('multi-select filter', () => {
    it('joins values with comma for query params', () => {
      const filters: Filter[] = [makeMultiFilter(['us', 'eu', 'apac'])]
      const bindings: FilterBinding[] = [
        {
          filterId: 'region',
          paramMappings: [{ paramTarget: 'query', paramName: 'regions' }],
        },
      ]

      const result = buildResolvedParams(bindings, filters)
      expect(result.queryParams).toEqual({ regions: 'us,eu,apac' })
    })

    it('skips when value is empty array (null)', () => {
      const filters: Filter[] = [makeMultiFilter(null)]
      const bindings: FilterBinding[] = [
        {
          filterId: 'region',
          paramMappings: [{ paramTarget: 'query', paramName: 'regions' }],
        },
      ]

      expect(buildResolvedParams(bindings, filters).queryParams).toEqual({})
    })
  })

  describe('text-search filter', () => {
    it('maps text value to query param', () => {
      const filters: Filter[] = [makeTextFilter('john')]
      const bindings: FilterBinding[] = [
        {
          filterId: 'search',
          paramMappings: [{ paramTarget: 'query', paramName: 'q' }],
        },
      ]

      expect(buildResolvedParams(bindings, filters).queryParams).toEqual({ q: 'john' })
    })
  })

  describe('multiple filters on one widget', () => {
    it('merges params from all bound filters', () => {
      const filters: Filter[] = [
        makeDateFilter({ from: '2024-01-01', to: '2024-12-31' }),
        makeSelectFilter('active'),
        makeMultiFilter(['us', 'eu']),
      ]
      const bindings: FilterBinding[] = [
        {
          filterId: 'date',
          paramMappings: [
            { filterField: 'from', paramTarget: 'query', paramName: 'startDate' },
            { filterField: 'to', paramTarget: 'query', paramName: 'endDate' },
          ],
        },
        {
          filterId: 'status',
          paramMappings: [{ paramTarget: 'query', paramName: 'status' }],
        },
        {
          filterId: 'region',
          paramMappings: [{ paramTarget: 'body', paramName: 'regions' }],
        },
      ]

      const result = buildResolvedParams(bindings, filters)
      expect(result.queryParams).toEqual({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'active',
      })
      expect(result.bodyParams).toEqual({ regions: 'us,eu' })
    })
  })

  describe('unbound filters', () => {
    it('ignores filters not referenced in bindings', () => {
      const filters: Filter[] = [
        makeSelectFilter('active'),
        makeTextFilter('ignored'),
      ]
      // Only bind status, not search
      const bindings: FilterBinding[] = [
        {
          filterId: 'status',
          paramMappings: [{ paramTarget: 'query', paramName: 'status' }],
        },
      ]

      const result = buildResolvedParams(bindings, filters)
      expect(result.queryParams).toEqual({ status: 'active' })
    })

    it('returns empty params when no bindings', () => {
      const filters: Filter[] = [makeSelectFilter('active')]
      const result = buildResolvedParams([], filters)
      expect(result.queryParams).toEqual({})
      expect(result.bodyParams).toEqual({})
    })
  })
})
