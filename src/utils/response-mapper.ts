import { JSONPath } from 'jsonpath-plus'
import type { FieldMapping, ResponseMapping, ChartResponseMapping, GridResponseMapping } from '@/types'

export function getByPath(data: unknown, path: string): unknown {
  if (!path || path === '$' || path === '.') return data
  // Support both dot-notation and JSONPath
  const jsonPath = path.startsWith('$') ? path : `$.${path}`
  const result = JSONPath({ path: jsonPath, json: data as object, wrap: false })
  return result
}

function applyFieldMappings(
  item: Record<string, unknown>,
  mappings: FieldMapping[],
): Record<string, unknown> {
  if (!mappings.length) return item
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
    case 'boolean': return Boolean(value)
    case 'date': return new Date(String(value)).toISOString()
    default: return value
  }
}

export function mapGridResponse(
  raw: unknown,
  mapping: GridResponseMapping,
): { rows: Record<string, unknown>[]; totalCount?: number } {
  const rows = (getByPath(raw, mapping.rowsPath) ?? []) as Record<string, unknown>[]
  const mapped = rows.map((item) => applyFieldMappings(item, mapping.fieldMappings))
  const totalCount = mapping.totalCountPath
    ? (getByPath(raw, mapping.totalCountPath) as number | undefined)
    : undefined
  return { rows: mapped, totalCount }
}

export function mapChartResponse(
  raw: unknown,
  mapping: ChartResponseMapping,
): { categories: string[]; series: Array<{ name: string; data: unknown[] }> } {
  const seriesData = (getByPath(raw, mapping.seriesPath) ?? []) as Record<string, unknown>[]
  const categoriesData = mapping.categoriesPath
    ? ((getByPath(raw, mapping.categoriesPath) ?? []) as string[])
    : []

  const mapped = seriesData.map((item) => applyFieldMappings(item, mapping.fieldMappings))
  const series = mapped.map((item) => ({
    name: String(item[mapping.seriesNameField] ?? ''),
    data: item[mapping.seriesDataField] as unknown[],
  }))

  return { categories: categoriesData, series }
}

export function mapGenericResponse(raw: unknown, mapping: ResponseMapping): unknown[] {
  const items = (getByPath(raw, mapping.dataPath) ?? []) as Record<string, unknown>[]
  return items.map((item) => applyFieldMappings(item, mapping.fieldMappings))
}
