import type { ChartType } from '@/types'

// ---------------------------------------------------------------------------
// Chart type families — every decision about data format, mapping fields,
// validation, and Highcharts options is driven by family membership.
// ---------------------------------------------------------------------------

export const CHART_FAMILIES = {
  STANDARD:  ['line', 'spline', 'area', 'bar', 'column', 'waterfall'] as const,
  PIE:       ['pie', 'donut', 'funnel', 'pyramid']                    as const,
  SCATTER:   ['scatter']                                               as const,
  BUBBLE:    ['bubble']                                                as const,
  HEATMAP:   ['heatmap']                                              as const,
  GAUGE:     ['gauge', 'solidgauge']                                  as const,
  TREEMAP:   ['treemap']                                              as const,
} satisfies Record<string, readonly ChartType[]>

export type ChartFamily = keyof typeof CHART_FAMILIES

export function getChartFamily(type: ChartType): ChartFamily {
  for (const [family, types] of Object.entries(CHART_FAMILIES)) {
    if ((types as readonly string[]).includes(type)) return family as ChartFamily
  }
  return 'STANDARD'
}

// ---------------------------------------------------------------------------
// Human-readable metadata for each chart type
// ---------------------------------------------------------------------------

export interface ChartTypeMeta {
  label: string
  icon: string
  description: string
  family: ChartFamily
  dataExample: string   // one-liner data shape description
  sampleApiPath: string // pre-filled demo API path
}

export const CHART_TYPE_META: Record<ChartType, ChartTypeMeta> = {
  line: {
    label: 'Line', icon: '📈', family: 'STANDARD',
    description: 'Show trends over time with connected data points',
    dataExample: 'series[].data = [100, 200, 300] + categories',
    sampleApiPath: 'http://localhost:3000/api/sales/monthly',
  },
  spline: {
    label: 'Spline', icon: '〰', family: 'STANDARD',
    description: 'Smooth curved lines — ideal for continuous data',
    dataExample: 'series[].data = [100, 200, 300] + categories',
    sampleApiPath: 'http://localhost:3000/api/sales/weekly',
  },
  area: {
    label: 'Area', icon: '🏔', family: 'STANDARD',
    description: 'Highlight volume and cumulative values below a line',
    dataExample: 'series[].data = [100, 200, 300] + categories',
    sampleApiPath: 'http://localhost:3000/api/sales/monthly',
  },
  bar: {
    label: 'Bar', icon: '📊', family: 'STANDARD',
    description: 'Horizontal bars — great for comparing categories',
    dataExample: 'series[].data = [100, 200, 300] + categories',
    sampleApiPath: 'http://localhost:3000/api/pipeline',
  },
  column: {
    label: 'Column', icon: '📉', family: 'STANDARD',
    description: 'Vertical bars — classic comparison chart',
    dataExample: 'series[].data = [100, 200, 300] + categories',
    sampleApiPath: 'http://localhost:3000/api/sales/monthly',
  },
  waterfall: {
    label: 'Waterfall', icon: '🌊', family: 'STANDARD',
    description: 'Show how an initial value increases and decreases to a final value',
    dataExample: 'series[].data = [{name, y, isSum?}] + categories',
    sampleApiPath: 'http://localhost:3000/api/waterfall/revenue',
  },
  pie: {
    label: 'Pie', icon: '🥧', family: 'PIE',
    description: 'Show proportions as slices of a whole',
    dataExample: 'series[].data = [{name, y}]',
    sampleApiPath: 'http://localhost:3000/api/sales/by-region',
  },
  donut: {
    label: 'Donut', icon: '🍩', family: 'PIE',
    description: 'Pie chart with a hollow centre — modern look',
    dataExample: 'series[].data = [{name, y}]',
    sampleApiPath: 'http://localhost:3000/api/sales/by-product',
  },
  funnel: {
    label: 'Funnel', icon: '📐', family: 'PIE',
    description: 'Visualise stage-by-stage drop-off in a process',
    dataExample: 'series[].data = [{name, y}]',
    sampleApiPath: 'http://localhost:3000/api/funnel/deals',
  },
  pyramid: {
    label: 'Pyramid', icon: '🔺', family: 'PIE',
    description: 'Hierarchical proportions in a triangular layout',
    dataExample: 'series[].data = [{name, y}]',
    sampleApiPath: 'http://localhost:3000/api/funnel/deals',
  },
  scatter: {
    label: 'Scatter', icon: '✦', family: 'SCATTER',
    description: 'Plot [x, y] pairs to reveal correlations',
    dataExample: 'series[].data = [[x, y], [x, y], …]',
    sampleApiPath: 'http://localhost:3000/api/scatter/performance',
  },
  bubble: {
    label: 'Bubble', icon: '🫧', family: 'BUBBLE',
    description: 'Scatter plot where bubble size encodes a third variable',
    dataExample: 'series[].data = [{x, y, z, name?}, …]',
    sampleApiPath: 'http://localhost:3000/api/bubble/market',
  },
  heatmap: {
    label: 'Heatmap', icon: '🌡', family: 'HEATMAP',
    description: 'Show intensity across a 2-D grid using colour',
    dataExample: 'series[].data = [[colIdx, rowIdx, value], …]',
    sampleApiPath: 'http://localhost:3000/api/heatmap/weekly',
  },
  gauge: {
    label: 'Gauge', icon: '⏱', family: 'GAUGE',
    description: 'Display a single KPI against a min/max scale',
    dataExample: 'single number at a path, e.g. data.value',
    sampleApiPath: 'http://localhost:3000/api/gauge/performance',
  },
  solidgauge: {
    label: 'Solid Gauge', icon: '🔵', family: 'GAUGE',
    description: 'Filled arc gauge — clean KPI display',
    dataExample: 'single number at a path, e.g. data.value',
    sampleApiPath: 'http://localhost:3000/api/gauge/performance',
  },
  treemap: {
    label: 'Treemap', icon: '🗂', family: 'TREEMAP',
    description: 'Nested rectangles sized by value — great for hierarchies',
    dataExample: 'series[].data = [{name, value, parent?}, …]',
    sampleApiPath: 'http://localhost:3000/api/treemap/products',
  },
}
