import { memo } from 'react'
import { Card, Group, Text, ActionIcon, Tooltip, Box } from '@mantine/core'
import { IconEdit, IconTrash, IconRefresh, IconGripVertical } from '@tabler/icons-react'
import { useDashboardStore } from '@/store/dashboard.store'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { useQueryClient } from '@tanstack/react-query'
import { WidgetRegistry } from '@/registry/WidgetRegistry'
import { RbacGate } from '@/features/rbac/RbacGate'
import { WidgetErrorBoundary } from './WidgetErrorBoundary'
import type { Widget } from '@/types'

interface Props {
  widgetId: string
}

export const WidgetShell = memo(function WidgetShell({ widgetId }: Props) {
  const widget = useDashboardStore((s) => s.widgets[widgetId])
  const isEditMode = useDashboardStore((s) => s.isEditMode)
  const isSharedView = useDashboardStore((s) => s.isSharedView)
  const removeWidget = useDashboardStore((s) => s.removeWidget)
  const openWizard = useWidgetWizardStore((s) => s.openWizard)
  const queryClient = useQueryClient()

  if (!widget) return null

  const entry = WidgetRegistry.get(widget.type)
  if (!entry) return null

  const WidgetComponent = entry.component

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['widget-data', widgetId] })
  }

  return (
    <RbacGate widget={widget as Widget}>
      <Card
        h="100%"
        style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        padding="xs"
        radius="sm"
        withBorder
      >
        <Group justify="space-between" mb="xs" wrap="nowrap">
          {/* Drag handle — only shown in edit mode, never in shared view */}
          {isEditMode && !isSharedView && (
            <Tooltip label="Drag to reposition" withArrow>
              <Box
                className="drag-handle"
                style={{
                  cursor: 'grab',
                  color: 'var(--mantine-color-gray-5)',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  paddingRight: 4,
                }}
              >
                <IconGripVertical size={14} />
              </Box>
            </Tooltip>
          )}

          <Text fw={600} size="sm" truncate style={{ flex: 1 }}>
            {widget.title}
          </Text>

          <Group gap={4} wrap="nowrap">
            <Tooltip label="Refresh" withArrow>
              <ActionIcon variant="subtle" size="sm" onClick={handleRefresh}>
                <IconRefresh size={14} />
              </ActionIcon>
            </Tooltip>
            {isEditMode && !isSharedView && (
              <>
                <Tooltip label="Edit widget" withArrow>
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    onClick={() => openWizard(widgetId, widget)}
                  >
                    <IconEdit size={14} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Remove widget" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => removeWidget(widgetId)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Tooltip>
              </>
            )}
          </Group>
        </Group>

        <Box style={{ flex: 1, overflow: 'hidden' }}>
          <WidgetErrorBoundary>
            <WidgetComponent widget={widget as Widget} />
          </WidgetErrorBoundary>
        </Box>
      </Card>
    </RbacGate>
  )
})
