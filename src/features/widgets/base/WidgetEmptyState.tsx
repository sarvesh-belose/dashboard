import { Center, Stack, Text } from '@mantine/core'
import { IconChartBar } from '@tabler/icons-react'

interface Props {
  message?: string
}

export function WidgetEmptyState({ message = 'No data available' }: Props) {
  return (
    <Center style={{ height: '100%' }}>
      <Stack align="center" gap="xs">
        <IconChartBar size={40} stroke={1} color="var(--mantine-color-dimmed)" />
        <Text size="sm" c="dimmed">
          {message}
        </Text>
      </Stack>
    </Center>
  )
}
