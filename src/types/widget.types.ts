import type { ApiConfig, ResponseMapping, ChartResponseMapping, GridResponseMapping } from './api.types'
import type { FilterBinding } from './filter.types'
import type { ChartConfig } from './chart.types'
import type { GridConfig } from './grid.types'

export type WidgetType = 'chart' | 'grid' | 'text' | 'custom'

export interface WidgetBase {
  id: string
  type: WidgetType
  title: string
  description?: string
  roles: string[] // empty = visible to all
  filterBindings: FilterBinding[]
  createdAt: string
  updatedAt: string
}

export interface ApiBackedWidget extends WidgetBase {
  apiConfig: ApiConfig
  responseMapping: ResponseMapping
}

export interface ChartWidget extends ApiBackedWidget {
  type: 'chart'
  responseMapping: ChartResponseMapping
  chartConfig: ChartConfig
}

export interface GridWidget extends ApiBackedWidget {
  type: 'grid'
  responseMapping: GridResponseMapping
  gridConfig: GridConfig
}

export interface TextConfig {
  content: string // markdown with optional {{filterId}} interpolation
}

export interface TextWidget extends WidgetBase {
  type: 'text'
  textConfig: TextConfig
}

export interface CustomWidget extends WidgetBase {
  type: 'custom'
  componentKey: string
  componentProps: Record<string, unknown>
}

export type Widget = ChartWidget | GridWidget | TextWidget | CustomWidget

export interface WidgetRenderProps {
  widget: Widget
}
