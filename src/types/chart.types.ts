// ---------------------------------------------------------------------------
// Chart type union — 15 types across 7 families
// ---------------------------------------------------------------------------

export type ChartType =
  // STANDARD family — series[].data = number[], + categories[]
  | 'line' | 'spline' | 'area' | 'bar' | 'column' | 'waterfall'
  // PIE family — series[].data = [{name, y}]
  | 'pie' | 'donut' | 'funnel' | 'pyramid'
  // SCATTER — series[].data = [[x, y]]
  | 'scatter'
  // BUBBLE — series[].data = [{x, y, z, name?}]
  | 'bubble'
  // HEATMAP — series[].data = [[colIdx, rowIdx, value]]
  | 'heatmap'
  // GAUGE — single scalar number
  | 'gauge' | 'solidgauge'
  // TREEMAP — series[].data = [{name, value, parent?, id?}]
  | 'treemap'

// ---------------------------------------------------------------------------
// Gauge plot band (danger / warning / success zones)
// ---------------------------------------------------------------------------

export interface GaugePlotBand {
  from: number
  to: number
  color: string
  label?: string
}

// ---------------------------------------------------------------------------
// Main chart configuration — covers all families
// ---------------------------------------------------------------------------

export interface ChartConfig {
  chartType: ChartType

  // ── Common ──────────────────────────────────────────────────────────────
  title?: string
  subtitle?: string
  height?: number           // pixels, default 300
  showDataLabels: boolean
  colors?: string[]         // custom palette
  legend?: {
    enabled: boolean
    position: 'top' | 'bottom' | 'left' | 'right'
  }
  tooltip?: {
    enabled: boolean
    valueSuffix?: string
    valuePrefix?: string
  }

  // ── Axes (STANDARD + HEATMAP) ────────────────────────────────────────────
  xAxis?: { title?: string }
  yAxis?: { title?: string; min?: number; max?: number }

  // ── STANDARD family ──────────────────────────────────────────────────────
  stacking?: 'normal' | 'percent' | null

  // ── WATERFALL (within STANDARD) ──────────────────────────────────────────
  waterfall?: { upColor?: string; color?: string }

  // ── PIE family ───────────────────────────────────────────────────────────
  pie?: {
    innerSize?: string          // e.g. '50%' makes it a donut
    startAngle?: number
    allowPointSelect?: boolean
  }

  // ── GAUGE family ─────────────────────────────────────────────────────────
  gauge?: {
    min: number
    max: number
    startAngle?: number
    endAngle?: number
    plotBands?: GaugePlotBand[]
  }

  // ── HEATMAP ──────────────────────────────────────────────────────────────
  colorAxis?: {
    min?: number
    max?: number
    minColor?: string   // e.g. '#ffffff'
    maxColor?: string   // e.g. '#003399'
  }

  // ── BUBBLE ───────────────────────────────────────────────────────────────
  bubble?: {
    minSize?: number    // px
    maxSize?: number    // px
    displayNegative?: boolean
  }
}

// ---------------------------------------------------------------------------
// Series shape — widened to accept all family formats
// ---------------------------------------------------------------------------

export interface ChartSeries {
  name: string
  data: unknown[]   // family-specific — see CHART_FAMILIES for expected shape
  type?: string
  color?: string
  // Attached by response-mapper for heatmap
  yCategories?: string[]
}
