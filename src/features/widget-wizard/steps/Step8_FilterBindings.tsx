import { Stack, Text, Checkbox, Paper, Select, TextInput, ActionIcon, Button, Group, Badge } from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { useFilterStore } from '@/store/filter.store'
import type { FilterBinding, FilterParamMapping } from '@/types'

export function Step8_FilterBindings() {
  const { draft, updateDraft } = useWidgetWizardStore()
  const filters = useFilterStore((s) => s.filters)
  const bindings: FilterBinding[] = (draft.filterBindings as FilterBinding[]) ?? []

  const getBinding = (filterId: string) => bindings.find((b) => b.filterId === filterId)

  const toggleFilter = (filterId: string, checked: boolean) => {
    if (checked) {
      updateDraft({ filterBindings: [...bindings, { filterId, paramMappings: [{ paramTarget: 'query', paramName: '' }] }] })
    } else {
      updateDraft({ filterBindings: bindings.filter((b) => b.filterId !== filterId) })
    }
  }

  const updateBinding = (filterId: string, paramMappings: FilterParamMapping[]) => {
    updateDraft({
      filterBindings: bindings.map((b) =>
        b.filterId === filterId ? { ...b, paramMappings } : b,
      ),
    })
  }

  if (!filters.length) {
    return (
      <Stack gap="md">
        <Text fw={600} size="sm">Filter Bindings</Text>
        <Text size="sm" c="dimmed">
          No global filters configured on this dashboard. Add filters from the dashboard editor page.
        </Text>
      </Stack>
    )
  }

  return (
    <Stack gap="md">
      <Text fw={600} size="sm">Filter Bindings</Text>
      <Text size="xs" c="dimmed">
        Select which filters will refresh this widget, and configure how filter values map to API parameters.
      </Text>

      {filters.map((filter) => {
        const binding = getBinding(filter.id)
        const isChecked = !!binding

        return (
          <Paper key={filter.id} withBorder p="sm" radius="sm">
            <Checkbox
              label={<>
                <Text size="sm" fw={500}>{filter.label}</Text>
                <Badge size="xs" variant="dot" color="blue" ml={6}>{filter.type}</Badge>
              </>}
              checked={isChecked}
              onChange={(e) => toggleFilter(filter.id, e.currentTarget.checked)}
              mb={isChecked ? 'sm' : 0}
            />

            {isChecked && binding && (
              <Stack gap="xs" ml="xl">
                <Text size="xs" fw={500} c="dimmed">Param mappings:</Text>
                {binding.paramMappings.map((pm, idx) => (
                  <Group key={idx} gap="xs" wrap="nowrap">
                    {filter.type === 'date-range' && (
                      <Select
                        size="xs"
                        placeholder="Filter field"
                        data={[{ value: 'from', label: 'From date' }, { value: 'to', label: 'To date' }]}
                        value={pm.filterField ?? ''}
                        onChange={(v) => {
                          const next = [...binding.paramMappings]
                          next[idx] = { ...next[idx], filterField: v ?? undefined }
                          updateBinding(filter.id, next)
                        }}
                        style={{ width: 120 }}
                      />
                    )}
                    <TextInput
                      size="xs"
                      placeholder="API param name"
                      value={pm.paramName}
                      onChange={(e) => {
                        const next = [...binding.paramMappings]
                        next[idx] = { ...next[idx], paramName: e.currentTarget.value }
                        updateBinding(filter.id, next)
                      }}
                      style={{ flex: 1 }}
                    />
                    <Select
                      size="xs"
                      data={[{ value: 'query', label: 'Query' }, { value: 'body', label: 'Body' }]}
                      value={pm.paramTarget}
                      onChange={(v) => {
                        const next = [...binding.paramMappings]
                        next[idx] = { ...next[idx], paramTarget: (v ?? 'query') as 'query' | 'body' }
                        updateBinding(filter.id, next)
                      }}
                      style={{ width: 90 }}
                    />
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => updateBinding(filter.id, binding.paramMappings.filter((_, i) => i !== idx))}
                    >
                      <IconTrash size={12} />
                    </ActionIcon>
                  </Group>
                ))}
                <Button
                  size="xs"
                  variant="subtle"
                  leftSection={<IconPlus size={12} />}
                  w="fit-content"
                  onClick={() =>
                    updateBinding(filter.id, [
                      ...binding.paramMappings,
                      { paramTarget: 'query', paramName: '' },
                    ])
                  }
                >
                  Add mapping
                </Button>
              </Stack>
            )}
          </Paper>
        )
      })}
    </Stack>
  )
}
