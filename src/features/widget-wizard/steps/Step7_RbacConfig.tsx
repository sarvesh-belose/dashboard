import { Stack, Text, MultiSelect, Alert } from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { useAuthStore } from '@/store/auth.store'
import { DEFAULT_ROLES } from '@/constants/roles.constants'
import { isAdmin } from '@/utils/rbac.utils'

export function Step7_RbacConfig() {
  const { draft, updateDraft } = useWidgetWizardStore()
  const currentUser = useAuthStore((s) => s.currentUser)
  const storedRoles = useAuthStore((s) => s.roles)
  const roles = storedRoles.length ? storedRoles : DEFAULT_ROLES
  const selectedRoles = (draft.roles as string[]) ?? []

  return (
    <Stack gap="md">
      <Text fw={600} size="sm">Visibility Permissions</Text>
      <Text size="xs" c="dimmed">
        Leave empty to make this widget visible to all users. Select specific roles to restrict visibility.
      </Text>

      {isAdmin(currentUser) && (
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          As an admin, you will always see this widget regardless of the roles selected below.
        </Alert>
      )}

      <MultiSelect
        label="Visible to roles"
        placeholder="All roles (no restriction)"
        data={roles.map((r) => ({ value: r.id, label: r.label }))}
        value={selectedRoles}
        onChange={(v) => updateDraft({ roles: v })}
        clearable
        searchable
        size="sm"
      />
    </Stack>
  )
}
