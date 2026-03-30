import { Stack, Text, Paper, Alert } from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { WidgetRegistry } from '@/registry/WidgetRegistry'
import { WidgetErrorBoundary } from '@/features/widgets/base/WidgetErrorBoundary'
import type { Widget } from '@/types'

export function Step9_Preview() {
  const { draft } = useWidgetWizardStore()

  if (!draft.type) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} color="yellow">
        Please complete the previous steps first.
      </Alert>
    )
  }

  const entry = WidgetRegistry.get(draft.type)
  if (!entry) return null

  const WidgetComponent = entry.component
  const previewWidget = { ...entry.defaultConfig(), ...draft } as Widget

  return (
    <Stack gap="md">
      <Text fw={600} size="sm">Widget Preview</Text>
      <Text size="xs" c="dimmed">
        This is a live preview of your widget. Data is fetched from the configured API.
      </Text>
      <Paper withBorder p="sm" radius="sm" style={{ minHeight: 300 }}>
        <WidgetErrorBoundary>
          <WidgetComponent widget={previewWidget} />
        </WidgetErrorBoundary>
      </Paper>
    </Stack>
  )
}
