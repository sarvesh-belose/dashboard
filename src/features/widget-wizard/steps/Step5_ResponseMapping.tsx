import { useRef, useState } from 'react'
import {
  Stack, TextInput, Text, Table, Select, Button, ActionIcon,
  Group, Grid, ScrollArea, Alert, Badge, Tooltip, Paper,
  Divider, Card, ThemeIcon, SimpleGrid, Box,
} from '@mantine/core'
import {
  IconPlus, IconTrash, IconWand, IconAlertCircle, IconCircleCheck,
  IconAlertTriangle, IconGripVertical,
} from '@tabler/icons-react'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import {
  extractPaths,
  validateSeriesPath,
  validateCategoriesPath,
  validateRowsPath,
  type PathNode,
  type ValidationResult,
} from '@/utils/response-path-extractor'
import type { FieldMapping, ChartResponseMapping, GridResponseMapping, ChartConfig, ChartType } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRANSFORMS = [
  { value: '', label: 'Auto' },
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
]

const CHART_TYPES: { value: ChartType; label: string; icon: string }[] = [
  { value: 'line',    label: 'Line',    icon: '📈' },
  { value: 'bar',     label: 'Bar',     icon: '📊' },
  { value: 'column',  label: 'Column',  icon: '📉' },
  { value: 'area',    label: 'Area',    icon: '🏔' },
  { value: 'pie',     label: 'Pie',     icon: '🥧' },
  { value: 'donut',   label: 'Donut',   icon: '🍩' },
  { value: 'scatter', label: 'Scatter', icon: '✦' },
  { value: 'spline',  label: 'Spline',  icon: '〰' },
]

// ---------------------------------------------------------------------------
// Validation indicator
// ---------------------------------------------------------------------------

function ValidationBadge({ result }: { result: ValidationResult | null }) {
  if (!result) return null
  if (!result.ok) {
    return (
      <Group gap={4} mt={2}>
        <ThemeIcon color="red" size="xs" variant="transparent">
          <IconAlertCircle size={12} />
        </ThemeIcon>
        <Text size="xs" c="red">{result.message}</Text>
      </Group>
    )
  }
  if (result.warning) {
    return (
      <Group gap={4} mt={2}>
        <ThemeIcon color="yellow" size="xs" variant="transparent">
          <IconAlertTriangle size={12} />
        </ThemeIcon>
        <Text size="xs" c="yellow.7">{result.message}</Text>
      </Group>
    )
  }
  return (
    <Group gap={4} mt={2}>
      <ThemeIcon color="green" size="xs" variant="transparent">
        <IconCircleCheck size={12} />
      </ThemeIcon>
      <Text size="xs" c="green">{result.message}</Text>
    </Group>
  )
}

// ---------------------------------------------------------------------------
// Droppable path input — accepts a path dragged from the explorer
// ---------------------------------------------------------------------------

interface DroppableInputProps {
  label: string
  description?: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  validation: ValidationResult | null
}

function DroppableInput({ label, description, placeholder, value, onChange, validation }: DroppableInputProps) {
  const [dragOver, setDragOver] = useState(false)

  return (
    <Box>
      <TextInput
        label={label}
        description={description}
        placeholder={placeholder}
        value={value}
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
        rightSection={
          dragOver ? (
            <Text size="xs" c="blue" style={{ whiteSpace: 'nowrap', paddingRight: 4 }}>Drop here</Text>
          ) : null
        }
        rightSectionWidth={80}
      />
      <ValidationBadge result={validation} />
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Path Explorer — right panel
// ---------------------------------------------------------------------------

function PathExplorer({ paths }: { paths: PathNode[] }) {
  const groups = {
    objects: paths.filter((p) => p.type === 'array-of-objects'),
    primitives: paths.filter((p) => p.type === 'array-of-primitives'),
    other: paths.filter((p) => !['array-of-objects', 'array-of-primitives'].includes(p.type) && p.path !== '(root)'),
  }

  if (paths.length === 0) {
    return <Text size="xs" c="dimmed" ta="center" mt="xl">No paths extracted</Text>
  }

  return (
    <Stack gap="sm">
      {groups.objects.length > 0 && (
        <Stack gap={4}>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">Arrays of objects</Text>
          <Text size="xs" c="dimmed">Good for: Series path, Rows path</Text>
          {groups.objects.map((p) => <PathChip key={p.path} node={p} color="blue" />)}
        </Stack>
      )}
      {groups.primitives.length > 0 && (
        <Stack gap={4}>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">Arrays of values</Text>
          <Text size="xs" c="dimmed">Good for: Categories path</Text>
          {groups.primitives.map((p) => <PathChip key={p.path} node={p} color="teal" />)}
        </Stack>
      )}
      {groups.other.length > 0 && (
        <Stack gap={4}>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">Other paths</Text>
          {groups.other.slice(0, 12).map((p) => <PathChip key={p.path} node={p} color="gray" />)}
        </Stack>
      )}
    </Stack>
  )
}

function PathChip({ node, color }: { node: PathNode; color: string }) {
  const handleDragStart = (e: React.DragEvent) => {
    // Strip [*] wildcards when dropping into a simple dot-path input
    const cleanPath = node.path.replace(/\[\*\]/g, '')
    e.dataTransfer.setData('text/plain', cleanPath)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <Paper
      draggable
      onDragStart={handleDragStart}
      withBorder
      p={6}
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

// ---------------------------------------------------------------------------
// Auto-detect helpers
// ---------------------------------------------------------------------------

function findFirstArrayOfObjects(obj: unknown, prefix = '', depth = 0): { path: string; rows: Record<string, unknown>[] } | null {
  if (depth > 5) return null
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
    return { path: prefix, rows: obj as Record<string, unknown>[] }
  }
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
      const val = (obj as Record<string, unknown>)[key]
      const childPath = prefix ? `${prefix}.${key}` : key
      const hit = findCategoriesPath(val, childPath, depth + 1)
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
  const type = draft.type
  const mapping = (draft as { responseMapping?: ChartResponseMapping | GridResponseMapping }).responseMapping
  const chartConfig: ChartConfig = (draft as { chartConfig?: ChartConfig }).chartConfig ?? { chartType: 'line', showDataLabels: false }

  const isChart = type === 'chart'
  const isGrid = type === 'grid'
  const hasResponse = apiPreviewResponse !== null && apiPreviewResponse !== undefined
  const chartType = chartConfig.chartType ?? 'line'

  const paths = hasResponse ? extractPaths(apiPreviewResponse) : []

  // ── Mapping helpers ──────────────────────────────────────────────────────

  const setMapping = (partial: Partial<ChartResponseMapping | GridResponseMapping>) =>
    updateDraft({ responseMapping: { ...mapping, ...partial } as never } as never)

  const setChartType = (ct: ChartType) =>
    updateDraft({ chartConfig: { ...chartConfig, chartType: ct } } as never)

  const setFieldMapping = (idx: number, partial: Partial<FieldMapping>) => {
    const current: FieldMapping[] = mapping?.fieldMappings ?? []
    setMapping({ fieldMappings: current.map((fm, i) => (i === idx ? { ...fm, ...partial } : fm)) })
  }

  const addFieldMapping = () => {
    setMapping({ fieldMappings: [...(mapping?.fieldMappings ?? []), { sourceField: '', targetField: '' }] })
  }

  const removeFieldMapping = (idx: number) => {
    setMapping({ fieldMappings: (mapping?.fieldMappings ?? []).filter((_, i) => i !== idx) })
  }

  // ── Validation ───────────────────────────────────────────────────────────

  const seriesValidation: ValidationResult | null = hasResponse && isChart
    ? validateSeriesPath(apiPreviewResponse, (mapping as ChartResponseMapping)?.seriesPath ?? '', chartType)
    : null

  const categoriesValidation: ValidationResult | null = hasResponse && isChart
    ? validateCategoriesPath(apiPreviewResponse, (mapping as ChartResponseMapping)?.categoriesPath ?? '')
    : null

  const rowsValidation: ValidationResult | null = hasResponse && isGrid
    ? validateRowsPath(apiPreviewResponse, (mapping as GridResponseMapping)?.rowsPath ?? '')
    : null

  // ── Auto-detect ──────────────────────────────────────────────────────────

  const autoDetect = () => {
    if (!hasResponse) return

    if (isChart) {
      const seriesPath = findSeriesPath(apiPreviewResponse) ?? ''
      const categoriesPath = findCategoriesPath(apiPreviewResponse) ?? ''
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
        let transform: FieldMapping['transform'] = undefined
        if (typeof sample === 'number') transform = 'number'
        else if (typeof sample === 'boolean') transform = 'boolean'
        else if (typeof sample === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sample)) transform = 'date'
        return { sourceField: key, targetField: key, transform }
      })
      setMapping({ rowsPath: found.path, fieldMappings: fields })
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Grid gutter="md">
      {/* ── Left: mapping form ─────────────────────────────────────── */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Stack gap="sm">

          {/* Chart type picker — must come first so validation is accurate */}
          {isChart && (
            <>
              <Text fw={600} size="sm">1. Choose chart type first</Text>
              <SimpleGrid cols={4} spacing={6}>
                {CHART_TYPES.map((ct) => (
                  <Card
                    key={ct.value}
                    withBorder
                    padding={6}
                    style={{
                      cursor: 'pointer',
                      textAlign: 'center',
                      borderColor: chartType === ct.value ? 'var(--mantine-color-blue-6)' : undefined,
                      background: chartType === ct.value ? 'var(--mantine-color-blue-0)' : undefined,
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

          <Group justify="space-between" align="center">
            <Text fw={600} size="sm">{isChart ? '2. Map response paths' : 'Map response paths'}</Text>
            <Tooltip
              label={!hasResponse ? 'Run the API test in step 4 first' : 'Auto-fill paths and field names from the response'}
              withArrow
            >
              <Button
                size="xs"
                variant="light"
                leftSection={<IconWand size={14} />}
                onClick={autoDetect}
                disabled={!hasResponse}
              >
                Auto-detect
              </Button>
            </Tooltip>
          </Group>

          {!hasResponse ? (
            <Alert icon={<IconAlertCircle size={14} />} color="yellow" p="xs">
              No test response yet — go back to Step 4 and run the request.
              You can still configure paths manually.
            </Alert>
          ) : (
            <Alert icon={<IconCircleCheck size={14} />} color="green" p="xs">
              Response available. <strong>Drag</strong> paths from the right panel or click <strong>Auto-detect</strong>.
            </Alert>
          )}

          {isChart && (
            <>
              <DroppableInput
                label="Series Path"
                description='Path to the series array — e.g. "data.series"'
                placeholder="data.series"
                value={(mapping as ChartResponseMapping)?.seriesPath ?? ''}
                onChange={(v) => setMapping({ seriesPath: v } as Partial<ChartResponseMapping>)}
                validation={seriesValidation}
              />
              <DroppableInput
                label="Series Name Field"
                placeholder="name"
                value={(mapping as ChartResponseMapping)?.seriesNameField ?? ''}
                onChange={(v) => setMapping({ seriesNameField: v } as Partial<ChartResponseMapping>)}
                validation={null}
              />
              <DroppableInput
                label="Series Data Field"
                placeholder="data"
                value={(mapping as ChartResponseMapping)?.seriesDataField ?? ''}
                onChange={(v) => setMapping({ seriesDataField: v } as Partial<ChartResponseMapping>)}
                validation={null}
              />
              <DroppableInput
                label="Categories Path (optional)"
                description='Array of x-axis labels — e.g. "data.categories"'
                placeholder="data.categories"
                value={(mapping as ChartResponseMapping)?.categoriesPath ?? ''}
                onChange={(v) => setMapping({ categoriesPath: v } as Partial<ChartResponseMapping>)}
                validation={categoriesValidation}
              />
            </>
          )}

          {isGrid && (
            <DroppableInput
              label="Rows Path"
              description='Path to the array of row objects — e.g. "data.items"'
              placeholder="data.items"
              value={(mapping as GridResponseMapping)?.rowsPath ?? ''}
              onChange={(v) => setMapping({ rowsPath: v } as Partial<GridResponseMapping>)}
              validation={rowsValidation}
            />
          )}

          <Divider />

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
                      placeholder="Column Label"
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
          <Button size="xs" variant="subtle" leftSection={<IconPlus size={12} />} onClick={addFieldMapping} w="fit-content">
            Add Mapping
          </Button>
        </Stack>
      </Grid.Col>

      {/* ── Right: path explorer ───────────────────────────────────── */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fw={600} size="sm">Response Paths</Text>
            {hasResponse && (
              <Badge color="green" variant="dot" size="sm">Live from step 4</Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed">
            {hasResponse
              ? 'Drag a path chip onto an input field on the left, or click Auto-detect.'
              : 'Run the API test in Step 4 to see available paths here.'}
          </Text>

          {!hasResponse ? (
            <Paper withBorder p="md" style={{ minHeight: 160 }}>
              <Text size="xs" c="dimmed" ta="center" mt="lg">
                No response available yet.
              </Text>
            </Paper>
          ) : (
            <ScrollArea h={440} style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 4 }} p="xs">
              <PathExplorer paths={paths} />
            </ScrollArea>
          )}
        </Stack>
      </Grid.Col>
    </Grid>
  )
}
