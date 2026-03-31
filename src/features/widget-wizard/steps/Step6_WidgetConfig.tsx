import { Stack, Text, Select, Switch, Textarea, NumberInput, Button, ActionIcon, Group, TextInput, Badge } from '@mantine/core'
import { IconTrash, IconPlus } from '@tabler/icons-react'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import type { ChartConfig, ChartType, GridConfig, GridColumnDef } from '@/types'

const CHART_TYPES: { value: ChartType; label: string; emoji: string }[] = [
  { value: 'line', label: 'Line', emoji: '📈' },
  { value: 'bar', label: 'Bar', emoji: '📊' },
  { value: 'column', label: 'Column', emoji: '📉' },
  { value: 'area', label: 'Area', emoji: '🏔' },
  { value: 'pie', label: 'Pie', emoji: '🥧' },
  { value: 'donut', label: 'Donut', emoji: '🍩' },
  { value: 'scatter', label: 'Scatter', emoji: '✦' },
  { value: 'spline', label: 'Spline', emoji: '〰' },
]

export function Step6_WidgetConfig() {
  const { draft, updateDraft } = useWidgetWizardStore()

  if (draft.type === 'chart') {
    return <ChartConfigPanel />
  }
  if (draft.type === 'grid') {
    return <GridConfigPanel />
  }
  if (draft.type === 'text') {
    return <TextConfigPanel />
  }
  if (draft.type === 'custom') {
    return <CustomConfigPanel />
  }
  return null
}

function ChartConfigPanel() {
  const { draft, updateDraft } = useWidgetWizardStore()
  const chartConfig: ChartConfig = (draft as { chartConfig?: ChartConfig }).chartConfig ?? {
    chartType: 'line',
    showDataLabels: false,
  }

  const set = (partial: Partial<ChartConfig>) =>
    updateDraft({ chartConfig: { ...chartConfig, ...partial } } as never)

  const selectedType = CHART_TYPES.find((ct) => ct.value === chartConfig.chartType)

  return (
    <Stack gap="md">
      <Text fw={600} size="sm">Chart Configuration</Text>

      <Group gap="xs">
        <Text size="sm" fw={500}>Chart type:</Text>
        <Badge variant="light" color="blue" size="md">
          {selectedType?.emoji} {selectedType?.label ?? chartConfig.chartType}
        </Badge>
        <Text size="xs" c="dimmed">(set in previous step)</Text>
      </Group>

      <Switch
        label="Show data labels"
        checked={chartConfig.showDataLabels}
        onChange={(e) => set({ showDataLabels: e.currentTarget.checked })}
        size="sm"
      />

      <Select
        label="Stacking"
        data={[{ value: '', label: 'None' }, { value: 'normal', label: 'Normal' }, { value: 'percent', label: 'Percent' }]}
        value={chartConfig.stacking ?? ''}
        onChange={(v) => set({ stacking: (v || null) as ChartConfig['stacking'] })}
        size="sm"
        w={160}
      />
    </Stack>
  )
}

function GridConfigPanel() {
  const { draft, updateDraft } = useWidgetWizardStore()
  const gridConfig: GridConfig = (draft as { gridConfig?: GridConfig }).gridConfig ?? {
    columnDefs: [],
    pagination: true,
    pageSize: 10,
    serverSidePagination: false,
    rowSelection: 'none',
    enableExport: false,
  }

  const setConfig = (partial: Partial<GridConfig>) =>
    updateDraft({ gridConfig: { ...gridConfig, ...partial } } as never)

  const setCol = (idx: number, partial: Partial<GridColumnDef>) => {
    const cols = [...gridConfig.columnDefs]
    cols[idx] = { ...cols[idx], ...partial }
    setConfig({ columnDefs: cols })
  }

  const addCol = () => {
    setConfig({
      columnDefs: [
        ...gridConfig.columnDefs,
        { field: '', headerName: '', sortable: true, filterable: true },
      ],
    })
  }

  const removeCol = (idx: number) => {
    setConfig({ columnDefs: gridConfig.columnDefs.filter((_, i) => i !== idx) })
  }

  return (
    <Stack gap="md">
      <Text fw={600} size="sm">Grid Configuration</Text>

      <Group>
        <Switch
          label="Pagination"
          checked={gridConfig.pagination}
          onChange={(e) => setConfig({ pagination: e.currentTarget.checked })}
          size="sm"
        />
        {gridConfig.pagination && (
          <NumberInput
            label="Page size"
            value={gridConfig.pageSize}
            onChange={(v) => setConfig({ pageSize: Number(v) })}
            min={5}
            max={100}
            w={100}
            size="xs"
          />
        )}
      </Group>

      <Text size="xs" fw={500}>Columns</Text>
      <Stack gap="xs">
        {gridConfig.columnDefs.map((col, idx) => (
          <Group key={idx} gap="xs" wrap="nowrap">
            <TextInput
              placeholder="field"
              value={col.field}
              onChange={(e) => setCol(idx, { field: e.currentTarget.value })}
              size="xs"
              style={{ flex: 1 }}
            />
            <TextInput
              placeholder="Header"
              value={col.headerName}
              onChange={(e) => setCol(idx, { headerName: e.currentTarget.value })}
              size="xs"
              style={{ flex: 1 }}
            />
            <Switch
              label="Sort"
              checked={col.sortable}
              onChange={(e) => setCol(idx, { sortable: e.currentTarget.checked })}
              size="xs"
            />
            <ActionIcon variant="subtle" color="red" size="xs" onClick={() => removeCol(idx)}>
              <IconTrash size={12} />
            </ActionIcon>
          </Group>
        ))}
        <Button size="xs" variant="subtle" leftSection={<IconPlus size={12} />} onClick={addCol} w="fit-content">
          Add Column
        </Button>
      </Stack>
    </Stack>
  )
}

function TextConfigPanel() {
  const { draft, updateDraft } = useWidgetWizardStore()
  const content = (draft as { textConfig?: { content: string } }).textConfig?.content ?? ''

  return (
    <Stack gap="md">
      <Text fw={600} size="sm">Text / Markdown Content</Text>
      <Text size="xs" c="dimmed">
        Supports Markdown. Use {'{{filterId}}'} to interpolate current filter values.
      </Text>
      <Textarea
        placeholder="## Hello\n\nSelected date: {{dateFilter}}"
        value={content}
        onChange={(e) =>
          updateDraft({ textConfig: { content: e.currentTarget.value } } as never)
        }
        rows={10}
        styles={{ input: { fontFamily: 'monospace', fontSize: 13 } }}
      />
    </Stack>
  )
}

function CustomConfigPanel() {
  const { draft, updateDraft } = useWidgetWizardStore()
  const componentKey = (draft as { componentKey?: string }).componentKey ?? ''

  return (
    <Stack gap="md">
      <Text fw={600} size="sm">Custom Component</Text>
      <TextInput
        label="Component Key"
        description="The key used to register your component via registerCustomComponent()"
        placeholder="my-custom-chart"
        value={componentKey}
        onChange={(e) => updateDraft({ componentKey: e.currentTarget.value } as never)}
        size="sm"
      />
    </Stack>
  )
}

