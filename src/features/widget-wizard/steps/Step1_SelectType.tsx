import { SimpleGrid, Card, Text, Stack, ThemeIcon } from '@mantine/core'
import { WidgetRegistry } from '@/registry/WidgetRegistry'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { WizardStep } from '@/constants/widget.constants'
import type { WidgetType } from '@/types'

export function Step1_SelectType() {
  const { updateDraft, goToStep, draft } = useWidgetWizardStore()
  const entries = WidgetRegistry.getAll()

  const select = (type: WidgetType) => {
    updateDraft({ type })
    goToStep(WizardStep.BasicInfo)
  }

  return (
    <Stack gap="md">
      <Text fw={600}>Choose a widget type</Text>
      <SimpleGrid cols={2} spacing="sm">
        {entries.map((entry) => {
          const Icon = entry.icon
          const selected = draft.type === entry.type
          return (
            <Card
              key={entry.type}
              withBorder
              style={{ cursor: 'pointer', borderColor: selected ? 'var(--mantine-color-blue-6)' : undefined }}
              onClick={() => select(entry.type)}
              padding="md"
            >
              <Stack align="center" gap="xs">
                <ThemeIcon size="xl" variant={selected ? 'filled' : 'light'} color="blue">
                  <Icon size={22} />
                </ThemeIcon>
                <Text size="sm" fw={500}>{entry.label}</Text>
              </Stack>
            </Card>
          )
        })}
      </SimpleGrid>
    </Stack>
  )
}
