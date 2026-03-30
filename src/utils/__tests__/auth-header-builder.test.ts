import { buildAuthHeaders } from '../auth-header-builder'
import type { AuthConfig } from '@/types'

describe('buildAuthHeaders', () => {
  describe('none', () => {
    it('returns empty headers', () => {
      const auth: AuthConfig = { type: 'none' }
      expect(buildAuthHeaders(auth)).toEqual({})
    })
  })

  describe('bearer', () => {
    it('returns Authorization header with Bearer prefix', () => {
      const auth: AuthConfig = { type: 'bearer', token: 'mytoken123' }
      expect(buildAuthHeaders(auth)).toEqual({
        Authorization: 'Bearer mytoken123',
      })
    })

    it('resolves env var references in token', () => {
      process.env.TEST_TOKEN = 'resolved-secret'
      const auth: AuthConfig = { type: 'bearer', token: '${env.TEST_TOKEN}' }
      expect(buildAuthHeaders(auth)).toEqual({
        Authorization: 'Bearer resolved-secret',
      })
      delete process.env.TEST_TOKEN
    })

    it('returns empty string when env var is not set', () => {
      delete process.env.MISSING_VAR
      const auth: AuthConfig = { type: 'bearer', token: '${env.MISSING_VAR}' }
      const headers = buildAuthHeaders(auth)
      expect(headers.Authorization).toBe('Bearer ')
    })
  })

  describe('api-key', () => {
    it('returns custom header with API key value', () => {
      const auth: AuthConfig = {
        type: 'api-key',
        headerName: 'X-API-Key',
        value: 'key-abc-123',
      }
      expect(buildAuthHeaders(auth)).toEqual({ 'X-API-Key': 'key-abc-123' })
    })

    it('uses custom header name', () => {
      const auth: AuthConfig = {
        type: 'api-key',
        headerName: 'Authorization',
        value: 'ApiKey xyz',
      }
      expect(buildAuthHeaders(auth)).toEqual({ Authorization: 'ApiKey xyz' })
    })
  })

  describe('basic', () => {
    it('returns base64-encoded Basic auth header', () => {
      const auth: AuthConfig = {
        type: 'basic',
        username: 'admin',
        password: 'secret',
      }
      const expected = `Basic ${btoa('admin:secret')}`
      expect(buildAuthHeaders(auth)).toEqual({ Authorization: expected })
    })

    it('handles special characters in credentials', () => {
      const auth: AuthConfig = {
        type: 'basic',
        username: 'user@example.com',
        password: 'p@ss:word!',
      }
      const expected = `Basic ${btoa('user@example.com:p@ss:word!')}`
      expect(buildAuthHeaders(auth)).toEqual({ Authorization: expected })
    })
  })
})
