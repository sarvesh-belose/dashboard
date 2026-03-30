import { Skeleton, Stack } from '@mantine/core'

export function WidgetLoadingState() {
  return (
    <Stack gap="xs" p="xs" style={{ height: '100%' }}>
      <Skeleton height={12} radius="xl" />
      <Skeleton height={12} radius="xl" width="80%" />
      <Skeleton height={12} radius="xl" width="60%" />
      <Skeleton height="100%" radius="sm" style={{ flex: 1 }} />
    </Stack>
  )
}
