import { Select } from '@mantine/core'
import { useFilterStore } from '@/store/filter.store'
import type { SingleSelectFilter as SingleSelectFilterType } from '@/types'

interface Props {
  filter: SingleSelectFilterType
}

export function SingleSelectFilter({ filter }: Props) {
  const setFilterValue = useFilterStore((s) => s.setFilterValue)

  return (
    <Select
      label={filter.label}
      data={filter.options}
      value={filter.value}
      onChange={(val) => setFilterValue(filter.id, val)}
      size="xs"
      clearable
      style={{ minWidth: 160 }}
    />
  )
}
