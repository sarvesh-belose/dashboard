import {
  Stack, Text, Select, Button, ActionIcon, TextInput, Table,
  Group, Grid, Alert, Badge, Paper, Divider, Card, SimpleGrid,
  Box, ThemeIcon, ScrollArea, Code, Collapse,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconPlus, IconTrash, IconWand, IconAlertCircle, IconCircleCheck,
  IconAlertTriangle, IconChevronDown, IconChevronUp, IconInfoCircle,
} from '@tabler/icons-react'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { useWizardValidation } from '../WizardValidationContext'
import {
  extractPaths, resolveSimplePath, validateSeriesPath, validateCategoriesPath, validateRowsPath,
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
// Helpers: derive selectable options from the response
// ---------------------------------------------------------------------------

function getObjectArrayOptions(paths: PathNode[]) {
  return paths
    .filter((p) => p.type === 'array-of-objects')
    .map((p) => ({
      value: p.path.replace(/\[\*\]/g, ''),
      label: `${p.path.replace(/\[\*\]/g, '')}  —  ${p.preview}`,
    }))
}

function getPrimitiveArrayOptions(paths: PathNode[]) {
  return paths
    .filter((p) => p.type === 'array-of-primitives')
    .map((p) => ({
      value: p.path.replace(/\[\*\]/g, ''),
      label: `${p.path.replace(/\[\*\]/g, '')}  —  ${p.preview}`,
    }))
}

/** Return keys of objects inside an array at the given path */
function getArrayItemKeys(response: unknown, arrayPath: string): string[] {
  if (!arrayPath) return []
  const arr = resolveSimplePath(response, arrayPath)
  if (!Array.isArray(arr) || arr.length === 0) return []
  const first = arr[0]
  if (typeof first !== 'object' || first === null) return []
  return Object.keys(first as object)
}

/** Return keys of objects inside item[fieldName] (e.g., series[0].data[0] keys) */
function getNestedItemKeys(response: unknown, arrayPath: string, fieldName: string): string[] {
  if (!arrayPath || !fieldName) return []
  const arr = resolveSimplePath(response, arrayPath)
  if (!Array.isArray(arr) || arr.length === 0) return []
  const nested = (arr[0] as Record<string, unknown>)?.[fieldName]
  if (!Array.isArray(nested) || nested.length === 0) return []
  const first = nested[0]
  if (typeof first !== 'object' || first === null) return []
  return Object.keys(first as object)
}

// ---------------------------------------------------------------------------
// ValidationBadge
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
// PathSelect — searchable Select that shows paths from the response,
// but also accepts any free-text value typed by the user.
// ---------------------------------------------------------------------------

interface PathSelectProps {
  label: string
  description?: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  required?: boolean
  showError?: boolean
  validation?: ValidationResult | null
}

function PathSelect({ label, description, placeholder, value, onChange, options, required, showError, validation }: PathSelectProps) {
  const emptyError = showError && required && !value.trim() ? `${label} is required.` : undefined
  // Include the current value in the list even if it was typed manually
  const data = value && !options.find((o) => o.value === value)
    ? [{ value, label: value }, ...options]
    : options

  return (
    <Box>
      <Select
        label={label}
        description={description}
        placeholder={placeholder ?? 'Select or type a path…'}
        value={value || null}
        onChange={(v) => onChange(v ?? '')}
        data={data}
        searchable
        clearable
        required={required}
        error={emptyError}
        size="sm"
        nothingFoundMessage={
          options.length === 0
            ? 'Run the API test first to see paths'
            : 'No matching path — type to enter manually'
        }
        comboboxProps={{ withinPortal: true }}
      />
      {!emptyError && <ValidationBadge result={validation ?? null} />}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// KeySelect — searchable Select for object keys (name field, data field, etc.)
// ---------------------------------------------------------------------------

interface KeySelectProps {
  label: string
  description?: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  keys: string[]
  disabled?: boolean
}

function KeySelect({ label, description, placeholder, value, onChange, keys, disabled }: KeySelectProps) {
  const options = keys.map((k) => ({ value: k, label: k }))
  const data = value && !options.find((o) => o.value === value)
    ? [{ value, label: value }, ...options]
    : options

  return (
    <Select
      label={label}
      description={description}
      placeholder={placeholder ?? 'Select a field…'}
      value={value || null}
      onChange={(v) => onChange(v ?? '')}
      data={data}
      searchable
      clearable
      disabled={disabled}
      size="sm"
      nothingFoundMessage="No keys found — select the series path first"
      comboboxProps={{ withinPortal: true }}
    />
  )
}

// ---------------------------------------------------------------------------
// SeriesPreview — shows what will actually be extracted
// ---------------------------------------------------------------------------

function SeriesPreview({
  response, seriesPath, nameField, dataField, chartType,
}: {
  response: unknown
  seriesPath: string
  nameField: string
  dataField: string
  chartType: ChartType
}) {
  if (!seriesPath) return null
  const arr = resolveSimplePath(response, seriesPath)
  if (!Array.isArray(arr) || arr.length === 0) return null

  const isPie = PIE_TYPES.includes(chartType)

  return (
    <Paper withBorder p="xs" bg="var(--mantine-color-green-0)">
      <Text size="xs" fw={600} c="green.8" mb={4}>
        <IconCircleCheck size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
        Mapping preview — {arr.length} series found
      </Text>
      <Stack gap={4}>
        {arr.slice(0, 4).map((item, i) => {
          const rec = item as Record<string, unknown>
          const seriesName = nameField && rec[nameField] !== undefined
            ? String(rec[nameField])
            : `Series ${i + 1}`
          const dataVal = dataField ? rec[dataField] : undefined
          let dataInfo = ''
          if (Array.isArray(dataVal)) {
            if (dataVal.length === 0) {
              dataInfo = 'empty array'
            } else if (typeof dataVal[0] === 'number') {
              const nums = (dataVal as number[]).slice(0, 3).join(', ')
              dataInfo = `[${nums}${dataVal.length > 3 ? ', …' : ''}]`
            } else if (typeof dataVal[0] === 'object' && dataVal[0] !== null) {
              const keys = Object.keys(dataVal[0] as object).join(', ')
              dataInfo = `[{${keys}}, …] × ${dataVal.length}`
            }
          } else if (dataVal !== undefined) {
            dataInfo = String(dataVal)
          }

          const compatible = isPie
            ? (Array.isArray(dataVal) && dataVal.length > 0 && typeof dataVal[0] === 'object')
            : (Array.isArray(dataVal) && dataVal.length > 0 && typeof dataVal[0] === 'number')

          const incompatible = isPie
            ? (Array.isArray(dataVal) && dataVal.length > 0 && typeof dataVal[0] === 'number')
            : (Array.isArray(dataVal) && dataVal.length > 0 && typeof dataVal[0] === 'object')

          return (
            <Group key={i} gap={6} wrap="nowrap">
              <Text size="xs" ff="monospace" fw={500} style={{ minWidth: 80 }} truncate>{seriesName}</Text>
              <Text size="xs" c="dimmed">→</Text>
              <Text size="xs" ff="monospace" c={incompatible ? 'red' : compatible ? 'green.7' : 'dimmed'} truncate>
                {dataInfo || '(no data field selected)'}
              </Text>
              {incompatible && <IconAlertTriangle size={11} color="var(--mantine-color-red-6)" />}
              {compatible  && <IconCircleCheck   size={11} color="var(--mantine-color-green-6)" />}
            </Group>
          )
        })}
        {arr.length > 4 && <Text size="xs" c="dimmed">…and {arr.length - 4} more</Text>}
      </Stack>

      {/* Compatibility hint */}
      {isPie ? (
        <Text size="xs" c="blue.7" mt={6}>
          Pie/Donut expects <Code fz={10}>{'{ name, y }'}</Code> objects in the data array.
          Each slice is one <Code fz={10}>{'{ name, y }'}</Code> element.
        </Text>
      ) : (
        <Text size="xs" c="blue.7" mt={6}>
          Line/Bar/Area expect a plain <Code fz={10}>number[]</Code> for each series.
          Categories provide the x-axis labels.
        </Text>
      )}
    </Paper>
  )
}

function CategoriesPreview({ response, categoriesPath }: { response: unknown; categoriesPath: string }) {
  if (!categoriesPath) return null
  const arr = resolveSimplePath(response, categoriesPath)
  if (!Array.isArray(arr) || arr.length === 0) return null
  const preview = arr.slice(0, 5).map(String).join(', ')
  return (
    <Text size="xs" c="green.7" mt={2}>
      <IconCircleCheck size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} />
      {arr.length} labels: {preview}{arr.length > 5 ? ', …' : ''}
    </Text>
  )
}

function RowsPreview({ response, rowsPath }: { response: unknown; rowsPath: string }) {
  if (!rowsPath) return null
  const arr = resolveSimplePath(response, rowsPath)
  if (!Array.isArray(arr) || arr.length === 0) return null
  const first = arr[0] as Record<string, unknown>
  const cols = typeof first === 'object' && first !== null ? Object.keys(first) : []
  return (
    <Paper withBorder p="xs" bg="var(--mantine-color-green-0)">
      <Text size="xs" fw={600} c="green.8">
        <IconCircleCheck size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
        {arr.length} rows found
      </Text>
      <Text size="xs" c="dimmed" mt={2}>Columns: {cols.join(', ')}</Text>
    </Paper>
  )
}

// ---------------------------------------------------------------------------
// Raw response viewer (collapsible)
// ---------------------------------------------------------------------------

function RawResponseViewer({ response }: { response: unknown }) {
  const [opened, { toggle }] = useDisclosure(false)
  const preview = JSON.stringify(response, null, 2)

  return (
    <Box>
      <Group gap={6} style={{ cursor: 'pointer' }} onClick={toggle}>
        {opened ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        <Text size="xs" fw={600} c="dimmed">Full API Response</Text>
      </Group>
      <Collapse in={opened}>
        <ScrollArea h={220} mt={4} style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 4 }}>
          <Code block fz={10} style={{ whiteSpace: 'pre' }}>{preview.slice(0, 4000)}{preview.length > 4000 ? '\n…(truncated)' : ''}</Code>
        </ScrollArea>
      </Collapse>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Auto-detect helpers (unchanged from before)
// ---------------------------------------------------------------------------

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
  const objectArrayOptions    = getObjectArrayOptions(paths)
  const primitiveArrayOptions = getPrimitiveArrayOptions(paths)

  const chartMapping = mapping as ChartResponseMapping | undefined
  const gridMapping  = mapping as GridResponseMapping  | undefined

  // Keys derived from the currently-selected series path
  const seriesItemKeys = hasResponse
    ? getArrayItemKeys(apiPreviewResponse, chartMapping?.seriesPath ?? '')
    : []

  // Keys derived from series[0][dataField] — for pie/donut {name,y} fields
  const dataPointKeys = hasResponse
    ? getNestedItemKeys(apiPreviewResponse, chartMapping?.seriesPath ?? '', chartMapping?.seriesDataField ?? '')
    : []

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
    ? validateSeriesPath(apiPreviewResponse, chartMapping?.seriesPath ?? '', chartType)
    : null

  const categoriesValidation: ValidationResult | null = hasResponse && isChart && !isPie
    ? validateCategoriesPath(apiPreviewResponse, chartMapping?.categoriesPath ?? '')
    : null

  const rowsValidation: ValidationResult | null = hasResponse && isGrid
    ? validateRowsPath(apiPreviewResponse, gridMapping?.rowsPath ?? '')
    : null

  // ── Auto-detect ───────────────────────────────────────────────────────────

  const autoDetect = () => {
    if (!hasResponse) return
    if (isChart) {
      const seriesPath = findSeriesPath(apiPreviewResponse) ?? ''
      const categoriesPath = isPie ? '' : (findCategoriesPath(apiPreviewResponse) ?? '')
      const update: Partial<ChartResponseMapping> = { seriesPath, categoriesPath }
      if (seriesPath) {
        const arr = resolveSimplePath(apiPreviewResponse, seriesPath)
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

  return (
    <Grid gutter="md">

      {/* ── LEFT: mapping form ──────────────────────────────────────────── */}
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Stack gap="sm">

          {/* Chart type picker */}
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

          {/* Status bar */}
          <Group justify="space-between" align="center">
            <Text fw={600} size="sm">{isChart ? '2. Map your data fields' : 'Map your data fields'}</Text>
            <Button
              size="xs" variant="light" leftSection={<IconWand size={14} />}
              onClick={autoDetect} disabled={!hasResponse}
              title={hasResponse ? 'Auto-fill all fields from the response' : 'Run API test in Step 4 first'}
            >
              Auto-detect
            </Button>
          </Group>

          {!hasResponse && (
            <Alert icon={<IconAlertCircle size={14} />} color="yellow" p="xs">
              No API response yet. Go back to Step 4 and run the request, then return here and click <strong>Auto-detect</strong>.
            </Alert>
          )}

          {/* ── CHART mapping ────────────────────────────────────────────── */}
          {isChart && (
            <Stack gap="xs">

              {/* Step A: Series array */}
              <PathSelect
                label="Series Array"
                description={isPie
                  ? 'The array that contains one or more pie series objects (each has a "data" array of slices).'
                  : 'The array that contains your series — each item is one line/bar with a name and data values.'}
                value={chartMapping?.seriesPath ?? ''}
                onChange={(v) => setMapping({ seriesPath: v } as Partial<ChartResponseMapping>)}
                options={objectArrayOptions}
                required
                showError={showErrors}
                validation={seriesValidation}
              />

              {/* Step B: Name field */}
              <KeySelect
                label="Series Name Field"
                description="Which field inside each series object is the series label (e.g. the legend name)?"
                placeholder={seriesItemKeys.length ? 'Pick a field…' : 'Select series path first'}
                value={chartMapping?.seriesNameField ?? ''}
                onChange={(v) => setMapping({ seriesNameField: v } as Partial<ChartResponseMapping>)}
                keys={seriesItemKeys}
                disabled={!chartMapping?.seriesPath}
              />

              {/* Step C: Data field */}
              <KeySelect
                label={isPie ? 'Slices Field' : 'Data Values Field'}
                description={isPie
                  ? 'The field inside each series that holds the slice array — each slice must be { name, y }.'
                  : 'The field inside each series that holds the numeric data array — e.g. [120, 135, 162].'}
                placeholder={seriesItemKeys.length ? 'Pick a field…' : 'Select series path first'}
                value={chartMapping?.seriesDataField ?? ''}
                onChange={(v) => setMapping({ seriesDataField: v } as Partial<ChartResponseMapping>)}
                keys={seriesItemKeys}
                disabled={!chartMapping?.seriesPath}
              />

              {/* For pie/donut — show slice structure hint based on actual data */}
              {isPie && chartMapping?.seriesPath && chartMapping?.seriesDataField && dataPointKeys.length > 0 && (
                <Alert icon={<IconInfoCircle size={14} />} color="blue" p="xs">
                  Slice objects found with fields: <Code fz={10}>{dataPointKeys.join(', ')}</Code>.
                  Pie/Donut needs <Code fz={10}>name</Code> (slice label) and <Code fz={10}>y</Code> (slice value).
                </Alert>
              )}

              {/* Step D: Categories (non-pie only) */}
              {!isPie && (
                <>
                  <PathSelect
                    label="X-Axis Labels (optional)"
                    description='The array of labels for the x-axis — e.g. ["Jan", "Feb", "Mar"]. Leave empty to use numeric index.'
                    value={chartMapping?.categoriesPath ?? ''}
                    onChange={(v) => setMapping({ categoriesPath: v } as Partial<ChartResponseMapping>)}
                    options={primitiveArrayOptions}
                    validation={categoriesValidation}
                  />
                  <CategoriesPreview response={apiPreviewResponse} categoriesPath={chartMapping?.categoriesPath ?? ''} />
                </>
              )}

              {/* Live series preview */}
              <SeriesPreview
                response={apiPreviewResponse}
                seriesPath={chartMapping?.seriesPath ?? ''}
                nameField={chartMapping?.seriesNameField ?? ''}
                dataField={chartMapping?.seriesDataField ?? ''}
                chartType={chartType}
              />
            </Stack>
          )}

          {/* ── GRID mapping ─────────────────────────────────────────────── */}
          {isGrid && (
            <Stack gap="xs">
              <PathSelect
                label="Rows Array"
                description='The array of row objects — each element in the array becomes one row in the table.'
                value={gridMapping?.rowsPath ?? ''}
                onChange={(v) => setMapping({ rowsPath: v } as Partial<GridResponseMapping>)}
                options={objectArrayOptions}
                required
                showError={showErrors}
                validation={rowsValidation}
              />
              <RowsPreview response={apiPreviewResponse} rowsPath={gridMapping?.rowsPath ?? ''} />
            </Stack>
          )}

          <Divider />

          {/* Field mappings table */}
          <Text size="sm" fw={500}>Column / field mappings <Text span size="xs" c="dimmed">(rename and coerce types)</Text></Text>
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

      {/* ── RIGHT: field reference + raw response ───────────────────────── */}
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={600} size="sm">Field Reference</Text>
            {hasResponse && <Badge color="green" variant="dot" size="sm">Live data</Badge>}
          </Group>

          {/* Chart type-specific field guide */}
          {isChart && (
            <Paper withBorder p="xs">
              {isPie ? (
                <Stack gap={6}>
                  <Text size="xs" fw={600}>Fields for Pie / Donut</Text>
                  <Box>
                    <Text size="xs" fw={500}>Series Array</Text>
                    <Text size="xs" c="dimmed">Array of series objects, each with a name and a data array.</Text>
                  </Box>
                  <Box>
                    <Text size="xs" fw={500}>Series Name Field</Text>
                    <Text size="xs" c="dimmed">String that labels this series (shown in the legend).</Text>
                  </Box>
                  <Box>
                    <Text size="xs" fw={500}>Slices Field</Text>
                    <Text size="xs" c="dimmed">Array of slice objects inside the series. Each slice must be:</Text>
                    <Code fz={10} block style={{ marginTop: 4 }}>{`{ "name": "Chrome", "y": 61 }`}</Code>
                  </Box>
                </Stack>
              ) : (
                <Stack gap={6}>
                  <Text size="xs" fw={600}>Fields for {chartType.charAt(0).toUpperCase() + chartType.slice(1)} chart</Text>
                  <Box>
                    <Text size="xs" fw={500}>Series Array</Text>
                    <Text size="xs" c="dimmed">Array of series objects, e.g.:</Text>
                    <Code fz={10} block style={{ marginTop: 4 }}>{`[{ "name": "Revenue", "data": [120, 135, 162] }]`}</Code>
                  </Box>
                  <Box>
                    <Text size="xs" fw={500}>Data Values Field</Text>
                    <Text size="xs" c="dimmed">The field that holds the array of numbers for each series.</Text>
                  </Box>
                  <Box>
                    <Text size="xs" fw={500}>X-Axis Labels</Text>
                    <Text size="xs" c="dimmed">Array of strings that label each data point on the x-axis.</Text>
                    <Code fz={10} block style={{ marginTop: 4 }}>{`["Jan", "Feb", "Mar"]`}</Code>
                  </Box>
                </Stack>
              )}
            </Paper>
          )}

          {isGrid && (
            <Paper withBorder p="xs">
              <Stack gap={6}>
                <Text size="xs" fw={600}>Fields for Grid</Text>
                <Box>
                  <Text size="xs" fw={500}>Rows Array</Text>
                  <Text size="xs" c="dimmed">Array of row objects. Each object becomes one row in the table. Example:</Text>
                  <Code fz={10} block style={{ marginTop: 4 }}>{`[
  { "id": 1, "name": "Alice", "status": "active" },
  { "id": 2, "name": "Bob",   "status": "inactive" }
]`}</Code>
                </Box>
              </Stack>
            </Paper>
          )}

          {/* Full raw response (collapsed by default) */}
          {hasResponse && <RawResponseViewer response={apiPreviewResponse} />}
        </Stack>
      </Grid.Col>

    </Grid>
  )
}
