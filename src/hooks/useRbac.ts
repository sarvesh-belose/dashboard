import { useAuthStore } from '@/store/auth.store'
import { canViewWidget, hasRole, hasAnyRole, isAdmin } from '@/utils/rbac.utils'
import type { Widget } from '@/types'

export function useRbac() {
  const currentUser = useAuthStore((s) => s.currentUser)

  return {
    currentUser,
    isAdmin: () => isAdmin(currentUser),
    hasRole: (roleId: string) => hasRole(currentUser, roleId),
    hasAnyRole: (roleIds: string[]) => hasAnyRole(currentUser, roleIds),
    canViewWidget: (widget: Widget) => canViewWidget(currentUser, widget),
  }
}
