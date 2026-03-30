import { httpRequest } from '@/lib/http'
import { buildAuthHeaders } from '@/utils/auth-header-builder'
import type { ApiConfig, ResolvedFilterParams } from '@/types'

export interface ProxyRequestOptions {
  apiConfig: ApiConfig
  filterParams?: ResolvedFilterParams
}

export interface ProxyResponse {
  data: unknown
  status: number
  latencyMs: number
}

export async function executeWidgetRequest(
  options: ProxyRequestOptions,
): Promise<ProxyResponse> {
  const { apiConfig, filterParams } = options
  const authHeaders = buildAuthHeaders(apiConfig.auth)

  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...apiConfig.headers,
    ...authHeaders,
  }

  const mergedQueryParams: Record<string, string> = {
    ...apiConfig.queryParams,
    ...(filterParams?.queryParams ?? {}),
  }

  let bodyObj: unknown = undefined
  if (apiConfig.body) {
    try {
      bodyObj = JSON.parse(apiConfig.body)
    } catch {
      bodyObj = apiConfig.body
    }
    if (filterParams?.bodyParams && typeof bodyObj === 'object' && bodyObj !== null) {
      bodyObj = { ...(bodyObj as Record<string, unknown>), ...filterParams.bodyParams }
    }
  } else if (filterParams?.bodyParams && Object.keys(filterParams.bodyParams).length > 0) {
    bodyObj = filterParams.bodyParams
  }

  const start = Date.now()
  const data = await httpRequest({
    url: apiConfig.url,
    method: apiConfig.method,
    headers: mergedHeaders,
    queryParams: mergedQueryParams,
    body: bodyObj,
    timeoutMs: apiConfig.timeoutMs,
  })

  return { data, status: 200, latencyMs: Date.now() - start }
}
