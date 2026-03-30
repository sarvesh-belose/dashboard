import type { Filter, FilterBinding, FilterValue, ResolvedFilterParams } from '@/types'

export function buildResolvedParams(
  filterBindings: FilterBinding[],
  filters: Filter[],
): ResolvedFilterParams {
  const queryParams: Record<string, string> = {}
  const bodyParams: Record<string, unknown> = {}

  for (const binding of filterBindings) {
    const filter = filters.find((f) => f.id === binding.filterId)
    if (!filter || filter.value === null) continue

    for (const mapping of binding.paramMappings) {
      const value = resolveFilterValue(filter, mapping.filterField)
      if (value === undefined || value === null) continue

      if (mapping.paramTarget === 'query') {
        queryParams[mapping.paramName] = String(value)
      } else {
        bodyParams[mapping.paramName] = value
      }
    }
  }

  return { queryParams, bodyParams }
}

function resolveFilterValue(
  filter: Filter,
  filterField?: string,
): FilterValue | string | undefined {
  if (filter.type === 'date-range') {
    if (!filterField || !filter.value) return undefined
    return filter.value[filterField as 'from' | 'to'] ?? undefined
  }

  if (filter.type === 'multi-select') {
    return filter.value?.join(',') ?? undefined
  }

  return filter.value as string | null | undefined
}
