import { useState } from 'react'
import {
  Stack, TextInput, Text, Table, Select, Button, ActionIcon,
  Group, Grid, ScrollArea, Alert, Badge, Tooltip, Paper,
  Divider, Card, ThemeIcon, SimpleGrid, Box, Code,
} from '@mantine/core'
import {
  IconPlus, IconTrash, IconWand, IconAlertCircle, IconCircleCheck,
  IconAlertTriangle, IconGripVertical, IconInfoCircle,
} from '@tabler/icons-react'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { useWizardValidation } from '../WizardValidationContext'
import {
  extractPaths, validateSeriesPath, validateCategoriesPath, validateRowsPath,
  type PathNode, type ValidationResult,
} from '@/utils/response-path-extractor'
import type { FieldMapping, ChartResponseMapping, GridResponseMapping, ChartConfig, ChartType } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRANSFORMS = [
  { value: '',        label: 'Auto'    },
  { value: 'string',  label: 'String'  },
  { value: 'number',  label: 'Number'  },
  { value: 'date',    label: 'Date'    },
  { value: 'boolean', label: 'Boolean' },
]

const CHART_TYPES: { value: ChartType; label: string; icon: string }[] = [
  { value: 'line',    label: 'Line',    icon: '📈' },
  { value: 'bar',     label: 'Bar',     icon: '📊' },
  { value: 'column',  label: 'Column',  icon: '📉' },
  { value: 'area',    label: 'Area',    icon: '🏔'  },
  { value: 'pie',     label: 'Pie',     icon: '🥧' },
  { value: 'donut',   label: 'Donut',   icon: '🍩' },
  { value: 'scatter', label: 'Scatter', icon: '✦'  },
  { value: 'spline',  label: 'Spline',  icon: '〰'  },
]

const PIE_TYPES: ChartType[] = ['pie', 'donut']

// ---------------------------------------------------------------------------
// Expected JSON structure per chart family
// ---------------------------------------------------------------------------

function ExpectedStructure({ chartType }: { chartType: ChartType }) {
  const isPie = PIE_TYPES.includes(chartType)

  if (isPie) {
    return (
      <Stack gap={4}>
        <Group gap={6}>
          <IconInfoCircle size={14} />
          <Text size="xs" fw={600}>Expected JSON for {chartType}</Text>
        </Group>
        <Code block fz={11} style={{ whiteSpace: 'pre' }}>{`{
  "data": {
    "series": [
      {
        "name": "Market Share",
        "data": [
          { "name": "Chrome",  "y": 61 },
          { "name": "Firefox", "y": 17 },
          { "name": "Safari",  "y": 10 }
        ]
      }
    ]
  }
}

Series Path  →  data.series
Name Field   →  name         (label for the series)
Data Field   →  data         (array of {name, y} points)
Note: Categories are NOT used for pie/donut.`}</Code>
      </Stack>
    )
  }

  return (
    <Stack gap={4}>
      <Group gap={6}>
        <IconInfoCircle size={14} />
        <Text size="xs" fw={600}>Expected JSON for {chartType}</Text>
      </Group>
      <Code block fz={11} style={{ whiteSpace: 'pre' }}>{`{
  "data": {
    "series": [
      { "name": "Revenue",  "data": [120, 135, 162] },
      { "name": "Expenses", "data": [85,  92,  105] }
    ],
    "categories": ["Jan", "Feb", "Mar"]
  }
}

Series Path      →  data.series
Name Field       →  name        (series label)
Data Field       →  data        (array of numbers)
Categories Path  →  data.categories  (x-axis labels)`}</Code>
    </Stack>
  )
}

// ---------------------------------------------------------------------------
// Validation badge
// ---------------------------------------------------------------------------

function ValidationBadge({ result }: { result: ValidationResult | null }) {
  if (!result) return null
  if (!result.ok) return (
    <Group gap={4} mt={2}>
      <ThemeIcon color="red" size="xs" variant="transparent"><IconAlertCircle size={12} /></ThemeIcon>
      <Text size="xs" c="red">{result.message}</Text>
    </Group>
  )
  if (result.warning) return (
    <Group gap={4} mt={2}>
      <ThemeIcon color="yellow" size="xs" variant="transparent"><IconAlertTriangle size={12} /></ThemeIcon>
      <Text size="xs" c="yellow.7">{result.message}</Text>
    </Group>
  )
  return (
    <Group gap={4} mt={2}>
      <ThemeIcon color="green" size="xs" variant="transparent"><IconCircleCheck size={12} /></ThemeIcon>
      <Text size="xs" c="green">{result.message}</Text>
    </Group>
  )
}

// ---------------------------------------------------------------------------
// Droppable path input
// ---------------------------------------------------------------------------

interface DroppableInputProps {
  label: string
  description?: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  validation: ValidationResult | null
  required?: boolean
  showError?: boolean
}

function DroppableInput({ label, description, placeholder, value, onChange, validation, required, showError }: DroppableInputProps) {
  const [dragOver, setDragOver] = useState(false)
  const emptyError = showError && required && !value.trim() ? `${label} is required.` : undefined

  return (
    <Box>
      <TextInput
        label={label}
        description={description}
        placeholder={placeholder}
        value={value}
        required={required}
        error={emptyError}
        onChange={(e) => onChange(e.currentTarget.value)}
        size="sm"
        styles={{
          input: {
            borderColor: dragOver ? 'var(--mantine-color-blue-5)' : undefined,
            backgroundColor: dragOver ? 'var(--mantine-color-blue-0)' : undefined,
            transition: 'border-color 0.15s, background-color 0.15s',
          },
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const path = e.dataTransfer.getData('text/plain')
          if (path) onChange(path)
        }}
        rightSection={dragOver
          ? <Text size="xs" c="blue" style={{ whiteSpace: 'nowrap', paddingRight: 4 }}>Drop here</Text>
          : null}
        rightSectionWidth={80}
      />
      {/* Validation feedback (only if no empty-error shown) */}
      {!emptyError && <ValidationBadge result={validation} />}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Path explorer (right panel)
// ---------------------------------------------------------------------------

function PathChip({ node, color }: { node: PathNode; color: string }) {
  return (
    <Paper
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', node.path.replace(/\[\*\]/g, ''))
        e.dataTransfer.effectAllowed = 'copy'
      }}
      withBorder p={6}
      style={{ cursor: 'grab', userSelect: 'none' }}
    >
      <Group gap="xs" wrap="nowrap">
        <IconGripVertical size={12} style={{ color: 'var(--mantine-color-dimmed)', flexShrink: 0 }} />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap={4} wrap="nowrap">
            <Text size="xs" ff="monospace" style={{ wordBreak: 'break-all' }}>{node.path}</Text>
            <Badge size="xs" color={color} variant="light" style={{ flexShrink: 0 }}>
              {node.type === 'array-of-objects' ? 'obj[]'
                : node.type === 'array-of-primitives' ? 'val[]'
                : node.type}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed" truncate>{node.preview}</Text>
        </Box>
      </Group>
    </Paper>
  )
}

function PathExplorer({ paths }: { paths: PathNode[] }) {
  const objPaths  = paths.filter((p) => p.type === 'array-of-objects')
  const valPaths  = paths.filter((p) => p.type === 'array-of-primitives')
  const otherPaths = paths.filter((p) => !['array-of-objects', 'array-of-primitives'].includes(p.type) && p.path !== '(root)')

  if (paths.length === 0) return (
    <Text size="xs" c="dimmed" ta="center" mt="xl">No paths extracted yet.</Text>
  )

  return (
    <Stack gap="sm">
      {objPaths.length > 0 && (
        <Stack gap={4}>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">Arrays of objects</Text>
          <Text size="xs" c="dimmed">Good for: Series path, Rows path</Text>
          {objPaths.map((p) => <PathChip key={p.path} node={p} color="blue" />)}
        </Stack>
      )}
      {valPaths.length > 0 && (
        <Stack gap={4}>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">Arrays of values</Text>
          <Text size="xs" c="dimmed">Good for: Categories path</Text>
          {valPaths.map((p) => <PathChip key={p.path} node={p} color="teal" />)}
        </Stack>
      )}
      {otherPaths.length > 0 && (
        <Stack gap={4}>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">Other paths</Text>
          {otherPaths.slice(0, 10).map((p) => <PathChip key={p.path} node={p} color="gray" />)}
        </Stack>
      )}
    </Stack>
  )
}

// ---------------------------------------------------------------------------
// Auto-detect helpers
// ---------------------------------------------------------------------------

function findFirstArrayOfObjects(obj: unknown, prefix = '', depth = 0): { path: string; rows: Record<string, unknown>[] } | null {
  if (depth > 5) return null
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null)
    return { path: prefix, rows: obj as Record<string, unknown>[] }
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const hit = findFirstArrayOfObjects(val, prefix ? `${prefix}.${key}` : key, depth + 1)
      if (hit) return hit
    }
  }
  return null
}

function findSeriesPath(obj: unknown, prefix = '', depth = 0): string | null {
  if (depth > 5) return null
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object' && 'data' in (obj[0] as object)) return prefix
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const hit = findSeriesPath(val, prefix ? `${prefix}.${key}` : key, depth + 1)
      if (hit) return hit
    }
  }
  return null
}

function findCategoriesPath(obj: unknown, prefix = '', depth = 0): string | null {
  if (depth > 5) return null
  if (Array.isArray(obj) && obj.length > 0 && (typeof obj[0] === 'string' || typeof obj[0] === 'number')) return prefix
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    for (const key of ['categories', 'labels', 'xAxis', ...Object.keys(obj as object)]) {
      if (!(key in (obj as object))) continue
      const hit = findCategoriesPath((obj as Record<string, unknown>)[key], prefix ? `${prefix}.${key}` : key, depth + 1)
      if (hit) return hit
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Step5_ResponseMapping() {
  const { draft, updateDraft, apiPreviewResponse } = useWidgetWizardStore()
  const { showErrors } = useWizardValidation()

  const type = draft.type
  const mapping = (draft as { responseMapping?: ChartResponseMapping | GridResponseMapping }).responseMapping
  const chartConfig: ChartConfig = (draft as { chartConfig?: ChartConfig }).chartConfig ?? { chartType: 'line', showDataLabels: false }

  const isChart = type === 'chart'
  const isGrid  = type === 'grid'
  const hasResponse = apiPreviewResponse !== null && apiPreviewResponse !== undefined
  const chartType = chartConfig.chartType ?? 'line'
  const isPie = PIE_TYPES.includes(chartType)

  const paths = hasResponse ? extractPaths(apiPreviewResponse) : []

  // ── Helpers ───────────────────────────────────────────────────────────────

  const setMapping = (partial: Partial<ChartResponseMapping | GridResponseMapping>) =>
    updateDraft({ responseMapping: { ...mapping, ...partial } as never } as never)

  const setChartType = (ct: ChartType) =>
    updateDraft({ chartConfig: { ...chartConfig, chartType: ct } } as never)

  const setFieldMapping = (idx: number, partial: Partial<FieldMapping>) => {
    const current: FieldMapping[] = mapping?.fieldMappings ?? []
    setMapping({ fieldMappings: current.map((fm, i) => (i === idx ? { ...fm, ...partial } : fm)) })
  }

  const addFieldMapping = () =>
    setMapping({ fieldMappings: [...(mapping?.fieldMappings ?? []), { sourceField: '', targetField: '' }] })

  const removeFieldMapping = (idx: number) =>
    setMapping({ fieldMappings: (mapping?.fieldMappings ?? []).filter((_, i) => i !== idx) })

  // ── Validation ────────────────────────────────────────────────────────────

  const seriesValidation: ValidationResult | null = hasResponse && isChart
    ? validateSeriesPath(apiPreviewResponse, (mapping as ChartResponseMapping)?.seriesPath ?? '', chartType)
    : null

  const categoriesValidation: ValidationResult | null = hasResponse && isChart && !isPie
    ? validateCategoriesPath(apiPreviewResponse, (mapping as ChartResponseMapping)?.categoriesPath ?? '')
    : null

  const rowsValidation: ValidationResult | null = hasResponse && isGrid
    ? validateRowsPath(apiPreviewResponse, (mapping as GridResponseMapping)?.rowsPath ?? '')
    : null

  // ── Auto-detect ───────────────────────────────────────────────────────────

  const autoDetect = () => {
    if (!hasResponse) return
    if (isChart) {
      const seriesPath = findSeriesPath(apiPreviewResponse) ?? ''
      const categoriesPath = isPie ? '' : (findCategoriesPath(apiPreviewResponse) ?? '')
      const update: Partial<ChartResponseMapping> = { seriesPath, categoriesPath }
      if (seriesPath) {
        const arr = seriesPath.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], apiPreviewResponse)
        if (Array.isArray(arr) && arr.length > 0) {
          const first = arr[0] as Record<string, unknown>
          if ('name' in first) update.seriesNameField = 'name'
          if ('data' in first) update.seriesDataField = 'data'
        }
      }
      setMapping(update)
    }
    if (isGrid) {
      const found = findFirstArrayOfObjects(apiPreviewResponse)
      if (!found) return
      const fields: FieldMapping[] = Object.keys(found.rows[0]).map((key) => {
        const sample = found.rows[0][key]
        let transform: FieldMapping['transform']
        if (typeof sample === 'number') transform = 'number'
        else if (typeof sample === 'boolean') transform = 'boolean'
        else if (typeof sample === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sample)) transform = 'date'
        return { sourceField: key, targetField: key, transform }
      })
      setMapping({ rowsPath: found.path, fieldMappings: fields })
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const chartMapping = mapping as ChartResponseMapping | undefined
  const gridMapping  = mapping as GridResponseMapping  | undefined

  return (
    <Grid gutter="md">

      {/* ── LEFT: mapping form ──────────────────────────────────────── */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Stack gap="sm">

          {/* 1. Chart type picker — must be chosen before paths so validation is accurate */}
          {isChart && (
            <>
              <Text fw={600} size="sm">1. Choose chart type</Text>
              <SimpleGrid cols={4} spacing={6}>
                {CHART_TYPES.map((ct) => (
                  <Card
                    key={ct.value}
                    withBorder padding={6}
                    style={{
                      cursor: 'pointer', textAlign: 'center',
                      borderColor: chartType === ct.value ? 'var(--mantine-color-blue-6)' : undefined,
                      background:  chartType === ct.value ? 'var(--mantine-color-blue-0)' : undefined,
                    }}
                    onClick={() => setChartType(ct.value)}
                  >
                    <Text size="md">{ct.icon}</Text>
                    <Text size="xs">{ct.label}</Text>
                  </Card>
                ))}
              </SimpleGrid>
              <Divider />
            </>
          )}

          {/* 2. Paths */}
          <Group justify="space-between" align="center">
            <Text fw={600} size="sm">{isChart ? '2. Map response paths' : 'Map response paths'}</Text>
            <Tooltip
              label={!hasResponse ? 'Run the API test in Step 4 first' : 'Auto-fill paths and fields from the response'}
              withArrow
            >
              <Button size="xs" variant="light" leftSection={<IconWand size={14} />} onClick={autoDetect} disabled={!hasResponse}>
                Auto-detect
              </Button>
            </Tooltip>
          </Group>

          {!hasResponse ? (
            <Alert icon={<IconAlertCircle size={14} />} color="yellow" p="xs">
              No test response yet. Go back to Step 4 and run the request — then use Auto-detect.
            </Alert>
          ) : (
            <Alert icon={<IconCircleCheck size={14} />} color="green" p="xs">
              Response available. <strong>Drag</strong> a path chip from the right, or click <strong>Auto-detect</strong>.
            </Alert>
          )}

          {/* Chart paths — different fields for pie/donut vs others */}
          {isChart && (
            <>
              <DroppableInput
                label="Series Array Path"
                description={isPie
                  ? 'Path to series array. Each item needs a "data" field with [{name, y}] points.'
                  : 'Path to series array. Each item needs "name" and "data" (array of numbers).'}
                placeholder="data.series"
                value={chartMapping?.seriesPath ?? ''}
                onChange={(v) => setMapping({ seriesPath: v } as Partial<ChartResponseMapping>)}
                validation={seriesValidation}
                required
                showError={showErrors}
              />
              <TextInput
                label="Series Name Field"
                description="Field inside each series object that holds the series label."
                placeholder="name"
                value={chartMapping?.seriesNameField ?? ''}
                onChange={(e) => setMapping({ seriesNameField: e.currentTarget.value } as Partial<ChartResponseMapping>)}
                size="sm"
              />
              <TextInput
                label={isPie ? 'Data Points Field' : 'Series Data Field'}
                description={isPie
                  ? 'Field inside each series object that holds the [{name, y}] points array.'
                  : 'Field inside each series object that holds the array of numbers.'}
                placeholder="data"
                value={chartMapping?.seriesDataField ?? ''}
                onChange={(e) => setMapping({ seriesDataField: e.currentTarget.value } as Partial<ChartResponseMapping>)}
                size="sm"
              />
              {!isPie && (
                <DroppableInput
                  label="Categories Path (optional)"
                  description={'Path to array of x-axis labels e.g. ["Jan","Feb"]. Leave empty for numeric x-axis.'}
                  placeholder="data.categories"
                  value={chartMapping?.categoriesPath ?? ''}
                  onChange={(v) => setMapping({ categoriesPath: v } as Partial<ChartResponseMapping>)}
                  validation={categoriesValidation}
                />
              )}
              {isPie && (
                <Alert icon={<IconInfoCircle size={14} />} color="blue" p="xs">
                  Pie / Donut charts do not use Categories — the slice labels come from the <Code>name</Code> field inside each data point object.
                </Alert>
              )}
            </>
          )}

          {/* Grid paths */}
          {isGrid && (
            <DroppableInput
              label="Rows Path"
              description='Path to the array of row objects, e.g. "data.items".'
              placeholder="data.items"
              value={gridMapping?.rowsPath ?? ''}
              onChange={(v) => setMapping({ rowsPath: v } as Partial<GridResponseMapping>)}
              validation={rowsValidation}
              required
              showError={showErrors}
            />
          )}

          <Divider />

          {/* Field mappings */}
          <Text size="sm" fw={500}>Field Mappings — rename columns and coerce types</Text>
          <Table fz="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Source Field</Table.Th>
                <Table.Th>Display Label</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(mapping?.fieldMappings ?? []).map((fm, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td>
                    <TextInput size="xs" placeholder="apiField" value={fm.sourceField}
                      onChange={(e) => setFieldMapping(idx, { sourceField: e.currentTarget.value })} />
                  </Table.Td>
                  <Table.Td>
                    <TextInput size="xs" placeholder="Column Label" value={fm.targetField}
                      onChange={(e) => setFieldMapping(idx, { targetField: e.currentTarget.value })} />
                  </Table.Td>
                  <Table.Td>
                    <Select size="xs" data={TRANSFORMS} value={fm.transform ?? ''}
                      onChange={(v) => setFieldMapping(idx, { transform: (v || undefined) as FieldMapping['transform'] })} />
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
          <Button size="xs" variant="subtle" leftSection={<IconPlus size={12} />} onClick={addFieldMapping} w="fit-content">
            Add Mapping
          </Button>
        </Stack>
      </Grid.Col>

      {/* ── RIGHT: expected structure + path explorer ───────────────── */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={600} size="sm">Response Paths</Text>
            {hasResponse && <Badge color="green" variant="dot" size="sm">Live from Step 4</Badge>}
          </Group>

          {/* Expected JSON structure — helps user understand what shape is needed */}
          {isChart && (
            <Paper withBorder p="xs" bg="var(--mantine-color-default-hover)">
              <ExpectedStructure chartType={chartType} />
            </Paper>
          )}

          <Text size="xs" c="dimmed">
            {hasResponse
              ? 'Drag a chip onto a path field, or click Auto-detect.'
              : 'Run the API test in Step 4 to see available paths.'}
          </Text>

          {!hasResponse ? (
            <Paper withBorder p="md" style={{ minHeight: 120 }}>
              <Text size="xs" c="dimmed" ta="center" mt="lg">No response yet.</Text>
            </Paper>
          ) : (
            <ScrollArea h={360} style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 4 }} p="xs">
              <PathExplorer paths={paths} />
            </ScrollArea>
          )}
        </Stack>
      </Grid.Col>
    </Grid>
  )
}
