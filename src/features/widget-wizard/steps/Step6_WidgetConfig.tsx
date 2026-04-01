import { Stack, Text, Select, Switch, Textarea, NumberInput, Button, ActionIcon, Group, TextInput, Badge, Divider, Box } from '@mantine/core'
import { IconTrash, IconPlus } from '@tabler/icons-react'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import type { ChartConfig, ChartType, GridConfig, GridColumnDef } from '@/types'
import { getChartFamily, CHART_TYPE_META } from '@/constants/chart-families'

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

  const family = getChartFamily(chartConfig.chartType)
  const meta = CHART_TYPE_META[chartConfig.chartType]

  return (
    <Stack gap="md">
      <Text fw={600} size="sm">Chart Configuration</Text>

      <Group gap="xs">
        <Text size="sm" fw={500}>Chart type:</Text>
        <Badge variant="light" color="blue" size="md">
          {meta?.icon} {meta?.label ?? chartConfig.chartType}
        </Badge>
        <Text size="xs" c="dimmed">(set in previous step)</Text>
      </Group>

      {/* ── Universal options ──────────────────────────────────────────── */}
      <TextInput
        label="Chart title"
        placeholder="Leave empty to hide title"
        value={chartConfig.title ?? ''}
        onChange={(e) => set({ title: e.currentTarget.value })}
        size="sm"
      />

      <Group gap="md">
        <NumberInput
          label="Height (px)"
          value={chartConfig.height ?? 300}
          onChange={(v) => set({ height: Number(v) || 300 })}
          min={150} max={800} step={50}
          size="sm" w={120}
        />
        <Switch
          label="Show data labels"
          checked={chartConfig.showDataLabels}
          onChange={(e) => set({ showDataLabels: e.currentTarget.checked })}
          size="sm"
          style={{ marginTop: 24 }}
        />
      </Group>

      <Group gap="md">
        <Switch
          label="Show legend"
          checked={chartConfig.legend?.enabled ?? true}
          onChange={(e) => set({ legend: { ...chartConfig.legend, enabled: e.currentTarget.checked, position: chartConfig.legend?.position ?? 'bottom' } })}
          size="sm"
        />
        {(chartConfig.legend?.enabled ?? true) && (
          <Select
            label="Legend position"
            data={[
              { value: 'top',    label: 'Top'    },
              { value: 'bottom', label: 'Bottom' },
              { value: 'left',   label: 'Left'   },
              { value: 'right',  label: 'Right'  },
            ]}
            value={chartConfig.legend?.position ?? 'bottom'}
            onChange={(v) => set({ legend: { enabled: true, position: (v ?? 'bottom') as ChartConfig['legend']['position'] } })}
            size="sm" w={120}
          />
        )}
      </Group>

      {/* ── STANDARD family: axes + stacking ──────────────────────────── */}
      {family === 'STANDARD' && (
        <>
          <Divider label="Axes" labelPosition="left" />
          <Group gap="md">
            <TextInput
              label="X-axis title"
              placeholder="e.g. Month"
              value={chartConfig.xAxis?.title ?? ''}
              onChange={(e) => set({ xAxis: { ...chartConfig.xAxis, title: e.currentTarget.value } })}
              size="sm" style={{ flex: 1 }}
            />
            <TextInput
              label="Y-axis title"
              placeholder="e.g. Revenue ($)"
              value={chartConfig.yAxis?.title ?? ''}
              onChange={(e) => set({ yAxis: { ...chartConfig.yAxis, title: e.currentTarget.value } })}
              size="sm" style={{ flex: 1 }}
            />
          </Group>
          <Select
            label="Stacking"
            description="Stack series on top of each other"
            data={[
              { value: '',        label: 'None (default)' },
              { value: 'normal',  label: 'Normal — stack by value' },
              { value: 'percent', label: 'Percent — stack to 100%' },
            ]}
            value={chartConfig.stacking ?? ''}
            onChange={(v) => set({ stacking: (v || null) as ChartConfig['stacking'] })}
            size="sm"
          />
          {chartConfig.chartType === 'waterfall' && (
            <>
              <Divider label="Waterfall colours" labelPosition="left" />
              <Group gap="md">
                <Box>
                  <Text size="xs" fw={500} mb={4}>Increase colour</Text>
                  <input
                    type="color"
                    value={chartConfig.waterfall?.upColor ?? '#4CAF50'}
                    onChange={(e) => set({ waterfall: { ...chartConfig.waterfall, upColor: e.currentTarget.value } })}
                    style={{ width: 60, height: 32, border: 'none', cursor: 'pointer' }}
                  />
                </Box>
                <Box>
                  <Text size="xs" fw={500} mb={4}>Decrease colour</Text>
                  <input
                    type="color"
                    value={chartConfig.waterfall?.color ?? '#F44336'}
                    onChange={(e) => set({ waterfall: { ...chartConfig.waterfall, color: e.currentTarget.value } })}
                    style={{ width: 60, height: 32, border: 'none', cursor: 'pointer' }}
                  />
                </Box>
              </Group>
            </>
          )}
        </>
      )}

      {/* ── PIE family: inner size for donut ──────────────────────────── */}
      {family === 'PIE' && (chartConfig.chartType === 'pie' || chartConfig.chartType === 'donut') && (
        <>
          <Divider label="Pie options" labelPosition="left" />
          {chartConfig.chartType === 'donut' && (
            <TextInput
              label="Donut hole size"
              description='How large the hole is. E.g. "50%" for a classic donut.'
              placeholder="50%"
              value={chartConfig.pie?.innerSize ?? '50%'}
              onChange={(e) => set({ pie: { ...chartConfig.pie, innerSize: e.currentTarget.value } })}
              size="sm" w={120}
            />
          )}
          <NumberInput
            label="Start angle (degrees)"
            description="0 = top, 90 = right"
            value={chartConfig.pie?.startAngle ?? 0}
            onChange={(v) => set({ pie: { ...chartConfig.pie, startAngle: Number(v) } })}
            min={0} max={360}
            size="sm" w={160}
          />
        </>
      )}

      {/* ── GAUGE family ──────────────────────────────────────────────── */}
      {family === 'GAUGE' && (
        <>
          <Divider label="Gauge range" labelPosition="left" />
          <Group gap="md">
            <NumberInput
              label="Minimum value"
              value={chartConfig.gauge?.min ?? 0}
              onChange={(v) => set({ gauge: { ...chartConfig.gauge, min: Number(v), max: chartConfig.gauge?.max ?? 100 } })}
              size="sm" w={120}
            />
            <NumberInput
              label="Maximum value"
              value={chartConfig.gauge?.max ?? 100}
              onChange={(v) => set({ gauge: { ...chartConfig.gauge, max: Number(v), min: chartConfig.gauge?.min ?? 0 } })}
              size="sm" w={120}
            />
          </Group>
          <TextInput
            label="Value suffix"
            description='Shown after the value, e.g. "%" or " ms"'
            placeholder="%"
            value={chartConfig.tooltip?.valueSuffix ?? ''}
            onChange={(e) => set({ tooltip: { ...chartConfig.tooltip, enabled: true, valueSuffix: e.currentTarget.value } })}
            size="sm" w={120}
          />
        </>
      )}

      {/* ── HEATMAP family ────────────────────────────────────────────── */}
      {family === 'HEATMAP' && (
        <>
          <Divider label="Colour scale" labelPosition="left" />
          <Group gap="md">
            <Box>
              <Text size="xs" fw={500} mb={4}>Low value colour</Text>
              <input
                type="color"
                value={chartConfig.colorAxis?.minColor ?? '#FFFFFF'}
                onChange={(e) => set({ colorAxis: { ...chartConfig.colorAxis, minColor: e.currentTarget.value } })}
                style={{ width: 60, height: 32, border: 'none', cursor: 'pointer' }}
              />
            </Box>
            <Box>
              <Text size="xs" fw={500} mb={4}>High value colour</Text>
              <input
                type="color"
                value={chartConfig.colorAxis?.maxColor ?? '#003399'}
                onChange={(e) => set({ colorAxis: { ...chartConfig.colorAxis, maxColor: e.currentTarget.value } })}
                style={{ width: 60, height: 32, border: 'none', cursor: 'pointer' }}
              />
            </Box>
          </Group>
        </>
      )}

      {/* ── BUBBLE family ─────────────────────────────────────────────── */}
      {family === 'BUBBLE' && (
        <>
          <Divider label="Bubble size" labelPosition="left" />
          <Group gap="md">
            <NumberInput
              label="Min bubble size (px)"
              value={chartConfig.bubble?.minSize ?? 8}
              onChange={(v) => set({ bubble: { ...chartConfig.bubble, minSize: Number(v), maxSize: chartConfig.bubble?.maxSize ?? 60 } })}
              min={2} max={40}
              size="sm" w={160}
            />
            <NumberInput
              label="Max bubble size (px)"
              value={chartConfig.bubble?.maxSize ?? 60}
              onChange={(v) => set({ bubble: { ...chartConfig.bubble, maxSize: Number(v), minSize: chartConfig.bubble?.minSize ?? 8 } })}
              min={10} max={120}
              size="sm" w={160}
            />
          </Group>
        </>
      )}

      {/* ── TREEMAP family ────────────────────────────────────────────── */}
      {family === 'TREEMAP' && (
        <>
          <Divider label="Treemap layout" labelPosition="left" />
          <Select
            label="Layout algorithm"
            data={[
              { value: 'squarified',    label: 'Squarified (recommended)' },
              { value: 'strip',         label: 'Strip' },
              { value: 'stripes',       label: 'Stripes' },
              { value: 'sliceAndDice',  label: 'Slice and Dice' },
            ]}
            value={'squarified'}
            onChange={() => {}}
            size="sm"
          />
        </>
      )}
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

