import type { ChartType } from '@/types'

// ---------------------------------------------------------------------------
// Extracted path node
// ---------------------------------------------------------------------------

export type PathNodeType =
  | 'array-of-objects'
  | 'array-of-primitives'
  | 'array-mixed'
  | 'object'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'

export interface PathNode {
  path: string
  type: PathNodeType
  length?: number       // arrays
  keys?: string[]       // array-of-objects: keys of first item
  preview: string
}

/** Walk the response up to maxDepth and collect every addressable path. */
export function extractPaths(obj: unknown, prefix = '', depth = 0, maxDepth = 5): PathNode[] {
  if (depth > maxDepth) return []
  const nodes: PathNode[] = []

  if (obj === null || obj === undefined) return nodes

  if (Array.isArray(obj)) {
    const type = classifyArray(obj)
    const node: PathNode = {
      path: prefix || '(root)',
      type,
      length: obj.length,
      preview: `Array[${obj.length}]`,
    }
    if (type === 'array-of-objects' && obj.length > 0) {
      node.keys = Object.keys(obj[0] as object)
      node.preview = `Array[${obj.length}] — keys: ${node.keys.slice(0, 4).join(', ')}${node.keys.length > 4 ? '…' : ''}`
    } else if (type === 'array-of-primitives' && obj.length > 0) {
      node.preview = `Array[${obj.length}] — e.g. ${JSON.stringify(obj[0])}`
    }
    if (prefix) nodes.push(node)

    // Recurse into object items (first item only for structure)
    if (type === 'array-of-objects' && obj.length > 0) {
      const first = obj[0] as Record<string, unknown>
      for (const key of Object.keys(first)) {
        const childPath = prefix ? `${prefix}[*].${key}` : key
        nodes.push(...extractPaths(first[key], childPath, depth + 1, maxDepth))
      }
    }
    return nodes
  }

  if (typeof obj === 'object') {
    const rec = obj as Record<string, unknown>
    if (prefix) {
      nodes.push({ path: prefix, type: 'object', preview: `Object{${Object.keys(rec).length}}` })
    }
    for (const [key, val] of Object.entries(rec)) {
      const childPath = prefix ? `${prefix}.${key}` : key
      nodes.push(...extractPaths(val, childPath, depth + 1, maxDepth))
    }
    return nodes
  }

  // Primitives — only include if they have a parent path (i.e., not root)
  if (prefix) {
    const type: PathNodeType = obj === null ? 'null' : (typeof obj as PathNodeType)
    nodes.push({ path: prefix, type, preview: JSON.stringify(obj) })
  }
  return nodes
}

function classifyArray(arr: unknown[]): PathNodeType {
  if (arr.length === 0) return 'array-of-primitives'
  const allObjects = arr.every((v) => v !== null && typeof v === 'object' && !Array.isArray(v))
  if (allObjects) return 'array-of-objects'
  const allPrimitive = arr.every((v) => typeof v !== 'object')
  if (allPrimitive) return 'array-of-primitives'
  return 'array-mixed'
}

// ---------------------------------------------------------------------------
// Path resolution (dot-notation only — no JSONPath for validation purposes)
// ---------------------------------------------------------------------------

export function resolveSimplePath(obj: unknown, path: string): unknown {
  if (!path || path === '(root)') return obj
  // strip [*] array wildcard for validation — just grab first element
  const cleaned = path.replace(/\[\*\]/g, '.0')
  return cleaned.split('.').reduce<unknown>((curr, key) => {
    if (curr == null || typeof curr !== 'object') return undefined
    if (Array.isArray(curr)) return (curr as unknown[])[Number(key)]
    return (curr as Record<string, unknown>)[key]
  }, obj)
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  ok: boolean
  warning: boolean   // true = passes but something looks off
  message: string
}

export function validateSeriesPath(
  response: unknown,
  path: string,
  chartType: ChartType,
): ValidationResult {
  if (!path) return { ok: false, warning: false, message: 'Required' }
  const value = resolveSimplePath(response, path)
  if (value === undefined) {
    return { ok: false, warning: false, message: `Path "${path}" not found in response` }
  }
  if (!Array.isArray(value)) {
    return { ok: false, warning: false, message: `Expected an array, got ${typeof value}` }
  }
  if (value.length === 0) {
    return { ok: true, warning: true, message: 'Array is empty — no data to display' }
  }
  const first = value[0]
  const isPieDonut = chartType === 'pie' || chartType === 'donut'

  if (typeof first !== 'object' || first === null) {
    return { ok: false, warning: false, message: 'Each series item must be an object with a data field' }
  }
  if (!('data' in (first as object))) {
    // Could be pie-style flat array — treat as warning
    return { ok: true, warning: true, message: 'Series items have no "data" field — check seriesDataField' }
  }

  const seriesData = (first as { data?: unknown }).data
  if (isPieDonut) {
    if (Array.isArray(seriesData) && seriesData.length > 0) {
      const firstDataItem = seriesData[0]
      if (typeof firstDataItem === 'number') {
        return {
          ok: false,
          warning: false,
          message: 'Chart type mismatch: Pie/Donut charts require data items with {name, y} fields, but this path contains plain numbers. Switch to a line/bar/area chart, or point to a different data path.',
        }
      }
    }
  } else {
    if (Array.isArray(seriesData) && seriesData.length > 0 && typeof seriesData[0] === 'object' && seriesData[0] !== null && 'y' in (seriesData[0] as object) && !('data' in (seriesData[0] as object))) {
      return {
        ok: false,
        warning: false,
        message: 'Chart type mismatch: This data contains {name, y} slice objects (Pie/Donut format). Switch to Pie or Donut chart type, or point to a different data path.',
      }
    }
  }

  return { ok: true, warning: false, message: `✓ Found ${value.length} series` }
}

export function validateCategoriesPath(response: unknown, path: string): ValidationResult {
  if (!path) return { ok: true, warning: false, message: 'Optional' }
  const value = resolveSimplePath(response, path)
  if (value === undefined) {
    return { ok: false, warning: false, message: `Path "${path}" not found in response` }
  }
  if (!Array.isArray(value)) {
    return { ok: false, warning: false, message: `Expected an array of strings/numbers, got ${typeof value}` }
  }
  if (value.length === 0) {
    return { ok: true, warning: true, message: 'Categories array is empty' }
  }
  const first = value[0]
  if (typeof first === 'object') {
    return { ok: false, warning: false, message: 'Categories should be strings or numbers, not objects' }
  }
  return { ok: true, warning: false, message: `✓ Found ${value.length} categories` }
}

export function validateRowsPath(response: unknown, path: string): ValidationResult {
  if (!path) return { ok: false, warning: false, message: 'Required' }
  const value = resolveSimplePath(response, path)
  if (value === undefined) {
    return { ok: false, warning: false, message: `Path "${path}" not found in response` }
  }
  if (!Array.isArray(value)) {
    return { ok: false, warning: false, message: `Expected an array of row objects, got ${typeof value}` }
  }
  if (value.length === 0) {
    return { ok: true, warning: true, message: 'Rows array is empty' }
  }
  if (typeof value[0] !== 'object' || value[0] === null) {
    return { ok: false, warning: false, message: 'Row items must be objects' }
  }
  return { ok: true, warning: false, message: `✓ Found ${value.length} rows` }
}
