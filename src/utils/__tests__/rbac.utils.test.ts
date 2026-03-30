import { hasRole, hasAnyRole, isAdmin, canViewWidget } from '../rbac.utils'
import { ADMIN_ROLE_ID } from '@/constants/roles.constants'
import type { User, Widget } from '@/types'

const makeUser = (roleIds: string[]): User => ({
  id: 'u1',
  name: 'Test User',
  email: 'test@example.com',
  roleIds,
})

const makeWidget = (roles: string[]): Widget =>
  ({
    id: 'w1',
    type: 'text',
    title: 'Test Widget',
    roles,
    filterBindings: [],
    createdAt: '',
    updatedAt: '',
    textConfig: { content: '' },
  }) as Widget

describe('rbac.utils', () => {
  describe('hasRole', () => {
    it('returns true when user has the role', () => {
      expect(hasRole(makeUser(['manager', 'user']), 'manager')).toBe(true)
    })

    it('returns false when user lacks the role', () => {
      expect(hasRole(makeUser(['user']), 'admin')).toBe(false)
    })

    it('returns false for null user', () => {
      expect(hasRole(null, 'admin')).toBe(false)
    })
  })

  describe('hasAnyRole', () => {
    it('returns true when user has at least one matching role', () => {
      expect(hasAnyRole(makeUser(['user']), ['admin', 'user'])).toBe(true)
    })

    it('returns false when user has none of the roles', () => {
      expect(hasAnyRole(makeUser(['viewer']), ['admin', 'manager'])).toBe(false)
    })

    it('returns false for empty roles array', () => {
      expect(hasAnyRole(makeUser(['admin']), [])).toBe(false)
    })
  })

  describe('isAdmin', () => {
    it('returns true when user has admin role', () => {
      expect(isAdmin(makeUser([ADMIN_ROLE_ID]))).toBe(true)
    })

    it('returns false when user does not have admin role', () => {
      expect(isAdmin(makeUser(['manager']))).toBe(false)
    })

    it('returns false for null user', () => {
      expect(isAdmin(null)).toBe(false)
    })
  })

  describe('canViewWidget', () => {
    it('returns true when widget.roles is empty (public widget)', () => {
      const user = makeUser(['user'])
      const widget = makeWidget([])
      expect(canViewWidget(user, widget)).toBe(true)
    })

    it('returns true when user role matches widget roles', () => {
      const user = makeUser(['manager'])
      const widget = makeWidget(['manager', 'admin'])
      expect(canViewWidget(user, widget)).toBe(true)
    })

    it('returns false when user role does not match widget roles', () => {
      const user = makeUser(['viewer'])
      const widget = makeWidget(['admin', 'manager'])
      expect(canViewWidget(user, widget)).toBe(false)
    })

    it('admin always sees restricted widgets', () => {
      const user = makeUser([ADMIN_ROLE_ID])
      const widget = makeWidget(['manager']) // manager-only widget
      expect(canViewWidget(user, widget)).toBe(true)
    })

    it('returns false for null user', () => {
      const widget = makeWidget([])
      expect(canViewWidget(null, widget)).toBe(false)
    })
  })
})
