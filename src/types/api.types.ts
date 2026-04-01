export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type AuthType = 'none' | 'bearer' | 'api-key' | 'basic'

export interface BearerAuth {
  type: 'bearer'
  token: string // literal or ${env.VITE_MY_TOKEN} reference
}

export interface ApiKeyAuth {
  type: 'api-key'
  headerName: string // e.g. "X-API-Key"
  value: string
}

export interface BasicAuth {
  type: 'basic'
  username: string
  password: string
}

export type AuthConfig =
  | { type: 'none' }
  | BearerAuth
  | ApiKeyAuth
  | BasicAuth

export interface ApiConfig {
  url: string
  method: HttpMethod
  headers: Record<string, string>
  queryParams: Record<string, string>
  body?: string // JSON string
  auth: AuthConfig
  timeoutMs: number // used with AbortController
}

export interface FieldMapping {
  sourceField: string
  targetField: string
  transform?: 'string' | 'number' | 'date' | 'boolean'
}

export interface ResponseMapping {
  dataPath: string // JSONPath or dot-notation, e.g. "data.items"
  fieldMappings: FieldMapping[]
}

export interface ChartResponseMapping extends ResponseMapping {
  seriesPath: string
  categoriesPath?: string
  yCategoriesPath?: string     // HEATMAP y-axis labels
  gaugeValuePath?: string      // GAUGE — path to a single scalar
  seriesNameField: string
  seriesDataField: string
}

export interface GridResponseMapping extends ResponseMapping {
  rowsPath: string
  totalCountPath?: string
}

export interface HttpRequestConfig {
  url: string
  method: HttpMethod
  headers: Record<string, string>
  queryParams?: Record<string, string>
  body?: unknown
  timeoutMs?: number
}

export interface ResolvedFilterParams {
  queryParams: Record<string, string>
  bodyParams: Record<string, unknown>
}
