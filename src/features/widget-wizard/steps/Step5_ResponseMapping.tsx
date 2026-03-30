import { Stack, TextInput, Text, Table, Select, Button, ActionIcon, Group } from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import type { FieldMapping, ChartResponseMapping, GridResponseMapping } from '@/types'

const TRANSFORMS = [
  { value: '', label: 'Auto' },
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
]

export function Step5_ResponseMapping() {
  const { draft, updateDraft } = useWidgetWizardStore()
  const type = draft.type
  const mapping = (draft as { responseMapping?: ChartResponseMapping | GridResponseMapping }).responseMapping

  const isChart = type === 'chart'
  const isGrid = type === 'grid'

  const setMapping = (partial: Partial<ChartResponseMapping | GridResponseMapping>) =>
    updateDraft({ responseMapping: { ...mapping, ...partial } as never } as never)

  const setFieldMapping = (idx: number, partial: Partial<FieldMapping>) => {
    const current: FieldMapping[] = mapping?.fieldMappings ?? []
    const next = current.map((fm, i) => (i === idx ? { ...fm, ...partial } : fm))
    setMapping({ fieldMappings: next })
  }

  const addFieldMapping = () => {
    const current: FieldMapping[] = mapping?.fieldMappings ?? []
    setMapping({ fieldMappings: [...current, { sourceField: '', targetField: '' }] })
  }

  const removeFieldMapping = (idx: number) => {
    const current: FieldMapping[] = mapping?.fieldMappings ?? []
    setMapping({ fieldMappings: current.filter((_, i) => i !== idx) })
  }

  return (
    <Stack gap="md">
      <Text fw={600} size="sm">Map API response to widget data</Text>

      {isChart && (
        <>
          <TextInput
            label="Series Path"
            description='JSONPath to series array, e.g. "data.series" or "$.results[*]"'
            placeholder="data.series"
            value={(mapping as ChartResponseMapping)?.seriesPath ?? ''}
            onChange={(e) => setMapping({ seriesPath: e.currentTarget.value } as Partial<ChartResponseMapping>)}
            size="sm"
          />
          <TextInput
            label="Series Name Field"
            placeholder="name"
            value={(mapping as ChartResponseMapping)?.seriesNameField ?? ''}
            onChange={(e) => setMapping({ seriesNameField: e.currentTarget.value } as Partial<ChartResponseMapping>)}
            size="sm"
          />
          <TextInput
            label="Series Data Field"
            placeholder="data"
            value={(mapping as ChartResponseMapping)?.seriesDataField ?? ''}
            onChange={(e) => setMapping({ seriesDataField: e.currentTarget.value } as Partial<ChartResponseMapping>)}
            size="sm"
          />
          <TextInput
            label="Categories Path (optional)"
            placeholder="data.categories"
            value={(mapping as ChartResponseMapping)?.categoriesPath ?? ''}
            onChange={(e) => setMapping({ categoriesPath: e.currentTarget.value } as Partial<ChartResponseMapping>)}
            size="sm"
          />
        </>
      )}

      {isGrid && (
        <TextInput
          label="Rows Path"
          description='Path to rows array, e.g. "data.items"'
          placeholder="data.items"
          value={(mapping as GridResponseMapping)?.rowsPath ?? ''}
          onChange={(e) => setMapping({ rowsPath: e.currentTarget.value } as Partial<GridResponseMapping>)}
          size="sm"
        />
      )}

      <Text size="sm" fw={500}>Field Mappings (optional rename + type coercion)</Text>
      <Table fz="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Source Field</Table.Th>
            <Table.Th>Target Field</Table.Th>
            <Table.Th>Transform</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {(mapping?.fieldMappings ?? []).map((fm, idx) => (
            <Table.Tr key={idx}>
              <Table.Td>
                <TextInput
                  size="xs"
                  placeholder="apiField"
                  value={fm.sourceField}
                  onChange={(e) => setFieldMapping(idx, { sourceField: e.currentTarget.value })}
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  size="xs"
                  placeholder="widgetField"
                  value={fm.targetField}
                  onChange={(e) => setFieldMapping(idx, { targetField: e.currentTarget.value })}
                />
              </Table.Td>
              <Table.Td>
                <Select
                  size="xs"
                  data={TRANSFORMS}
                  value={fm.transform ?? ''}
                  onChange={(v) => setFieldMapping(idx, { transform: (v || undefined) as FieldMapping['transform'] })}
                />
              </Table.Td>
              <Table.Td>
                <ActionIcon variant="subtle" color="red" size="xs" onClick={() => removeFieldMapping(idx)}>
                  <IconTrash size={12} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Group>
        <Button size="xs" variant="subtle" leftSection={<IconPlus size={12} />} onClick={addFieldMapping}>
          Add Mapping
        </Button>
      </Group>
    </Stack>
  )
}
