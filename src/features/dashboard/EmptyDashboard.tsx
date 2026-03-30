import { Center, Stack, Title, Text, Button } from '@mantine/core'
import { IconLayoutDashboard } from '@tabler/icons-react'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { useDashboardStore } from '@/store/dashboard.store'

export function EmptyDashboard() {
  const openWizard = useWidgetWizardStore((s) => s.openWizard)
  const setEditMode = useDashboardStore((s) => s.setEditMode)

  const handleAdd = () => {
    setEditMode(true)
    openWizard()
  }

  return (
    <Center style={{ flex: 1, minHeight: 400 }}>
      <Stack align="center" gap="md">
        <IconLayoutDashboard size={64} stroke={1} color="var(--mantine-color-dimmed)" />
        <Title order={3} c="dimmed">
          No widgets yet
        </Title>
        <Text c="dimmed" size="sm" ta="center" maw={320}>
          Add your first widget to start building your personalised dashboard.
        </Text>
        <Button onClick={handleAdd} leftSection={<IconLayoutDashboard size={16} />}>
          Add Widget
        </Button>
      </Stack>
    </Center>
  )
}
