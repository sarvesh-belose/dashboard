import { Group, Button, Text, Badge, ActionIcon, Tooltip } from '@mantine/core'
import {
  IconEdit,
  IconEye,
  IconPlus,
  IconDeviceFloppy,
  IconSettings,
} from '@tabler/icons-react'
import { useDashboardStore } from '@/store/dashboard.store'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import {
  saveDashboardToStorage,
} from '@/services/dashboard.service'
import { useFilterStore } from '@/store/filter.store'

export function DashboardToolbar() {
  const { dashboard, widgets, isEditMode, isDirty, isSaving, setEditMode } =
    useDashboardStore()
  const openWizard = useWidgetWizardStore((s) => s.openWizard)
  const filters = useFilterStore((s) => s.filters)

  const handleSave = () => {
    if (!dashboard) return
    saveDashboardToStorage({ dashboard, widgets: Object.values(widgets), filters })
    useDashboardStore.getState().markSaved()
  }

  return (
    <Group justify="space-between" px="md" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
      <Group gap="sm">
        <Text fw={700} size="md">
          {dashboard?.name ?? 'Dashboard'}
        </Text>
        {isDirty && (
          <Badge color="orange" variant="dot" size="sm">
            Unsaved
          </Badge>
        )}
      </Group>

      <Group gap="xs">
        {isEditMode && (
          <Button
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={() => openWizard()}
          >
            Add Widget
          </Button>
        )}

        {isDirty && (
          <Button
            size="xs"
            variant="light"
            leftSection={<IconDeviceFloppy size={14} />}
            loading={isSaving}
            onClick={handleSave}
          >
            Save
          </Button>
        )}

        <Tooltip label={isEditMode ? 'Switch to view mode' : 'Switch to edit mode'}>
          <ActionIcon
            variant={isEditMode ? 'filled' : 'subtle'}
            color={isEditMode ? 'blue' : 'gray'}
            onClick={() => setEditMode(!isEditMode)}
          >
            {isEditMode ? <IconEye size={16} /> : <IconEdit size={16} />}
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Dashboard settings">
          <ActionIcon variant="subtle" color="gray">
            <IconSettings size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  )
}
