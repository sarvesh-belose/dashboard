import type { FilterType } from '@/types'

export const FILTER_TYPE_LABELS: Record<FilterType, string> = {
  'date-range': 'Date Range',
  'single-select': 'Single Select',
  'multi-select': 'Multi Select',
  'text-search': 'Text Search',
}

export const DEFAULT_DEBOUNCE_MS = 300
