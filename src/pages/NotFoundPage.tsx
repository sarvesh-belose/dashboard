import { Center, Stack, Title, Text, Button } from '@mantine/core'
import { IconError404 } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <Center h="100vh">
      <Stack align="center" gap="md">
        <IconError404 size={64} stroke={1} color="var(--mantine-color-dimmed)" />
        <Title order={2} c="dimmed">Page not found</Title>
        <Text c="dimmed" size="sm">The page you are looking for does not exist.</Text>
        <Button component={Link} to="/">Go to Dashboard</Button>
      </Stack>
    </Center>
  )
}
