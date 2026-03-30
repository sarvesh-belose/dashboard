import { getByPath, mapGridResponse, mapChartResponse, mapGenericResponse } from '../response-mapper'
import type { GridResponseMapping, ChartResponseMapping, ResponseMapping } from '@/types'

const apiResponse = {
  data: {
    items: [
      { id: 1, name: 'Alice', amount: '100', active: 'true' },
      { id: 2, name: 'Bob', amount: '200', active: 'false' },
    ],
    total: 2,
    series: [
      { label: 'Revenue', values: [100, 200, 300] },
      { label: 'Cost', values: [50, 80, 120] },
    ],
    categories: ['Jan', 'Feb', 'Mar'],
  },
}

describe('getByPath', () => {
  it('retrieves nested value via dot-notation', () => {
    expect(getByPath(apiResponse, 'data.total')).toBe(2)
  })

  it('retrieves array via dot-notation', () => {
    const result = getByPath(apiResponse, 'data.items') as unknown[]
    expect(result).toHaveLength(2)
  })

  it('returns entire object when path is empty string', () => {
    expect(getByPath(apiResponse, '')).toBe(apiResponse)
  })

  it('supports JSONPath syntax', () => {
    const result = getByPath(apiResponse, '$.data.total')
    expect(result).toBe(2)
  })
})

describe('mapGridResponse', () => {
  const mapping: GridResponseMapping = {
    rowsPath: 'data.items',
    dataPath: 'data.items',
    fieldMappings: [],
    totalCountPath: 'data.total',
  }

  it('extracts rows from the specified path', () => {
    const result = mapGridResponse(apiResponse, mapping)
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({ id: 1, name: 'Alice' })
  })

  it('extracts total count when totalCountPath is set', () => {
    const result = mapGridResponse(apiResponse, mapping)
    expect(result.totalCount).toBe(2)
  })

  it('applies field mappings — rename and coerce', () => {
    const mappingWithTransform: GridResponseMapping = {
      ...mapping,
      fieldMappings: [
        { sourceField: 'amount', targetField: 'value', transform: 'number' },
        { sourceField: 'active', targetField: 'isActive', transform: 'boolean' },
      ],
    }

    const result = mapGridResponse(apiResponse, mappingWithTransform)
    expect(result.rows[0]).toMatchObject({ value: 100, isActive: true })
    expect(result.rows[1]).toMatchObject({ value: 200, isActive: false })
    // source fields renamed away
    expect(result.rows[0]).not.toHaveProperty('amount')
    expect(result.rows[0]).not.toHaveProperty('active')
  })

  it('returns empty rows for missing path', () => {
    const badMapping: GridResponseMapping = { ...mapping, rowsPath: 'data.missing' }
    const result = mapGridResponse(apiResponse, badMapping)
    expect(result.rows).toEqual([])
  })
})

describe('mapChartResponse', () => {
  const mapping: ChartResponseMapping = {
    seriesPath: 'data.series',
    categoriesPath: 'data.categories',
    seriesNameField: 'label',
    seriesDataField: 'values',
    dataPath: 'data.series',
    fieldMappings: [],
  }

  it('extracts series with name and data', () => {
    const result = mapChartResponse(apiResponse, mapping)
    expect(result.series).toHaveLength(2)
    expect(result.series[0]).toEqual({ name: 'Revenue', data: [100, 200, 300] })
    expect(result.series[1]).toEqual({ name: 'Cost', data: [50, 80, 120] })
  })

  it('extracts categories', () => {
    const result = mapChartResponse(apiResponse, mapping)
    expect(result.categories).toEqual(['Jan', 'Feb', 'Mar'])
  })

  it('returns empty categories when categoriesPath is not set', () => {
    const m: ChartResponseMapping = { ...mapping, categoriesPath: undefined }
    const result = mapChartResponse(apiResponse, m)
    expect(result.categories).toEqual([])
  })
})

describe('mapGenericResponse', () => {
  const mapping: ResponseMapping = {
    dataPath: 'data.items',
    fieldMappings: [{ sourceField: 'name', targetField: 'label' }],
  }

  it('maps fields and returns array', () => {
    const result = mapGenericResponse(apiResponse, mapping) as Array<Record<string, unknown>>
    expect(result[0]).toHaveProperty('label', 'Alice')
    expect(result[0]).not.toHaveProperty('name')
  })
})
