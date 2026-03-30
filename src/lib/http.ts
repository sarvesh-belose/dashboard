import type { HttpMethod, HttpRequestConfig } from '@/types'

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`HTTP ${status}: ${body}`)
    this.name = 'HttpError'
  }
}

export async function httpRequest<T = unknown>(config: HttpRequestConfig): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(),
    config.timeoutMs ?? 10_000,
  )

  const url = buildUrl(config.url, config.queryParams)

  try {
    const res = await fetch(url, {
      method: config.method as HttpMethod,
      headers: config.headers,
      body: config.body != null ? JSON.stringify(config.body) : undefined,
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new HttpError(res.status, text)
    }

    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return (await res.json()) as T
    }
    return (await res.text()) as unknown as T
  } finally {
    clearTimeout(timer)
  }
}

function buildUrl(base: string, params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) return base
  const qs = new URLSearchParams(params).toString()
  return `${base}${base.includes('?') ? '&' : '?'}${qs}`
}

export function resolveEnvToken(value: string): string {
  return value.replace(/\$\{env\.([^}]+)\}/g, (_, key: string) => {
    return (process.env[key] as string | undefined) ?? ''
  })
}
