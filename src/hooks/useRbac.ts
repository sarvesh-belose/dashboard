import { useAuthStore } from '@/store/auth.store'
import { useDashboardStore } from '@/store/dashboard.store'
import { canViewWidget, hasRole, hasAnyRole, isAdmin } from '@/utils/rbac.utils'
import type { User, Widget } from '@/types'

export function useRbac() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const isSharedView = useDashboardStore((s) => s.isSharedView)
  const sharedViewRole = useDashboardStore((s) => s.sharedViewRole)

  // In shared view, substitute a synthetic user with the chosen role.
  // This avoids touching the auth store (which uses `persist`) and ensures
  // a real user's credentials are never overwritten.
  const effectiveUser: User | null = isSharedView
    ? {
        id: 'shared',
        name: 'Shared View',
        email: '',
        roleIds: sharedViewRole === 'all'
          ? ['admin', 'manager', 'user', 'viewer']
          : sharedViewRole
          ? [sharedViewRole]
          : [],
      }
    : currentUser

  return {
    currentUser: effectiveUser,
    isAdmin: () => isAdmin(effectiveUser),
    hasRole: (roleId: string) => hasRole(effectiveUser, roleId),
    hasAnyRole: (roleIds: string[]) => hasAnyRole(effectiveUser, roleIds),
    canViewWidget: (widget: Widget) => canViewWidget(effectiveUser, widget),
  }
}
