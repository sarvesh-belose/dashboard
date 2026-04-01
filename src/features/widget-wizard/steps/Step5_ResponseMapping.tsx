import { useState, useMemo } from 'react'
import HighchartsReact from 'highcharts-react-official'
import Highcharts from 'highcharts'
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
import { mapChartResponse } from '@/utils/response-mapper'
import { buildHighchartsOptions } from '@/utils/chart-adapter'
import type { FieldMapping, ChartResponseMapping, GridResponseMapping, ChartConfig, ChartType } from '@/types'
import { getChartFamily, CHART_TYPE_META, type ChartFamily } from '@/constants/chart-families'

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

const FAMILY_GROUPS: { family: ChartFamily; label: string; types: ChartType[] }[] = [
  { family: 'STANDARD', label: 'Lines & Bars',   types: ['line','spline','area','bar','column','waterfall'] },
  { family: 'PIE',      label: 'Pie & Funnel',   types: ['pie','donut','funnel','pyramid'] },
  { family: 'SCATTER',  label: 'Scatter',         types: ['scatter'] },
  { family: 'BUBBLE',   label: 'Bubble',          types: ['bubble'] },
  { family: 'HEATMAP',  label: 'Heatmap',         types: ['heatmap'] },
  { family: 'GAUGE',    label: 'Gauge',           types: ['gauge','solidgauge'] },
  { family: 'TREEMAP',  label: 'Treemap',         types: ['treemap'] },
]

const PIE_TYPES: ChartType[] = ['pie', 'donut', 'funnel', 'pyramid']

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

// Collect all paths that resolve to a primitive number (for gauge value picker)
function getNumberPaths(paths: PathNode[]) {
  return paths
    .filter((p) => p.type === 'number')
    .map((p) => ({ value: p.path, label: `${p.path}  —  ${p.preview}` }))
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

// Per-family help content: example JSON + field mapping instructions
const FAMILY_HELP: Record<string, { title: string; json: string; fields: string }> = {
  STANDARD: {
    title: 'Line, Bar, Column, Area, Spline, Waterfall',
    json: `{
  "series": [
    { "name": "Revenue",  "data": [120, 135, 162] },
    { "name": "Expenses", "data": [85,  92,  105] }
  ],
  "categories": ["Jan", "Feb", "Mar"]
}`,
    fields: '• "Where is your chart data?" → series\n• "What is each series called?" → name\n• "Which field holds the numbers?" → data\n• "X-axis labels" → categories (optional)',
  },
  WATERFALL: {
    title: 'Waterfall chart',
    json: `{
  "series": [
    {
      "name": "Revenue Breakdown",
      "data": [
        { "name": "Starting Revenue", "y": 80000 },
        { "name": "New Customers",    "y": 20000 },
        { "name": "Churn",            "y": -8000 },
        { "name": "Net Revenue",      "y": 92000, "isSum": true }
      ]
    }
  ]
}`,
    fields: '• "Where is your chart data?" → series\n• "What is each series called?" → name\n• "Which field holds the numbers?" → data\n  Each item has a name (bar label) and y (height). Add "isSum": true for total bars.',
  },
  PIE: {
    title: 'Pie, Donut, Funnel, Pyramid',
    json: `{
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
}`,
    fields: '• "Where is your chart data?" → series\n• "What is each series called?" → name\n• "Where are the slices?" → data\n  Each slice needs a name (label) and y (value).',
  },
  SCATTER: {
    title: 'Scatter chart',
    json: `{
  "series": [
    {
      "name": "Team A",
      "data": [[65, 82], [72, 91], [58, 74]]
    },
    {
      "name": "Team B",
      "data": [[55, 70], [62, 78], [48, 65]]
    }
  ]
}`,
    fields: '• "Where is your chart data?" → series\n• "What is each series called?" → name\n• "Which field holds the coordinate pairs?" → data\n  Each point is [x, y] — two numbers in an array.',
  },
  BUBBLE: {
    title: 'Bubble chart',
    json: `{
  "series": [
    {
      "name": "APAC",
      "data": [
        { "x": 95, "y": 95, "z": 13.8, "name": "Japan" },
        { "x": 86, "y": 76, "z": 9.2,  "name": "Australia" }
      ]
    }
  ]
}`,
    fields: '• "Where is your chart data?" → series\n• "What is each series called?" → name\n• "Which field holds the bubble objects?" → data\n  Each bubble needs x (horizontal), y (vertical), z (bubble size).',
  },
  HEATMAP: {
    title: 'Heatmap',
    json: `{
  "xCategories": ["Mon", "Tue", "Wed"],
  "yCategories": ["Morning", "Afternoon", "Evening"],
  "series": [
    {
      "name": "Ticket Volume",
      "data": [
        [0, 0, 45], [0, 1, 72], [0, 2, 30],
        [1, 0, 60], [1, 1, 88], [1, 2, 42]
      ]
    }
  ]
}`,
    fields: '• "Where is your data?" → series\n• "What is each series called?" → name\n• "Which field holds the cell data?" → data\n  Each cell is [columnIndex, rowIndex, value] — three numbers.\n• "X-axis labels" → xCategories\n• "Y-axis labels" → yCategories',
  },
  GAUGE: {
    title: 'Gauge / Solid Gauge',
    json: `{
  "value": 74,
  "min": 0,
  "max": 100
}`,
    fields: '• "Which field holds the gauge value?" → value\n  Just a single number — no series needed.\n• Optionally map min and max from the response too.',
  },
  TREEMAP: {
    title: 'Treemap',
    json: `{
  "series": [
    {
      "name": "Product Revenue",
      "data": [
        { "id": "software", "name": "Software", "value": 0 },
        { "name": "Enterprise", "value": 4500, "parent": "software" },
        { "name": "Professional", "value": 2500, "parent": "software" }
      ]
    }
  ]
}`,
    fields: '• "Where is your tree data?" → series\n• "Which field holds the node size value?" → data\n  Parent nodes need an id and value: 0. Child nodes reference their parent via the parent field.',
  },
}

function HowItWorks({ chartType }: { chartType: ChartType | null }) {
  const [open, { toggle }] = useDisclosure(false)

  const family = chartType ? getChartFamily(chartType) : null
  const helpKey = chartType === 'waterfall'
    ? 'WATERFALL'
    : (family ?? 'STANDARD')

  const help = FAMILY_HELP[helpKey] ?? FAMILY_HELP.STANDARD

  const tableHelp = {
    title: 'Table / Grid',
    json: `{
  "items": [
    { "id": 1, "name": "Alice", "status": "Active" },
    { "id": 2, "name": "Bob",   "status": "Inactive" }
  ]
}`,
    fields: '• "Which list contains your rows?" → items\n  Each object in the list becomes one row.',
  }

  const current = chartType === null ? tableHelp : help

  return (
    <Box>
      <Group gap={6} style={{ cursor: 'pointer' }} onClick={toggle}>
        <IconHelp size={14} color="var(--mantine-color-blue-5)" />
        <Text size="xs" c="blue.6" fw={500}>How should my data look? (click to expand)</Text>
        {open ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
      </Group>
      <Collapse in={open}>
        <Paper withBorder p="sm" mt={6} bg="var(--mantine-color-blue-0)" radius="sm">
          <Stack gap={6}>
            <Text size="xs" fw={600}>{current.title}</Text>
            <Text size="xs">Your API response should look like this:</Text>
            <Code fz={10} block>{current.json}</Code>
            <Text size="xs" fw={500} mt={4}>How to fill in the fields below:</Text>
            <Code fz={10} block style={{ whiteSpace: 'pre', background: 'transparent', border: 'none', padding: 0 }}>
              {current.fields}
            </Code>
          </Stack>
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
// Live mini-chart preview
// ---------------------------------------------------------------------------

function LiveChartPreview({
  chartConfig, mapping, response,
}: {
  chartConfig: ChartConfig
  mapping: ChartResponseMapping | undefined
  response: unknown
}) {
  const options = useMemo(() => {
    if (!mapping?.seriesPath) return null
    try {
      const mapped = mapChartResponse(response, mapping, chartConfig.chartType)
      if (!mapped.series.length && !mapped.categories.length) return null
      const base = buildHighchartsOptions(chartConfig, mapped.categories, mapped.series as never)
      return {
        ...base,
        chart: { ...base.chart, height: 220 },
        title: { text: '' },
        subtitle: { text: '' },
        legend: { enabled: false },
        credits: { enabled: false },
      }
    } catch {
      return null
    }
  }, [chartConfig, mapping, response])

  if (!options) return null

  return (
    <Paper withBorder p="xs" radius="sm" mt={4}>
      <Group gap={6} mb={6}>
        <Text size="xs" fw={600} c="blue.7">Live Preview</Text>
        <Badge size="xs" variant="dot" color="green">updates as you map</Badge>
      </Group>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { height: 220, width: '100%' } }}
      />
    </Paper>
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
  const family = getChartFamily(chartType)
  const isPie = PIE_TYPES.includes(chartType)

  const paths = hasResponse ? extractPaths(apiPreviewResponse) : []
  const objectArrayOptions    = getObjectArrayOptions(paths)
  const primitiveArrayOptions = getPrimitiveArrayOptions(paths)
  const numberPathOptions     = getNumberPaths(paths)

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

  const seriesValidation: ValidationResult | null = hasResponse && isChart && family !== 'GAUGE'
    ? validateSeriesPath(apiPreviewResponse, chartMapping?.seriesPath ?? '', chartType)
    : null

  const categoriesValidation: ValidationResult | null = hasResponse && isChart && family === 'STANDARD'
    ? validateCategoriesPath(apiPreviewResponse, chartMapping?.categoriesPath ?? '')
    : null

  const rowsValidation: ValidationResult | null = hasResponse && isGrid
    ? validateRowsPath(apiPreviewResponse, gridMapping?.rowsPath ?? '')
    : null

  // ── Auto-detect ───────────────────────────────────────────────────────────

  const autoDetect = () => {
    if (!hasResponse) return
    if (isChart) {
      if (family === 'GAUGE') {
        // Try common scalar paths
        for (const p of ['value', 'data.value', 'data', 'result']) {
          const v = resolveSimplePath(apiPreviewResponse, p)
          if (typeof v === 'number') {
            setMapping({ gaugeValuePath: p } as Partial<ChartResponseMapping>)
            return
          }
        }
        // Fall back to first number path found
        if (numberPathOptions.length > 0) {
          setMapping({ gaugeValuePath: numberPathOptions[0].value } as Partial<ChartResponseMapping>)
        }
        return
      }

      const seriesPath = findSeriesPath(apiPreviewResponse) ?? ''
      const update: Partial<ChartResponseMapping> = { seriesPath }

      if (family === 'STANDARD') {
        update.categoriesPath = findCategoriesPath(apiPreviewResponse) ?? ''
      }
      if (family === 'HEATMAP') {
        // look for xCategories / yCategories keys
        const raw = apiPreviewResponse as Record<string, unknown>
        const dataObj = (raw?.data ?? raw) as Record<string, unknown>
        if (dataObj?.xCategories) update.categoriesPath = 'data.xCategories'
        if (dataObj?.yCategories) update.yCategoriesPath = 'data.yCategories'
      }

      if (seriesPath) {
        const arr = resolveSimplePath(apiPreviewResponse, seriesPath)
        if (Array.isArray(arr) && arr.length > 0) {
          const first = arr[0] as Record<string, unknown>
          if ('name' in first) update.seriesNameField = 'name'
          if ('data' in first) update.seriesDataField = 'data'
          if (family === 'TREEMAP' && 'value' in first) update.seriesDataField = 'value'
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
            <Text size="sm" fw={600} mb={8}>What type of chart do you want?</Text>
            <Stack gap={8}>
              {FAMILY_GROUPS.map((group) => (
                <Box key={group.family}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase" mb={4}>{group.label}</Text>
                  <SimpleGrid cols={6} spacing={4}>
                    {group.types.map((ct) => {
                      const meta = CHART_TYPE_META[ct]
                      const isSelected = chartType === ct
                      return (
                        <Card
                          key={ct}
                          withBorder
                          padding={5}
                          style={{
                            cursor: 'pointer', textAlign: 'center',
                            borderColor: isSelected ? 'var(--mantine-color-blue-6)' : undefined,
                            background:  isSelected ? 'var(--mantine-color-blue-0)' : undefined,
                          }}
                          onClick={() => setChartType(ct)}
                          title={meta.description}
                        >
                          <Text size="lg" style={{ lineHeight: 1 }}>{meta.icon}</Text>
                          <Text size="xs" lh={1.2} mt={2}>{meta.label}</Text>
                        </Card>
                      )
                    })}
                  </SimpleGrid>
                </Box>
              ))}
            </Stack>
          </Box>
          <Divider />
        </>
      )}

      {/* ── How does this work? ─────────────────────────────────────────── */}
      <HowItWorks chartType={isChart ? chartType : null} />

      <Divider />

      {/* ── CHART mapping questions (family-aware) ──────────────────────── */}
      {isChart && (
        <Stack gap="lg">

          {/* GAUGE family: just pick the value path */}
          {family === 'GAUGE' && (
            <>
              <SmartSelect
                label="Which field in the response holds the gauge value?"
                hint={numberPathOptions.length > 0
                  ? `Pick the field that contains a single number — e.g. 74, 0.85. Found ${numberPathOptions.length} number field${numberPathOptions.length > 1 ? 's' : ''}.`
                  : 'Run the API test in Step 4 first. The available number fields will appear here.'}
                value={chartMapping?.gaugeValuePath ?? ''}
                onChange={(v) => setMapping({ gaugeValuePath: v } as Partial<ChartResponseMapping>)}
                options={numberPathOptions}
                required
                showError={showErrors}
                badge="Required"
              />
              <SmartSelect
                label="Which field holds the minimum value? (optional)"
                hint="Defaults to 0 if not provided."
                value={(chartMapping as ChartResponseMapping & { gaugeMinPath?: string })?.gaugeMinPath ?? ''}
                onChange={(v) => setMapping({ ...(v ? { gaugeMinPath: v } : {}) } as Partial<ChartResponseMapping>)}
                options={numberPathOptions}
              />
              <SmartSelect
                label="Which field holds the maximum value? (optional)"
                hint="Defaults to 100 if not provided."
                value={(chartMapping as ChartResponseMapping & { gaugeMaxPath?: string })?.gaugeMaxPath ?? ''}
                onChange={(v) => setMapping({ ...(v ? { gaugeMaxPath: v } : {}) } as Partial<ChartResponseMapping>)}
                options={numberPathOptions}
              />
            </>
          )}

          {/* HEATMAP family */}
          {family === 'HEATMAP' && (
            <>
              <SmartSelect
                label="Where is your heatmap data?"
                hint="Pick the list that contains each cell's data. Each item should be [column, row, value]."
                value={chartMapping?.seriesPath ?? ''}
                onChange={(v) => setMapping({ seriesPath: v } as Partial<ChartResponseMapping>)}
                options={objectArrayOptions}
                required
                showError={showErrors}
                badge="Required"
              />
              <SmartSelect
                label="What is each series called?"
                hint="The field that labels this heatmap series (shown in the legend)."
                value={chartMapping?.seriesNameField ?? ''}
                onChange={(v) => setMapping({ seriesNameField: v } as Partial<ChartResponseMapping>)}
                options={seriesItemKeys.map((k) => ({ value: k, label: k }))}
                disabled={!chartMapping?.seriesPath}
              />
              <SmartSelect
                label="Which field holds the cell data ([col, row, value] triplets)?"
                hint="Each triplet positions a cell on the grid and sets its colour intensity."
                value={chartMapping?.seriesDataField ?? ''}
                onChange={(v) => setMapping({ seriesDataField: v } as Partial<ChartResponseMapping>)}
                options={seriesItemKeys.map((k) => ({ value: k, label: k }))}
                disabled={!chartMapping?.seriesPath}
              />
              <SmartSelect
                label="X-axis labels (columns) — optional"
                hint='e.g. ["Mon","Tue","Wed"]. Leave empty to use column numbers.'
                value={chartMapping?.categoriesPath ?? ''}
                onChange={(v) => setMapping({ categoriesPath: v } as Partial<ChartResponseMapping>)}
                options={primitiveArrayOptions}
              />
              <SmartSelect
                label="Y-axis labels (rows) — optional"
                hint='e.g. ["Morning","Afternoon","Evening"]. Leave empty to use row numbers.'
                value={chartMapping?.yCategoriesPath ?? ''}
                onChange={(v) => setMapping({ yCategoriesPath: v } as Partial<ChartResponseMapping>)}
                options={primitiveArrayOptions}
              />
            </>
          )}

          {/* SCATTER family */}
          {family === 'SCATTER' && (
            <>
              <SmartSelect
                label="Where is your scatter data?"
                hint="Pick the list of series. Each series should have a name and a list of [x, y] coordinate pairs."
                value={chartMapping?.seriesPath ?? ''}
                onChange={(v) => setMapping({ seriesPath: v } as Partial<ChartResponseMapping>)}
                options={objectArrayOptions}
                required
                showError={showErrors}
                badge="Required"
              />
              <SmartSelect
                label="What is each series called?"
                hint="The field that names each group of points (shown in the legend)."
                value={chartMapping?.seriesNameField ?? ''}
                onChange={(v) => setMapping({ seriesNameField: v } as Partial<ChartResponseMapping>)}
                options={seriesItemKeys.map((k) => ({ value: k, label: k }))}
                disabled={!chartMapping?.seriesPath}
              />
              <SmartSelect
                label="Which field holds the coordinate pairs?"
                hint="Each item should be [x, y] or an object with x and y fields."
                value={chartMapping?.seriesDataField ?? ''}
                onChange={(v) => setMapping({ seriesDataField: v } as Partial<ChartResponseMapping>)}
                options={seriesItemKeys.map((k) => ({ value: k, label: k }))}
                disabled={!chartMapping?.seriesPath}
              />
            </>
          )}

          {/* BUBBLE family */}
          {family === 'BUBBLE' && (
            <>
              <SmartSelect
                label="Where is your bubble data?"
                hint="Pick the list of series. Each series should have a name and a list of bubble points."
                value={chartMapping?.seriesPath ?? ''}
                onChange={(v) => setMapping({ seriesPath: v } as Partial<ChartResponseMapping>)}
                options={objectArrayOptions}
                required
                showError={showErrors}
                badge="Required"
              />
              <SmartSelect
                label="What is each series called?"
                hint="The field that names each group of bubbles."
                value={chartMapping?.seriesNameField ?? ''}
                onChange={(v) => setMapping({ seriesNameField: v } as Partial<ChartResponseMapping>)}
                options={seriesItemKeys.map((k) => ({ value: k, label: k }))}
                disabled={!chartMapping?.seriesPath}
              />
              <SmartSelect
                label="Which field holds the bubble point objects?"
                hint="Each item needs x (position), y (position) and z (bubble size) fields."
                value={chartMapping?.seriesDataField ?? ''}
                onChange={(v) => setMapping({ seriesDataField: v } as Partial<ChartResponseMapping>)}
                options={seriesItemKeys.map((k) => ({ value: k, label: k }))}
                disabled={!chartMapping?.seriesPath}
              />
            </>
          )}

          {/* TREEMAP family */}
          {family === 'TREEMAP' && (
            <>
              <SmartSelect
                label="Where is your tree data?"
                hint="Pick the list that contains all the nodes. Each node needs a name and a value (its size)."
                value={chartMapping?.seriesPath ?? ''}
                onChange={(v) => setMapping({ seriesPath: v } as Partial<ChartResponseMapping>)}
                options={objectArrayOptions}
                required
                showError={showErrors}
                badge="Required"
              />
              <SmartSelect
                label="Which field holds the node size value?"
                hint='The numeric field that controls how big each rectangle is. Usually "value" or "amount".'
                value={chartMapping?.seriesDataField ?? ''}
                onChange={(v) => setMapping({ seriesDataField: v } as Partial<ChartResponseMapping>)}
                options={seriesItemKeys.map((k) => ({ value: k, label: k }))}
                disabled={!chartMapping?.seriesPath}
              />
            </>
          )}

          {/* STANDARD + PIE families */}
          {(family === 'STANDARD' || family === 'PIE') && (
            <>
              <SmartSelect
                label="Where is your chart data?"
                hint={objectArrayOptions.length > 0
                  ? `${objectArrayOptions.length} data list${objectArrayOptions.length > 1 ? 's' : ''} found — pick the one that contains your chart series.`
                  : 'Run the API test in Step 4, then the available data lists will appear here.'}
                value={chartMapping?.seriesPath ?? ''}
                onChange={(v) => setMapping({ seriesPath: v } as Partial<ChartResponseMapping>)}
                options={objectArrayOptions}
                required
                showError={showErrors}
                validation={seriesValidation}
                badge="Required"
              />
              <SmartSelect
                label="What is each data series called?"
                hint={seriesItemKeys.length
                  ? `The field that gives each line / bar / slice group its name. Fields: ${seriesItemKeys.join(', ')}.`
                  : 'Select "Where is your chart data?" first.'}
                value={chartMapping?.seriesNameField ?? ''}
                onChange={(v) => setMapping({ seriesNameField: v } as Partial<ChartResponseMapping>)}
                options={seriesItemKeys.map((k) => ({ value: k, label: k }))}
                disabled={!chartMapping?.seriesPath}
                disabledHint='Answer "Where is your chart data?" first'
              />
              <SmartSelect
                label={isPie ? 'Where are the slices / segments?' : 'Which field holds the numbers to plot?'}
                hint={isPie
                  ? `The field holding the list of slices. Each slice needs a name and a value (e.g. { name: "Chrome", y: 61 }). Fields: ${seriesItemKeys.join(', ') || '(select series path first)'}.`
                  : `The field containing the list of values for each data point (e.g. [120, 135, 162]). Fields: ${seriesItemKeys.join(', ') || '(select series path first)'}.`}
                value={chartMapping?.seriesDataField ?? ''}
                onChange={(v) => setMapping({ seriesDataField: v } as Partial<ChartResponseMapping>)}
                options={seriesItemKeys.map((k) => ({ value: k, label: k }))}
                disabled={!chartMapping?.seriesPath}
                disabledHint='Answer "Where is your chart data?" first'
              />
              {family === 'STANDARD' && (
                <SmartSelect
                  label="What labels go on the X-axis? (optional)"
                  hint={primitiveArrayOptions.length > 0
                    ? `e.g. months, product names, dates. ${primitiveArrayOptions.length} label list${primitiveArrayOptions.length > 1 ? 's' : ''} found.`
                    : 'Leave empty to use numbers (1, 2, 3…) on the X-axis.'}
                  value={chartMapping?.categoriesPath ?? ''}
                  onChange={(v) => setMapping({ categoriesPath: v } as Partial<ChartResponseMapping>)}
                  options={primitiveArrayOptions}
                  validation={categoriesValidation}
                />
              )}
            </>
          )}

          {/* Data preview (non-gauge) */}
          {family !== 'GAUGE' && (
            <ChartDataPreview
              response={apiPreviewResponse}
              seriesPath={chartMapping?.seriesPath ?? ''}
              nameField={chartMapping?.seriesNameField ?? ''}
              dataField={chartMapping?.seriesDataField ?? ''}
              categoriesPath={chartMapping?.categoriesPath ?? ''}
              chartType={chartType}
            />
          )}

          {/* Live Highcharts mini-chart preview */}
          {isChart && hasResponse && family !== 'GAUGE' && chartMapping?.seriesPath && chartMapping?.seriesDataField && (
            <LiveChartPreview
              chartConfig={chartConfig}
              mapping={chartMapping}
              response={apiPreviewResponse}
            />
          )}
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
