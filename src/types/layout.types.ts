export interface GridLayoutItem {
  i: string // widget id
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
}

export interface DashboardLayout {
  lg: GridLayoutItem[]
  md: GridLayoutItem[]
  sm: GridLayoutItem[]
  xs: GridLayoutItem[]
}

export interface Dashboard {
  id: string
  name: string
  description?: string
  layout: DashboardLayout
  widgetIds: string[]
  filterIds: string[]
  createdAt: string
  updatedAt: string
  ownerId: string
}
