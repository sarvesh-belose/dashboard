import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Role } from '@/types'

interface AuthState {
  currentUser: User | null
  accessToken: string | null
  roles: Role[]
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  setUser: (user: User, token: string) => void
  setRoles: (roles: Role[]) => void
  logout: () => void
  /** Set a synthetic read-only user for shared/embed views. Does not persist. */
  setSharedUser: (role: string) => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      currentUser: null,
      accessToken: null,
      roles: [],
      isAuthenticated: false,
      isLoading: false,

      setUser: (user, token) =>
        set({ currentUser: user, accessToken: token, isAuthenticated: true }),

      setRoles: (roles) => set({ roles }),

      logout: () =>
        set({ currentUser: null, accessToken: null, isAuthenticated: false }),

      setSharedUser: (role) => {
        const roleIds = role === 'all'
          ? ['admin', 'manager', 'user', 'viewer']
          : [role]
        set({
          currentUser: { id: 'shared', name: 'Shared View', email: '', roleIds },
          accessToken: null,
          isAuthenticated: false,
        })
      },
    }),
    { name: 'dashboard-auth' },
  ),
)
