import { useState, useEffect } from 'react'
import { TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useFilterStore } from '@/store/filter.store'
import type { TextSearchFilter as TextSearchFilterType } from '@/types'
import { DEFAULT_DEBOUNCE_MS } from '@/constants/filter.constants'

interface Props {
  filter: TextSearchFilterType
}

export function TextSearchFilter({ filter }: Props) {
  const setFilterValue = useFilterStore((s) => s.setFilterValue)
  const [localValue, setLocalValue] = useState(filter.value ?? '')
  const debounceMs = filter.debounceMs ?? DEFAULT_DEBOUNCE_MS

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterValue(filter.id, localValue || null)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [localValue, filter.id, debounceMs, setFilterValue])

  return (
    <TextInput
      label={filter.label}
      placeholder={filter.placeholder ?? 'Search…'}
      value={localValue}
      onChange={(e) => setLocalValue(e.currentTarget.value)}
      leftSection={<IconSearch size={14} />}
      size="xs"
      style={{ minWidth: 180 }}
    />
  )
}
