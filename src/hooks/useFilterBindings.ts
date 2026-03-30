import { useMemo } from 'react'
import { useFilterStore } from '@/store/filter.store'
import type { FilterBinding, ResolvedFilterParams } from '@/types'

export function useFilterBindings(bindings: FilterBinding[]): ResolvedFilterParams {
  const getFiltersForWidget = useFilterStore((s) => s.getFiltersForWidget)
  const filters = useFilterStore((s) => s.filters)

  return useMemo(
    () => getFiltersForWidget(bindings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, bindings],
  )
}
