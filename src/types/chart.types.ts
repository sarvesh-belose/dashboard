export type ChartType =
  | 'line'
  | 'bar'
  | 'column'
  | 'pie'
  | 'area'
  | 'scatter'
  | 'spline'
  | 'donut'

export interface ChartAxisConfig {
  title?: string
  categories?: string[]
}

export interface ChartConfig {
  chartType: ChartType
  title?: string
  xAxis?: ChartAxisConfig
  yAxis?: ChartAxisConfig
  legend?: { enabled: boolean; position: 'top' | 'bottom' | 'left' | 'right' }
  colors?: string[]
  stacking?: 'normal' | 'percent' | null
  showDataLabels: boolean
  height?: number
}

export interface ChartSeries {
  name: string
  data: number[] | Array<[string | number, number]>
  type?: ChartType
}
