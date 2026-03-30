import { create } from 'zustand'
import type { Widget, Dashboard, DashboardLayout, GridLayoutItem } from '@/types'

interface DashboardState {
  dashboard: Dashboard | null
  widgets: Record<string, Widget>
  isEditMode: boolean
  isDirty: boolean
  isSaving: boolean
}

interface DashboardActions {
  setDashboard: (dashboard: Dashboard, widgets: Widget[]) => void
  setEditMode: (enabled: boolean) => void
  updateLayout: (layout: DashboardLayout) => void
  addWidget: (widget: Widget, layoutItem: GridLayoutItem) => void
  updateWidget: (id: string, partial: Partial<Widget>) => void
  removeWidget: (id: string) => void
  markSaved: () => void
  setIsSaving: (v: boolean) => void
}

type DashboardStore = DashboardState & DashboardActions

export const useDashboardStore = create<DashboardStore>()((set) => ({
  dashboard: null,
  widgets: {},
  isEditMode: false,
  isDirty: false,
  isSaving: false,

  setDashboard: (dashboard, widgetList) => {
    const widgets = Object.fromEntries(widgetList.map((w) => [w.id, w]))
    set({ dashboard, widgets, isDirty: false })
  },

  setEditMode: (enabled) => set({ isEditMode: enabled }),

  updateLayout: (layout) =>
    set((state) =>
      state.dashboard
        ? { dashboard: { ...state.dashboard, layout }, isDirty: true }
        : {},
    ),

  addWidget: (widget, layoutItem) =>
    set((state) => {
      if (!state.dashboard) return {}
      const layout = { ...state.dashboard.layout }
      layout.lg = [...(layout.lg ?? []), layoutItem]
      return {
        widgets: { ...state.widgets, [widget.id]: widget },
        dashboard: {
          ...state.dashboard,
          layout,
          widgetIds: [...state.dashboard.widgetIds, widget.id],
        },
        isDirty: true,
      }
    }),

  updateWidget: (id, partial) =>
    set((state) => ({
      widgets: {
        ...state.widgets,
        [id]: { ...state.widgets[id], ...partial } as Widget,
      },
      isDirty: true,
    })),

  removeWidget: (id) =>
    set((state) => {
      const { [id]: _removed, ...remaining } = state.widgets
      const dashboard = state.dashboard
      if (!dashboard) return {}
      const layout: DashboardLayout = {
        lg: dashboard.layout.lg.filter((i) => i.i !== id),
        md: dashboard.layout.md.filter((i) => i.i !== id),
        sm: dashboard.layout.sm.filter((i) => i.i !== id),
        xs: dashboard.layout.xs.filter((i) => i.i !== id),
      }
      return {
        widgets: remaining,
        dashboard: {
          ...dashboard,
          layout,
          widgetIds: dashboard.widgetIds.filter((wid) => wid !== id),
        },
        isDirty: true,
      }
    }),

  markSaved: () => set({ isDirty: false }),
  setIsSaving: (v) => set({ isSaving: v }),
}))
