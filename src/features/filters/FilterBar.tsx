import { Group, Button, Tooltip } from '@mantine/core'
import { IconFilterOff } from '@tabler/icons-react'
import { useFilterStore } from '@/store/filter.store'
import { DateRangeFilter } from './DateRangeFilter'
import { SingleSelectFilter } from './SingleSelectFilter'
import { MultiSelectFilter } from './MultiSelectFilter'
import { TextSearchFilter } from './TextSearchFilter'
import type { Filter } from '@/types'

export function FilterBar() {
  const filters = useFilterStore((s) => s.filters)
  const resetAllFilters = useFilterStore((s) => s.resetAllFilters)

  if (!filters.length) return null

  const sorted = [...filters].sort((a, b) => a.order - b.order)

  return (
    <Group gap="sm" align="flex-end" wrap="wrap" px="md" py="xs">
      {sorted.map((filter) => (
        <FilterItem key={filter.id} filter={filter} />
      ))}
      <Tooltip label="Clear all filters">
        <Button
          variant="subtle"
          color="gray"
          size="xs"
          leftSection={<IconFilterOff size={14} />}
          onClick={resetAllFilters}
        >
          Clear
        </Button>
      </Tooltip>
    </Group>
  )
}

function FilterItem({ filter }: { filter: Filter }) {
  switch (filter.type) {
    case 'date-range':
      return <DateRangeFilter filter={filter} />
    case 'single-select':
      return <SingleSelectFilter filter={filter} />
    case 'multi-select':
      return <MultiSelectFilter filter={filter} />
    case 'text-search':
      return <TextSearchFilter filter={filter} />
  }
}
