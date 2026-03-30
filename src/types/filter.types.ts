export type FilterType = 'date-range' | 'single-select' | 'multi-select' | 'text-search'

export interface SelectOption {
  label: string
  value: string
}

interface FilterBase {
  id: string
  label: string
  type: FilterType
  order: number
}

export interface DateRangeFilter extends FilterBase {
  type: 'date-range'
  defaultValue?: { from: string; to: string }
  value: { from: string; to: string } | null
}

export interface SingleSelectFilter extends FilterBase {
  type: 'single-select'
  options: SelectOption[]
  defaultValue?: string
  value: string | null
}

export interface MultiSelectFilter extends FilterBase {
  type: 'multi-select'
  options: SelectOption[]
  defaultValue?: string[]
  value: string[] | null
}

export interface TextSearchFilter extends FilterBase {
  type: 'text-search'
  placeholder?: string
  debounceMs: number
  value: string | null
}

export type Filter =
  | DateRangeFilter
  | SingleSelectFilter
  | MultiSelectFilter
  | TextSearchFilter

export type FilterValue =
  | string
  | string[]
  | { from: string; to: string }
  | null

export interface FilterParamMapping {
  filterField?: string // for date-range: 'from' | 'to'
  paramTarget: 'query' | 'body'
  paramName: string
}

export interface FilterBinding {
  filterId: string
  paramMappings: FilterParamMapping[]
}
