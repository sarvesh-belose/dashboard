import { useCallback, useEffect, useRef } from 'react'
import { useDashboardStore } from '@/store/dashboard.store'
import { useFilterStore } from '@/store/filter.store'
import {
  saveDashboardToStorage,
  loadDashboardFromStorage,
  createDefaultDashboard,
} from '@/services/dashboard.service'
import type { DashboardLayout, Filter } from '@/types'

const AUTO_SAVE_DEBOUNCE = 1500

export function useDashboardLayout() {
  const { dashboard, widgets, isDirty, isEditMode, setDashboard, updateLayout, markSaved, setIsSaving } =
    useDashboardStore()
  const initFilters = useFilterStore((s) => s.initFilters)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load on mount
  useEffect(() => {
    const saved = loadDashboardFromStorage()
    const data = saved ?? createDefaultDashboard()
    setDashboard(data.dashboard, data.widgets)
    initFilters(data.filters as Filter[])
  }, [setDashboard, initFilters])

  // Auto-save when dirty
  useEffect(() => {
    if (!isDirty || !dashboard) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      setIsSaving(true)
      try {
        const filters = useFilterStore.getState().filters
        saveDashboardToStorage({ dashboard, widgets: Object.values(widgets), filters })
        markSaved()
      } finally {
        setIsSaving(false)
      }
    }, AUTO_SAVE_DEBOUNCE)

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [isDirty, dashboard, widgets, markSaved, setIsSaving])

  const onLayoutChange = useCallback(
    (_layout: unknown, allLayouts: DashboardLayout) => {
      updateLayout(allLayouts)
    },
    [updateLayout],
  )

  return { dashboard, isEditMode, onLayoutChange }
}
