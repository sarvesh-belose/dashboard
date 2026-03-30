import { DatePickerInput } from '@mantine/dates'
import { useFilterStore } from '@/store/filter.store'
import type { DateRangeFilter as DateRangeFilterType } from '@/types'
import type { DateValue } from '@mantine/dates'

interface Props {
  filter: DateRangeFilterType
}

export function DateRangeFilter({ filter }: Props) {
  const setFilterValue = useFilterStore((s) => s.setFilterValue)

  const value: [DateValue, DateValue] = [
    filter.value?.from ? new Date(filter.value.from) : null,
    filter.value?.to ? new Date(filter.value.to) : null,
  ]

  const handleChange = (val: [DateValue, DateValue]) => {
    if (val[0] && val[1]) {
      setFilterValue(filter.id, {
        from: (val[0] as Date).toISOString(),
        to: (val[1] as Date).toISOString(),
      })
    } else {
      setFilterValue(filter.id, null)
    }
  }

  return (
    <DatePickerInput
      type="range"
      label={filter.label}
      placeholder="Pick date range"
      value={value}
      onChange={handleChange}
      size="xs"
      clearable
      style={{ minWidth: 200 }}
    />
  )
}
