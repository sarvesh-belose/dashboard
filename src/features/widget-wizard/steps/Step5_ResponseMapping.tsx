import {
  Stack, TextInput, Text, Table, Select, Button, ActionIcon,
  Group, Grid, ScrollArea, Alert, Badge, Tooltip, Paper, Divider,
} from '@mantine/core'
import { IconPlus, IconTrash, IconWand, IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { JsonViewer } from '@/components/JsonViewer'
import type { FieldMapping, ChartResponseMapping, GridResponseMapping } from '@/types'

const TRANSFORMS = [
  { value: '', label: 'Auto' },
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
]

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

function getAtPath(obj: unknown, dotPath: string): unknown {
  if (!dotPath) return obj
  return dotPath.split('.').reduce<unknown>((curr, key) => {
    if (curr == null || typeof curr !== 'object') return undefined
    return (curr as Record<string, unknown>)[key]
  }, obj)
}

/** DFS: find the first array-of-objects in the response and return its dot path. */
function findFirstArrayOfObjects(
  obj: unknown,
  prefix = '',
  depth = 0,
): { path: string; rows: Record<string, unknown>[] } | null {
  if (depth > 5) return null
  if (
    Array.isArray(obj) &&
    obj.length > 0 &&
    typeof obj[0] === 'object' &&
    obj[0] !== null
  ) {
    return { path: prefix, rows: obj as Record<string, unknown>[] }
  }
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const childPath = prefix ? `${prefix}.${key}` : key
      const hit = findFirstArrayOfObjects(val, childPath, depth + 1)
      if (hit) return hit
    }
  }
  return null
}

/** Find a nested key whose value looks like a series array: [{name,data}] */
function findSeriesPath(obj: unknown, prefix = '', depth = 0): string | null {
  if (depth > 5) return null
  if (
    Array.isArray(obj) &&
    obj.length > 0 &&
    typeof obj[0] === 'object' &&
    'data' in (obj[0] as object)
  ) {
    return prefix
  }
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const childPath = prefix ? `${prefix}.${key}` : key
      const hit = findSeriesPath(val, childPath, depth + 1)
      if (hit) return hit
    }
  }
  return null
}

/** Find a nested key whose value is an array of primitives (strings / numbers). */
function findCategoriesPath(obj: unknown, prefix = '', depth = 0): string | null {
  if (depth > 5) return null
  if (
    Array.isArray(obj) &&
    obj.length > 0 &&
    (typeof obj[0] === 'string' || typeof obj[0] === 'number')
  ) {
    return prefix
  }
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    // prefer keys named "categories" or "labels"
    const preferred = ['categories', 'labels', 'xAxis']
    for (const key of preferred) {
      if (key in (obj as object)) {
        const val = (obj as Record<string, unknown>)[key]
        const childPath = prefix ? `${prefix}.${key}` : key
        const hit = findCategoriesPath(val, childPath, depth + 1)
        if (hit) return hit
      }
    }
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const childPath = prefix ? `${prefix}.${key}` : key
      const hit = findCategoriesPath(val, childPath, depth + 1)
      if (hit) return hit
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Step5_ResponseMapping() {
  const { draft, updateDraft, apiPreviewResponse } = useWidgetWizardStore()
  const type = draft.type
  const mapping = (draft as { responseMapping?: ChartResponseMapping | GridResponseMapping }).responseMapping

  const isChart = type === 'chart'
  const isGrid = type === 'grid'
  const hasResponse = apiPreviewResponse !== null && apiPreviewResponse !== undefined

  const setMapping = (partial: Partial<ChartResponseMapping | GridResponseMapping>) =>
    updateDraft({ responseMapping: { ...mapping, ...partial } as never } as never)

  const setFieldMapping = (idx: number, partial: Partial<FieldMapping>) => {
    const current: FieldMapping[] = mapping?.fieldMappings ?? []
    setMapping({ fieldMappings: current.map((fm, i) => (i === idx ? { ...fm, ...partial } : fm)) })
  }

  const addFieldMapping = () => {
    const current: FieldMapping[] = mapping?.fieldMappings ?? []
    setMapping({ fieldMappings: [...current, { sourceField: '', targetField: '' }] })
  }

  const removeFieldMapping = (idx: number) => {
    const current: FieldMapping[] = mapping?.fieldMappings ?? []
    setMapping({ fieldMappings: current.filter((_, i) => i !== idx) })
  }

  // -------------------------------------------------------------------------
  // Auto-detect: fills in paths + field mappings from the live API response
  // -------------------------------------------------------------------------
  const autoDetect = () => {
    if (!hasResponse) return

    if (isChart) {
      const seriesPath = findSeriesPath(apiPreviewResponse)
      const categoriesPath = findCategoriesPath(apiPreviewResponse)
      const update: Partial<ChartResponseMapping> = {}
      if (seriesPath) update.seriesPath = seriesPath
      if (categoriesPath) update.categoriesPath = categoriesPath
      // Peek at first series item to detect name/data fields
      if (seriesPath) {
        const seriesArr = getAtPath(apiPreviewResponse, seriesPath)
        if (Array.isArray(seriesArr) && seriesArr.length > 0) {
          const first = seriesArr[0] as Record<string, unknown>
          if ('name' in first) update.seriesNameField = 'name'
          if ('data' in first) update.seriesDataField = 'data'
        }
      }
      setMapping(update)
    }

    if (isGrid) {
      const found = findFirstArrayOfObjects(apiPreviewResponse)
      if (!found) return
      setMapping({ rowsPath: found.path })
      // Auto-populate field mappings from the first row's keys
      const firstRow = found.rows[0]
      const fields: FieldMapping[] = Object.keys(firstRow).map((key) => {
        const sample = firstRow[key]
        let transform: FieldMapping['transform'] = undefined
        if (typeof sample === 'number') transform = 'number'
        else if (typeof sample === 'boolean') transform = 'boolean'
        else if (typeof sample === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sample)) transform = 'date'
        return { sourceField: key, targetField: key, transform }
      })
      setMapping({ rowsPath: found.path, fieldMappings: fields })
    }
  }

  const autoDetectDisabled = !hasResponse

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <Grid gutter="md" style={{ height: '100%' }}>
      {/* ── Left: mapping form ─────────────────────────────────────── */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Text fw={600} size="sm">Map API response to widget data</Text>
            <Tooltip
              label={autoDetectDisabled ? 'Run the API test in the previous step first' : 'Auto-fill paths and fields from the response'}
              withArrow
            >
              <Button
                size="xs"
                variant="light"
                leftSection={<IconWand size={14} />}
                onClick={autoDetect}
                disabled={autoDetectDisabled}
              >
                Auto-detect
              </Button>
            </Tooltip>
          </Group>

          {!hasResponse && (
            <Alert icon={<IconAlertCircle size={14} />} color="yellow" p="xs">
              No test response yet. Go back to step 4 and run a test to enable auto-detect.
            </Alert>
          )}

          {hasResponse && (
            <Alert icon={<IconCircleCheck size={14} />} color="green" p="xs">
              API response available. Use <strong>Auto-detect</strong> to fill in paths, or type them manually.
            </Alert>
          )}

          {isChart && (
            <>
              <TextInput
                label="Series Path"
                description='Path to series array, e.g. "data.series"'
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
          <Group>
            <Button size="xs" variant="subtle" leftSection={<IconPlus size={12} />} onClick={addFieldMapping}>
              Add Mapping
            </Button>
          </Group>
        </Stack>
      </Grid.Col>

      {/* ── Right: live response preview ───────────────────────────── */}
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Stack gap="xs" h="100%">
          <Group justify="space-between">
            <Text fw={600} size="sm">API Response</Text>
            {hasResponse && <Badge color="green" variant="dot" size="sm">From step 4</Badge>}
          </Group>
          {!hasResponse ? (
            <Paper withBorder p="md" style={{ flex: 1 }}>
              <Text size="xs" c="dimmed" ta="center" mt="xl">
                No response yet. Go back to Step 4 and run the test request.
              </Text>
            </Paper>
          ) : (
            <ScrollArea
              h={420}
              style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 4 }}
              p="xs"
            >
              <JsonViewer data={apiPreviewResponse} />
            </ScrollArea>
          )}
        </Stack>
      </Grid.Col>
    </Grid>
  )
}
