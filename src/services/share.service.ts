import LZString from 'lz-string'
import type { DashboardData } from './dashboard.service'
import type { Widget } from '@/types'

export interface ShareOptions {
  /** Strip API auth credentials before encoding (default: true) */
  includeCredentials: boolean
  /** Role the recipient will be treated as (default: 'viewer') */
  viewRole: 'viewer' | 'user' | 'manager' | 'all'
}

// ---------------------------------------------------------------------------
// Credential stripping
// ---------------------------------------------------------------------------

function stripCredentials(widgets: Widget[]): Widget[] {
  return widgets.map((w) => {
    if (!('apiConfig' in w) || !w.apiConfig) return w
    return {
      ...w,
      apiConfig: {
        ...w.apiConfig,
        auth: { type: 'none' as const },
        headers: stripAuthHeaders(w.apiConfig.headers ?? {}),
      },
    } as Widget
  })
}

function stripAuthHeaders(headers: Record<string, string>): Record<string, string> {
  const sensitiveKeys = /^(authorization|x-api-key|api-key|token|secret|password)/i
  return Object.fromEntries(
    Object.entries(headers).filter(([k]) => !sensitiveKeys.test(k)),
  )
}

// ---------------------------------------------------------------------------
// Encode / decode  (lz-string → URL-safe compressed output)
// ---------------------------------------------------------------------------

export function encodeDashboard(
  data: DashboardData,
  opts: Pick<ShareOptions, 'includeCredentials'>,
): string {
  const payload: DashboardData = opts.includeCredentials
    ? data
    : { ...data, widgets: stripCredentials(data.widgets) }
  const json = JSON.stringify(payload)
  return LZString.compressToEncodedURIComponent(json)
}

export function decodeDashboard(hash: string): DashboardData | null {
  try {
    // Accept either the raw hash string "#s=..." or just the compressed value
    const raw = hash.startsWith('#') ? hash.slice(1) : hash
    const params = new URLSearchParams(raw)
    const encoded = params.get('s')
    if (!encoded) return null
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    return JSON.parse(json) as DashboardData
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Build shareable URL
// ---------------------------------------------------------------------------

/** Maximum recommended URL length; beyond this the share service warns the caller. */
export const SHARE_URL_WARN_LENGTH = 20_000

export function buildShareUrl(data: DashboardData, opts: ShareOptions): string {
  const encoded = encodeDashboard(data, opts)
  const origin = window.location.origin + window.location.pathname
  return `${origin}#s=${encoded}&role=${opts.viewRole}`
}

// ---------------------------------------------------------------------------
// Export / Import JSON helpers
// ---------------------------------------------------------------------------

export function exportDashboardJson(data: DashboardData, name: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dashboard-${name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importDashboardJson(file: File): Promise<DashboardData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as DashboardData
        // Basic shape validation
        if (!data.dashboard || !Array.isArray(data.widgets)) {
          throw new Error('Invalid dashboard JSON — missing dashboard or widgets fields.')
        }
        resolve(data)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsText(file)
  })
}
