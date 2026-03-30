import { ADMIN_ROLE_ID } from '@/constants/roles.constants'
import type { User, Widget } from '@/types'

export function hasRole(user: User | null, roleId: string): boolean {
  if (!user) return false
  return user.roleIds.includes(roleId)
}

export function hasAnyRole(user: User | null, roleIds: string[]): boolean {
  if (!user) return false
  return roleIds.some((r) => user.roleIds.includes(r))
}

export function isAdmin(user: User | null): boolean {
  return hasRole(user, ADMIN_ROLE_ID)
}

export function canViewWidget(user: User | null, widget: Widget): boolean {
  if (!user) return false
  if (isAdmin(user)) return true
  if (widget.roles.length === 0) return true
  return hasAnyRole(user, widget.roles)
}
