import { AppShell, Group, Text, ActionIcon, Tooltip, Avatar } from '@mantine/core'
import { Outlet } from 'react-router-dom'
import { IconLayoutDashboard, IconLogout } from '@tabler/icons-react'
import { useAuthStore } from '@/store/auth.store'

export function AppLayout() {
  const { currentUser, logout } = useAuthStore()

  return (
    <AppShell header={{ height: 52 }}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <IconLayoutDashboard size={20} color="var(--mantine-color-blue-6)" />
            <Text fw={700} size="sm">
              Dashboard Studio
            </Text>
          </Group>

          <Group gap="sm">
            {currentUser && (
              <>
                <Avatar size="sm" color="blue" radius="xl">
                  {currentUser.name.charAt(0).toUpperCase()}
                </Avatar>
                <Text size="sm">{currentUser.name}</Text>
                <Tooltip label="Sign out">
                  <ActionIcon variant="subtle" color="gray" onClick={logout}>
                    <IconLogout size={16} />
                  </ActionIcon>
                </Tooltip>
              </>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingTop: 52 }}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
