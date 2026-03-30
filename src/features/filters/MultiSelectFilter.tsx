import { MultiSelect } from '@mantine/core'
import { useFilterStore } from '@/store/filter.store'
import type { MultiSelectFilter as MultiSelectFilterType } from '@/types'

interface Props {
  filter: MultiSelectFilterType
}

export function MultiSelectFilter({ filter }: Props) {
  const setFilterValue = useFilterStore((s) => s.setFilterValue)

  return (
    <MultiSelect
      label={filter.label}
      data={filter.options}
      value={filter.value ?? []}
      onChange={(val) => setFilterValue(filter.id, val.length ? val : null)}
      size="xs"
      clearable
      style={{ minWidth: 200 }}
    />
  )
}
