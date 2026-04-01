import { JSONPath } from 'jsonpath-plus'
import type { FieldMapping, ResponseMapping, ChartResponseMapping, GridResponseMapping } from '@/types'
import type { ChartType } from '@/types/chart.types'
import { getChartFamily } from '@/constants/chart-families'

export function getByPath(data: unknown, path: string): unknown {
  if (!path || path === '$' || path === '.') return data
  // Support both dot-notation and JSONPath
  const jsonPath = path.startsWith('$') ? path : `$.${path}`
  const result = JSONPath({ path: jsonPath, json: data as object, wrap: false })
  return result
}

function applyFieldMappings(
  item: Record<string, unknown>,
  mappings: FieldMapping[] | undefined,
): Record<string, unknown> {
  if (!mappings || mappings.length === 0) return item
  const out: Record<string, unknown> = { ...item }
  for (const m of mappings) {
    const raw = item[m.sourceField]
    const coerced = coerce(raw, m.transform)
    out[m.targetField] = coerced
    if (m.sourceField !== m.targetField) {
      delete out[m.sourceField]
    }
  }
  return out
}

function coerce(value: unknown, transform?: FieldMapping['transform']): unknown {
  if (value === null || value === undefined) return value
  switch (transform) {
    case 'number': return Number(value)
    case 'string': return String(value)
    case 'boolean': return value === 'false' || value === 0 || value === '0' ? false : Boolean(value)
    case 'date': return new Date(String(value)).toISOString()
    default: return value
  }
}

export function mapGridResponse(
  raw: unknown,
  mapping: GridResponseMapping,
): { rows: Record<string, unknown>[]; totalCount?: number } {
  const rows = (getByPath(raw, mapping.rowsPath) ?? []) as Record<string, unknown>[]
  const mapped = rows.map((item) => applyFieldMappings(item, mapping.fieldMappings ?? []))
  const totalCount = mapping.totalCountPath
    ? (getByPath(raw, mapping.totalCountPath) as number | undefined)
    : undefined
  return { rows: mapped, totalCount }
}

export function mapChartResponse(
  raw: unknown,
  mapping: ChartResponseMapping,
  chartType?: ChartType,
): { categories: string[]; series: Array<{ name: string; data: unknown[]; yCategories?: string[] }> } {
  const family = chartType ? getChartFamily(chartType) : 'STANDARD'

  // ── GAUGE — extract a single scalar value ─────────────────────────────────
  if (family === 'GAUGE') {
    const valuePath = mapping.gaugeValuePath ?? mapping.seriesDataField
    if (valuePath) {
      const value = getByPath(raw, valuePath) as number
      return {
        categories: [],
        series: [{ name: 'Value', data: [typeof value === 'number' ? value : 0] }],
      }
    }
  }

  // ── HEATMAP — extract xCategories, yCategories, and series data ───────────
  if (family === 'HEATMAP') {
    const xCats = mapping.categoriesPath
      ? ((getByPath(raw, mapping.categoriesPath) ?? []) as string[])
      : []
    const yCats = mapping.yCategoriesPath
      ? ((getByPath(raw, mapping.yCategoriesPath) ?? []) as string[])
      : []
    const seriesArr = (getByPath(raw, mapping.seriesPath) ?? []) as Record<string, unknown>[]
    const series = seriesArr.map((item) => ({
      name:        String(item[mapping.seriesNameField] ?? ''),
      data:        item[mapping.seriesDataField] as unknown[],
      yCategories: yCats,
    }))
    return { categories: xCats, series }
  }

  // ── Standard / PIE / SCATTER / BUBBLE / TREEMAP ───────────────────────────
  const seriesData    = (getByPath(raw, mapping.seriesPath) ?? []) as Record<string, unknown>[]
  const categoriesData = mapping.categoriesPath
    ? ((getByPath(raw, mapping.categoriesPath) ?? []) as string[])
    : []

  const mapped = seriesData.map((item) => applyFieldMappings(item, mapping.fieldMappings ?? []))
  const series = mapped.map((item) => {
    const rawData = item[mapping.seriesDataField]
    return {
      name: String(item[mapping.seriesNameField] ?? ''),
      // Guard: wrong field selection (e.g. a string instead of array) should not crash Highcharts
      data: Array.isArray(rawData) ? (rawData as unknown[]) : [],
    }
  })

  return { categories: categoriesData, series }
}

export function mapGenericResponse(raw: unknown, mapping: ResponseMapping): unknown[] {
  const items = (getByPath(raw, mapping.dataPath) ?? []) as Record<string, unknown>[]
  return items.map((item) => applyFieldMappings(item, mapping.fieldMappings))
}
