import { useState } from 'react'
import { Group, Button, Text, Badge, ActionIcon, Tooltip, Alert } from '@mantine/core'
import {
  IconEdit,
  IconEye,
  IconPlus,
  IconDeviceFloppy,
  IconShare,
  IconLock,
} from '@tabler/icons-react'
import { useDashboardStore } from '@/store/dashboard.store'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import {
  saveDashboardToStorage,
} from '@/services/dashboard.service'
import { useFilterStore } from '@/store/filter.store'
import { ShareModal } from './ShareModal'

export function DashboardToolbar() {
  const { dashboard, widgets, isEditMode, isDirty, isSaving, isSharedView, setEditMode } =
    useDashboardStore()
  const openWizard = useWidgetWizardStore((s) => s.openWizard)
  const filters = useFilterStore((s) => s.filters)
  const [shareOpen, setShareOpen] = useState(false)

  const handleSave = () => {
    if (!dashboard) return
    saveDashboardToStorage({ dashboard, widgets: Object.values(widgets), filters })
    useDashboardStore.getState().markSaved()
  }

  // Shared / embed view — show read-only banner only
  if (isSharedView) {
    return (
      <Alert
        icon={<IconLock size={14} />}
        color="blue"
        variant="light"
        p="xs"
        radius={0}
        style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
      >
        <Group gap="xs">
          <Text size="xs" fw={500}>Shared view</Text>
          <Text size="xs" c="dimmed">— read-only, changes are not saved</Text>
        </Group>
      </Alert>
    )
  }

  return (
    <>
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

          <Tooltip label="Share or export this dashboard">
            <Button
              size="xs"
              variant="light"
              leftSection={<IconShare size={14} />}
              onClick={() => setShareOpen(true)}
            >
              Share
            </Button>
          </Tooltip>

          <Tooltip label={isEditMode ? 'Switch to view mode' : 'Switch to edit mode'}>
            <ActionIcon
              aria-label={isEditMode ? 'Switch to view mode' : 'Switch to edit mode'}
              variant={isEditMode ? 'filled' : 'subtle'}
              color={isEditMode ? 'blue' : 'gray'}
              onClick={() => setEditMode(!isEditMode)}
            >
              {isEditMode ? <IconEye size={16} /> : <IconEdit size={16} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <ShareModal opened={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  )
}
