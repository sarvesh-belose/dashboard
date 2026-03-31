import { useMemo } from 'react'
import {
  Stack, Text, Paper, Alert, Group, Badge, Button, ThemeIcon,
  Box, Table, ScrollArea, Code,
} from '@mantine/core'
import {
  IconAlertCircle, IconCircleCheck, IconAlertTriangle,
  IconArrowLeft, IconChartBar,
} from '@tabler/icons-react'
import HighchartsReact from 'highcharts-react-official'
import Highcharts from 'highcharts'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { mapChartResponse, mapGridResponse } from '@/utils/response-mapper'
import { buildHighchartsOptions } from '@/utils/chart-adapter'
import type {
  ChartWidget, GridWidget, ChartResponseMapping, GridResponseMapping, ChartConfig,
} from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface IssueItem {
  level: 'error' | 'warn'
  message: string
  goBack?: string   // which step description to go back to
}

function IssueList({ issues }: { issues: IssueItem[] }) {
  return (
    <Stack gap="xs">
      {issues.map((issue, i) => (
        <Alert
          key={i}
          icon={issue.level === 'error'
            ? <IconAlertCircle size={14} />
            : <IconAlertTriangle size={14} />}
          color={issue.level === 'error' ? 'red' : 'yellow'}
          p="xs"
        >
          <Text size="xs">{issue.message}</Text>
          {issue.goBack && (
            <Text size="xs" c="dimmed" mt={2}>
              <IconArrowLeft size={11} style={{ verticalAlign: 'middle' }} /> Go back to: <strong>{issue.goBack}</strong>
            </Text>
          )}
        </Alert>
      ))}
    </Stack>
  )
}

// ---------------------------------------------------------------------------
// Chart preview
// ---------------------------------------------------------------------------

function ChartPreview({ widget, rawResponse }: { widget: ChartWidget; rawResponse: unknown }) {
  const issues: IssueItem[] = []

  const mapping = widget.responseMapping as ChartResponseMapping
  const chartConfig = widget.chartConfig as ChartConfig

  if (!mapping?.seriesPath?.trim()) {
    issues.push({
      level: 'error',
      message: 'You haven\'t told us where your chart data is yet.',
      goBack: 'Step 5 — Map your data → "Where is your chart data?"',
    })
  }
  if (!mapping?.seriesDataField?.trim()) {
    issues.push({
      level: 'error',
      message: 'You haven\'t selected which field holds the values to plot.',
      goBack: 'Step 5 — Map your data → "Which field holds the numbers?" or "Where are the pie slices?"',
    })
  }

  if (issues.length > 0) return <IssueList issues={issues} />

  let mapped: { categories: string[]; series: { name: string; data: unknown[] }[] } | null = null
  let mapError: string | null = null
  try {
    mapped = mapChartResponse(rawResponse, mapping)
  } catch (e) {
    mapError = (e as Error).message
  }

  if (mapError) {
    return (
      <IssueList issues={[{
        level: 'error',
        message: `Could not read your data: ${mapError}`,
        goBack: 'Step 5 — check your field selections',
      }]} />
    )
  }

  if (!mapped || mapped.series.length === 0) {
    return (
      <IssueList issues={[{
        level: 'error',
        message: 'No data was found with the current mapping. The selected path returned an empty list.',
        goBack: 'Step 5 — check "Where is your chart data?" — make sure the path points to a non-empty list',
      }]} />
    )
  }

  // Check for series with no data
  const emptySeries = mapped.series.filter((s) => !s.data || (s.data as unknown[]).length === 0)
  const mismatchSeries = mapped.series.filter((s) => {
    const d = s.data as unknown[]
    if (!d || d.length === 0) return false
    const isPie = chartConfig.chartType === 'pie' || chartConfig.chartType === 'donut'
    if (isPie) return typeof d[0] === 'number'
    return typeof d[0] === 'object' && d[0] !== null && 'y' in (d[0] as object)
  })

  const warnings: IssueItem[] = []
  if (emptySeries.length > 0) {
    warnings.push({
      level: 'warn',
      message: `${emptySeries.length} series have no data: ${emptySeries.map((s) => `"${s.name}"`).join(', ')}.`,
      goBack: 'Step 5 — check "Which field holds the numbers?"',
    })
  }
  if (mismatchSeries.length > 0) {
    const isPie = chartConfig.chartType === 'pie' || chartConfig.chartType === 'donut'
    warnings.push({
      level: 'error',
      message: isPie
        ? `Data mismatch: Pie/Donut needs slice objects like { name, y } but got plain numbers. Change chart type to Line/Bar, or fix the "Where are the pie slices?" field.`
        : `Data mismatch: Line/Bar/Area needs plain numbers but got objects. Change chart type to Pie/Donut, or fix the "Which field holds the numbers?" field.`,
      goBack: 'Step 5 — chart type picker or field selections',
    })
  }

  if (mismatchSeries.length > 0) return <IssueList issues={warnings} />

  const options = buildHighchartsOptions(chartConfig, mapped.categories, mapped.series as never)

  return (
    <Stack gap="sm">
      {warnings.length > 0 && <IssueList issues={warnings} />}
      <Paper withBorder p="sm" radius="sm" style={{ minHeight: 300 }}>
        <HighchartsReact
          highcharts={Highcharts}
          options={{ ...options, chart: { ...options.chart, height: 300 } }}
          containerProps={{ style: { height: 300, width: '100%' } }}
        />
      </Paper>
      <Group gap="xs">
        <ThemeIcon color="green" size="sm" variant="light"><IconCircleCheck size={14} /></ThemeIcon>
        <Text size="xs" c="green.7">
          Rendering {mapped.series.length} series
          {mapped.categories.length > 0 ? ` × ${mapped.categories.length} points` : ''}
          {' '}from live API response
        </Text>
      </Group>
    </Stack>
  )
}

// ---------------------------------------------------------------------------
// Grid preview
// ---------------------------------------------------------------------------

function GridPreview({ widget, rawResponse }: { widget: GridWidget; rawResponse: unknown }) {
  const mapping = widget.responseMapping as GridResponseMapping

  if (!mapping?.rowsPath?.trim()) {
    return (
      <IssueList issues={[{
        level: 'error',
        message: 'You haven\'t selected which list contains your table rows.',
        goBack: 'Step 5 — Map your data → "Which list contains your table rows?"',
      }]} />
    )
  }

  let mapped: { rows: Record<string, unknown>[]; totalCount?: number } | null = null
  let mapError: string | null = null
  try {
    mapped = mapGridResponse(rawResponse, mapping)
  } catch (e) {
    mapError = (e as Error).message
  }

  if (mapError) {
    return (
      <IssueList issues={[{
        level: 'error',
        message: `Could not read your data: ${mapError}`,
        goBack: 'Step 5 — check your field selections',
      }]} />
    )
  }

  if (!mapped || mapped.rows.length === 0) {
    return (
      <IssueList issues={[{
        level: 'error',
        message: 'No rows were found with the current mapping.',
        goBack: 'Step 5 — check "Which list contains your table rows?"',
      }]} />
    )
  }

  const rows = mapped.rows.slice(0, 5)
  const cols = Object.keys(rows[0] ?? {})

  return (
    <Stack gap="sm">
      <Paper withBorder radius="sm" style={{ overflow: 'hidden' }}>
        <ScrollArea>
          <Table fz="xs" striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                {cols.map((c) => <Table.Th key={c}>{c}</Table.Th>)}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row, i) => (
                <Table.Tr key={i}>
                  {cols.map((c) => (
                    <Table.Td key={c}>{String(row[c] ?? '')}</Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
      <Group gap="xs">
        <ThemeIcon color="green" size="sm" variant="light"><IconCircleCheck size={14} /></ThemeIcon>
        <Text size="xs" c="green.7">
          Showing first {rows.length} of {mapped.totalCount ?? mapped.rows.length} rows
          {mapped.totalCount && mapped.totalCount !== mapped.rows.length
            ? ` (${mapped.rows.length} loaded)`
            : ''}
        </Text>
      </Group>
    </Stack>
  )
}

// ---------------------------------------------------------------------------
// Main Step 9 component
// ---------------------------------------------------------------------------

export function Step9_Preview() {
  const { draft, apiPreviewResponse } = useWidgetWizardStore()

  const type = draft.type

  // Validate we have enough to show a preview at all
  const globalIssues: IssueItem[] = useMemo(() => {
    const issues: IssueItem[] = []
    if (!apiPreviewResponse) {
      issues.push({
        level: 'error',
        message: 'No API response available. The preview uses the data you fetched during setup.',
        goBack: 'Step 4 — Test API endpoint → click "Run Test Request"',
      })
    }
    return issues
  }, [apiPreviewResponse])

  if (!type) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="yellow">
        Please complete the previous steps first.
      </Alert>
    )
  }

  if (globalIssues.length > 0) {
    return (
      <Stack gap="md">
        <Group gap="xs">
          <IconChartBar size={18} />
          <Text fw={600} size="sm">Widget Preview</Text>
        </Group>
        <IssueList issues={globalIssues} />
        <Text size="xs" c="dimmed">
          Fix the issues above and come back — the preview will show your actual data.
        </Text>
      </Stack>
    )
  }

  return (
    <Stack gap="md">
      <Group gap="xs" justify="space-between">
        <Group gap="xs">
          <IconChartBar size={18} />
          <Text fw={600} size="sm">Widget Preview</Text>
        </Group>
        <Badge color="blue" variant="dot" size="sm">Using data from Step 4 API test</Badge>
      </Group>

      <Text size="xs" c="dimmed">
        This preview uses the API response you fetched in Step 4, processed through your mapping
        settings. It shows exactly what data your widget will display on the dashboard.
      </Text>

      {type === 'chart' && (
        <ChartPreview
          widget={draft as ChartWidget}
          rawResponse={apiPreviewResponse}
        />
      )}

      {type === 'grid' && (
        <GridPreview
          widget={draft as GridWidget}
          rawResponse={apiPreviewResponse}
        />
      )}

      {(type === 'text' || type === 'custom') && (
        <Paper withBorder p="md" radius="sm" style={{ minHeight: 120 }}>
          <Stack align="center" justify="center" style={{ minHeight: 80 }} gap="xs">
            <IconCircleCheck size={28} color="var(--mantine-color-green-6)" />
            <Text size="sm" c="green.7" fw={500}>Widget is ready</Text>
            <Text size="xs" c="dimmed">This widget type doesn't require data mapping.</Text>
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}
