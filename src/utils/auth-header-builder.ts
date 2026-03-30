import { resolveEnvToken } from '@/lib/http'
import type { AuthConfig } from '@/types'

export function buildAuthHeaders(auth: AuthConfig): Record<string, string> {
  switch (auth.type) {
    case 'none':
      return {}

    case 'bearer': {
      const token = resolveEnvToken(auth.token)
      return { Authorization: `Bearer ${token}` }
    }

    case 'api-key': {
      const value = resolveEnvToken(auth.value)
      return { [auth.headerName]: value }
    }

    case 'basic': {
      const username = resolveEnvToken(auth.username)
      const password = resolveEnvToken(auth.password)
      const encoded = btoa(`${username}:${password}`)
      return { Authorization: `Basic ${encoded}` }
    }
  }
}
