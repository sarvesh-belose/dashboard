import type { Dashboard, Widget, Filter } from '@/types'

const STORAGE_KEY = 'dashboard-data'

export interface DashboardData {
  dashboard: Dashboard
  widgets: Widget[]
  filters: Filter[]
}

export function saveDashboardToStorage(data: DashboardData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function loadDashboardFromStorage(): DashboardData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DashboardData
  } catch {
    return null
  }
}

export function createDefaultDashboard(): DashboardData {
  const now = new Date().toISOString()
  return {
    dashboard: {
      id: crypto.randomUUID(),
      name: 'My Dashboard',
      layout: { lg: [], md: [], sm: [], xs: [] },
      widgetIds: [],
      filterIds: [],
      createdAt: now,
      updatedAt: now,
      ownerId: '',
    },
    widgets: [],
    filters: [],
  }
}
