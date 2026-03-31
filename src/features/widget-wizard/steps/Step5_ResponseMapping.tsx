import { useState } from 'react'
import {
  Stack, Text, Select, Button, ActionIcon, TextInput, Table,
  Group, Alert, Badge, Paper, Divider, Card, SimpleGrid,
  Box, ThemeIcon, Code, Collapse,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconPlus, IconTrash, IconWand, IconAlertCircle, IconCircleCheck,
  IconAlertTriangle, IconChevronDown, IconChevronUp, IconHelp,
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
  { value: 'string',  label: 'Text'    },
  { value: 'number',  label: 'Number'  },
  { value: 'date',    label: 'Date'    },
  { value: 'boolean', label: 'Yes/No'  },
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
// Path option builders
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

function getArrayItemKeys(response: unknown, arrayPath: string): string[] {
  if (!arrayPath) return []
  const arr = resolveSimplePath(response, arrayPath)
  if (!Array.isArray(arr) || arr.length === 0) return []
  const first = arr[0]
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
// SmartSelect — searchable Select populated from response paths/keys
// Also accepts free-text if user types a value not in the list.
// ---------------------------------------------------------------------------

interface SmartSelectProps {
  label: string
  hint: string
  placeholder?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  required?: boolean
  showError?: boolean
  disabled?: boolean
  disabledHint?: string
  validation?: ValidationResult | null
  badge?: string
}

function SmartSelect({
  label, hint, placeholder, value, onChange, options,
  required, showError, disabled, disabledHint, validation, badge,
}: SmartSelectProps) {
  const emptyError = showError && required && !value.trim() ? `Required — please select an option.` : undefined
  const data = value && !options.find((o) => o.value === value)
    ? [{ value, label: value }, ...options]
    : options

  return (
    <Box>
      <Group gap={6} mb={2}>
        <Text size="sm" fw={500}>{label}{required && <Text span c="red"> *</Text>}</Text>
        {badge && <Badge size="xs" variant="light">{badge}</Badge>}
      </Group>
      <Text size="xs" c="dimmed" mb={4}>{hint}</Text>
      <Select
        placeholder={disabled ? (disabledHint ?? 'Complete the step above first') : (placeholder ?? 'Choose one…')}
        value={value || null}
        onChange={(v) => onChange(v ?? '')}
        data={data}
        searchable
        clearable
        disabled={disabled}
        error={emptyError}
        size="sm"
        nothingFoundMessage={
          options.length === 0
            ? 'Run the API test in Step 4 to see options'
            : 'No match — type to enter manually'
        }
        comboboxProps={{ withinPortal: true }}
      />
      {!emptyError && <ValidationBadge result={validation ?? null} />}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// DataPreview — shows what was actually found with the current selection
// ---------------------------------------------------------------------------

function ChartDataPreview({
  response, seriesPath, nameField, dataField, categoriesPath, chartType,
}: {
  response: unknown
  seriesPath: string
  nameField: string
  dataField: string
  categoriesPath: string
  chartType: ChartType
}) {
  if (!seriesPath) return null
  const arr = resolveSimplePath(response, seriesPath)
  if (!Array.isArray(arr) || arr.length === 0) return null

  const isPie = PIE_TYPES.includes(chartType)
  const cats = categoriesPath ? resolveSimplePath(response, categoriesPath) : null
  const catArr = Array.isArray(cats) ? cats as unknown[] : []

  return (
    <Paper withBorder p="sm" bg="var(--mantine-color-green-0)" radius="sm">
      <Group gap={6} mb={6}>
        <IconCircleCheck size={14} color="var(--mantine-color-green-7)" />
        <Text size="xs" fw={600} c="green.8">Found {arr.length} data series in your response</Text>
      </Group>
      <Stack gap={6}>
        {arr.slice(0, 4).map((item, i) => {
          const rec = item as Record<string, unknown>
          const seriesName = nameField && rec[nameField] !== undefined
            ? String(rec[nameField])
            : `Series ${i + 1}`
          const dataVal = dataField ? rec[dataField] : undefined
          let dataInfo = '(no values field selected yet)'
          let status: 'ok' | 'warn' | 'none' = 'none'

          if (Array.isArray(dataVal)) {
            if (dataVal.length === 0) {
              dataInfo = 'empty — no data points'
              status = 'warn'
            } else if (typeof dataVal[0] === 'number') {
              const sample = (dataVal as number[]).slice(0, 4).join(', ')
              dataInfo = `${dataVal.length} values: ${sample}${dataVal.length > 4 ? ', …' : ''}`
              status = isPie ? 'warn' : 'ok'
            } else if (typeof dataVal[0] === 'object' && dataVal[0] !== null) {
              const keys = Object.keys(dataVal[0] as object).join(', ')
              dataInfo = `${dataVal.length} slices with fields: ${keys}`
              status = isPie ? 'ok' : 'warn'
            }
          } else if (dataVal !== undefined) {
            dataInfo = String(dataVal)
          }

          return (
            <Group key={i} gap={8} wrap="nowrap" align="flex-start">
              <Box style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--mantine-color-blue-5)', marginTop: 5, flexShrink: 0 }} />
              <Box style={{ flex: 1 }}>
                <Text size="xs" fw={500}>{seriesName}</Text>
                <Group gap={4}>
                  <Text size="xs" c={status === 'ok' ? 'green.7' : status === 'warn' ? 'orange.7' : 'dimmed'}>
                    {dataInfo}
                  </Text>
                  {status === 'warn' && <IconAlertTriangle size={11} color="var(--mantine-color-orange-6)" />}
                  {status === 'ok'   && <IconCircleCheck   size={11} color="var(--mantine-color-green-6)" />}
                </Group>
              </Box>
            </Group>
          )
        })}
        {arr.length > 4 && <Text size="xs" c="dimmed" ml={16}>…and {arr.length - 4} more series</Text>}
      </Stack>
      {!isPie && catArr.length > 0 && (
        <Box mt={8} pt={8} style={{ borderTop: '1px solid var(--mantine-color-green-2)' }}>
          <Text size="xs" c="green.7">
            <IconCircleCheck size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
            {catArr.length} X-axis labels: {catArr.slice(0, 5).map(String).join(', ')}{catArr.length > 5 ? ', …' : ''}
          </Text>
        </Box>
      )}
      {isPie && (
        <Text size="xs" c="blue.7" mt={6}>
          Each slice needs a <strong>name</strong> (label) and a <strong>y</strong> (value) field inside the slices array.
        </Text>
      )}
    </Paper>
  )
}

function GridDataPreview({ response, rowsPath }: { response: unknown; rowsPath: string }) {
  if (!rowsPath) return null
  const arr = resolveSimplePath(response, rowsPath)
  if (!Array.isArray(arr) || arr.length === 0) return null
  const first = arr[0] as Record<string, unknown>
  const cols = typeof first === 'object' && first !== null ? Object.keys(first) : []
  return (
    <Paper withBorder p="sm" bg="var(--mantine-color-green-0)" radius="sm">
      <Group gap={6} mb={4}>
        <IconCircleCheck size={14} color="var(--mantine-color-green-7)" />
        <Text size="xs" fw={600} c="green.8">Found {arr.length} rows in your response</Text>
      </Group>
      <Text size="xs" c="dimmed">Columns: {cols.join(', ')}</Text>
    </Paper>
  )
}

// ---------------------------------------------------------------------------
// How does this work? — collapsible help
// ---------------------------------------------------------------------------

function HowItWorks({ chartType }: { chartType: ChartType | null }) {
  const [open, { toggle }] = useDisclosure(false)
  const isPie = chartType ? PIE_TYPES.includes(chartType) : false

  return (
    <Box>
      <Group gap={6} style={{ cursor: 'pointer' }} onClick={toggle}>
        <IconHelp size={14} color="var(--mantine-color-blue-5)" />
        <Text size="xs" c="blue.6" fw={500}>How does this work?</Text>
        {open ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
      </Group>
      <Collapse in={open}>
        <Paper withBorder p="sm" mt={6} bg="var(--mantine-color-blue-0)" radius="sm">
          {isPie ? (
            <Stack gap={4}>
              <Text size="xs" fw={600}>How pie / donut charts work</Text>
              <Text size="xs">Your API returns a list of series. Each series has a name and a list of slices.</Text>
              <Text size="xs">Each slice must have two things: a <strong>label</strong> (e.g. "Chrome") and a <strong>value</strong> (e.g. 61).</Text>
              <Code fz={10} block style={{ marginTop: 4 }}>{`{
  "series": [
    {
      "name": "Market Share",
      "data": [
        { "name": "Chrome",  "y": 61 },
        { "name": "Firefox", "y": 17 }
      ]
    }
  ]
}`}</Code>
              <Text size="xs" c="dimmed">In the questions below: "Where is your data?" → data location of that array. "What is each series called?" → "name". "Where are the pie slices?" → "data".</Text>
            </Stack>
          ) : chartType ? (
            <Stack gap={4}>
              <Text size="xs" fw={600}>How {chartType} charts work</Text>
              <Text size="xs">Your API returns a list of series. Each series has a name and a list of numbers — one number per point on the chart.</Text>
              <Code fz={10} block style={{ marginTop: 4 }}>{`{
  "series": [
    { "name": "Revenue",  "data": [120, 135, 162] },
    { "name": "Expenses", "data": [85,  92,  105] }
  ],
  "categories": ["Jan", "Feb", "Mar"]
}`}</Code>
              <Text size="xs" c="dimmed">"Where is your data?" → the series array. "Name field" → "name". "Values field" → "data". "X-axis labels" → categories.</Text>
            </Stack>
          ) : (
            <Stack gap={4}>
              <Text size="xs" fw={600}>How tables work</Text>
              <Text size="xs">Your API returns a list of records. Each record becomes one row in your table.</Text>
              <Code fz={10} block style={{ marginTop: 4 }}>{`{
  "items": [
    { "id": 1, "name": "Alice", "status": "Active" },
    { "id": 2, "name": "Bob",   "status": "Inactive" }
  ]
}`}</Code>
              <Text size="xs" c="dimmed">"Which list contains your rows?" → "items" in the example above.</Text>
            </Stack>
          )}
        </Paper>
      </Collapse>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Raw response viewer (collapsible)
// ---------------------------------------------------------------------------

function RawResponseViewer({ response }: { response: unknown }) {
  const [open, { toggle }] = useDisclosure(false)
  const json = JSON.stringify(response, null, 2)

  return (
    <Box>
      <Group gap={6} style={{ cursor: 'pointer' }} onClick={toggle}>
        {open ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
        <Text size="xs" c="dimmed" fw={500}>View raw API response</Text>
      </Group>
      <Collapse in={open}>
        <Box
          mt={4}
          style={{
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 4,
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          <Code block fz={10} style={{ whiteSpace: 'pre' }}>
            {json.slice(0, 3000)}{json.length > 3000 ? '\n…(truncated)' : ''}
          </Code>
        </Box>
      </Collapse>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Auto-detect helpers
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
  const [showFieldMappings, { toggle: toggleFieldMappings }] = useDisclosure(false)

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

  const seriesItemKeys = hasResponse
    ? getArrayItemKeys(apiPreviewResponse, chartMapping?.seriesPath ?? '')
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
    <Stack gap="md">

      {/* ── API response status bar ────────────────────────────────────── */}
      {!hasResponse ? (
        <Alert icon={<IconAlertCircle size={14} />} color="yellow" p="xs">
          <strong>No API response yet.</strong> Go back to Step 4 and click "Run Test Request", then come back here.
        </Alert>
      ) : (
        <Group justify="space-between" align="center">
          <Badge color="green" variant="dot">API response loaded</Badge>
          <Button
            size="xs" variant="light" leftSection={<IconWand size={14} />}
            onClick={autoDetect}
          >
            Auto-detect all fields
          </Button>
        </Group>
      )}

      {/* ── Chart type picker ───────────────────────────────────────────── */}
      {isChart && (
        <>
          <Box>
            <Text size="sm" fw={600} mb={6}>What type of chart do you want?</Text>
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
          </Box>
          <Divider />
        </>
      )}

      {/* ── How does this work? ─────────────────────────────────────────── */}
      <HowItWorks chartType={isChart ? chartType : null} />

      <Divider />

      {/* ── CHART mapping questions ─────────────────────────────────────── */}
      {isChart && (
        <Stack gap="lg">

          {/* Q1: Where is your data? */}
          <SmartSelect
            label="Where is your chart data?"
            hint={objectArrayOptions.length > 0
              ? `${objectArrayOptions.length} data list${objectArrayOptions.length > 1 ? 's' : ''} found in your API response — pick the one that contains your chart series.`
              : 'Run the API test in Step 4, then the available data lists will appear here.'}
            value={chartMapping?.seriesPath ?? ''}
            onChange={(v) => setMapping({ seriesPath: v } as Partial<ChartResponseMapping>)}
            options={objectArrayOptions}
            required
            showError={showErrors}
            validation={seriesValidation}
            badge="Required"
          />

          {/* Q2: What is each series called? */}
          <SmartSelect
            label="What is each data series called?"
            hint={seriesItemKeys.length
              ? `The field that gives each line / bar its name (shown in the chart legend). Fields available: ${seriesItemKeys.join(', ')}.`
              : 'Select "Where is your data?" above first, then the available fields will appear here.'}
            value={chartMapping?.seriesNameField ?? ''}
            onChange={(v) => setMapping({ seriesNameField: v } as Partial<ChartResponseMapping>)}
            options={seriesItemKeys.map((k) => ({ value: k, label: k }))}
            disabled={!chartMapping?.seriesPath}
            disabledHint='Answer "Where is your chart data?" first'
          />

          {/* Q3: Data values field */}
          {isPie ? (
            <SmartSelect
              label="Where are the pie slices?"
              hint={seriesItemKeys.length
                ? `The field that holds the list of slices. Each slice must have a name and a value. Fields available: ${seriesItemKeys.join(', ')}.`
                : 'Select "Where is your data?" above first.'}
              value={chartMapping?.seriesDataField ?? ''}
              onChange={(v) => setMapping({ seriesDataField: v } as Partial<ChartResponseMapping>)}
              options={seriesItemKeys.map((k) => ({ value: k, label: k }))}
              disabled={!chartMapping?.seriesPath}
              disabledHint='Answer "Where is your chart data?" first'
            />
          ) : (
            <SmartSelect
              label="Which field holds the numbers to plot?"
              hint={seriesItemKeys.length
                ? `The field inside each series that contains the list of values to draw on the chart (e.g. [120, 135, 162]). Fields available: ${seriesItemKeys.join(', ')}.`
                : 'Select "Where is your data?" above first.'}
              value={chartMapping?.seriesDataField ?? ''}
              onChange={(v) => setMapping({ seriesDataField: v } as Partial<ChartResponseMapping>)}
              options={seriesItemKeys.map((k) => ({ value: k, label: k }))}
              disabled={!chartMapping?.seriesPath}
              disabledHint='Answer "Where is your chart data?" first'
            />
          )}

          {/* Q4: X-axis labels (non-pie only) */}
          {!isPie && (
            <SmartSelect
              label="What labels go on the X-axis? (optional)"
              hint={primitiveArrayOptions.length > 0
                ? `e.g. months, product names, dates. ${primitiveArrayOptions.length} label list${primitiveArrayOptions.length > 1 ? 's' : ''} found. Leave empty to use numbers (1, 2, 3…).`
                : 'Leave empty to use numbers on the X-axis, or add labels once you have run the API test.'}
              value={chartMapping?.categoriesPath ?? ''}
              onChange={(v) => setMapping({ categoriesPath: v } as Partial<ChartResponseMapping>)}
              options={primitiveArrayOptions}
              validation={categoriesValidation}
            />
          )}

          {/* Live preview of what was found */}
          <ChartDataPreview
            response={apiPreviewResponse}
            seriesPath={chartMapping?.seriesPath ?? ''}
            nameField={chartMapping?.seriesNameField ?? ''}
            dataField={chartMapping?.seriesDataField ?? ''}
            categoriesPath={chartMapping?.categoriesPath ?? ''}
            chartType={chartType}
          />
        </Stack>
      )}

      {/* ── GRID mapping questions ──────────────────────────────────────── */}
      {isGrid && (
        <Stack gap="lg">
          <SmartSelect
            label="Which list in the response contains your table rows?"
            hint={objectArrayOptions.length > 0
              ? `${objectArrayOptions.length} list${objectArrayOptions.length > 1 ? 's' : ''} found. Pick the one where each item is a row in your table.`
              : 'Run the API test in Step 4, then the available lists will appear here.'}
            value={gridMapping?.rowsPath ?? ''}
            onChange={(v) => setMapping({ rowsPath: v } as Partial<GridResponseMapping>)}
            options={objectArrayOptions}
            required
            showError={showErrors}
            validation={rowsValidation}
            badge="Required"
          />
          <GridDataPreview response={apiPreviewResponse} rowsPath={gridMapping?.rowsPath ?? ''} />
        </Stack>
      )}

      {/* ── Column / field mappings (advanced, collapsed by default) ────── */}
      <Divider />
      <Group gap={6} style={{ cursor: 'pointer' }} onClick={toggleFieldMappings}>
        {showFieldMappings ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        <Text size="sm" fw={500}>Rename columns or change data types</Text>
        <Badge size="xs" variant="light" color="gray">Optional</Badge>
      </Group>
      <Collapse in={showFieldMappings}>
        <Stack gap="xs">
          <Text size="xs" c="dimmed">
            Use this to rename a field from its API name to a friendlier label, or to force a field to be treated as a number, date, etc.
          </Text>
          <Table fz="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>API Field Name</Table.Th>
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
            Add Rename Rule
          </Button>
        </Stack>
      </Collapse>

      {/* ── Raw response ────────────────────────────────────────────────── */}
      {hasResponse && <RawResponseViewer response={apiPreviewResponse} />}
    </Stack>
  )
}
