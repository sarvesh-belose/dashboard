import { useCallback, useEffect, useRef } from 'react'
import { useDashboardStore } from '@/store/dashboard.store'
import { useFilterStore } from '@/store/filter.store'
import {
  saveDashboardToStorage,
  loadDashboardFromStorage,
  createDefaultDashboard,
} from '@/services/dashboard.service'
import { decodeDashboard } from '@/services/share.service'
import type { DashboardLayout, Filter } from '@/types'

const AUTO_SAVE_DEBOUNCE = 1500

export function useDashboardLayout() {
  const { dashboard, widgets, isDirty, isEditMode, isSharedView, setDashboard, updateLayout, markSaved, setIsSaving, setSharedView } =
    useDashboardStore()
  const initFilters = useFilterStore((s) => s.initFilters)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load on mount — check for shareable URL hash first
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#s=')) {
      const data = decodeDashboard(hash)
      if (data) {
        const params = new URLSearchParams(hash.slice(1))
        const role = params.get('role') ?? 'viewer'
        setDashboard(data.dashboard, data.widgets)
        initFilters(data.filters as Filter[])
        setSharedView(role)   // sets isSharedView=true + sharedViewRole; RBAC handled in useRbac
        return  // skip localStorage load
      }
    }
    // Normal load from localStorage
    const saved = loadDashboardFromStorage()
    const localData = saved ?? createDefaultDashboard()
    setDashboard(localData.dashboard, localData.widgets)
    initFilters(localData.filters as Filter[])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save when dirty — skip in shared view
  useEffect(() => {
    if (isSharedView || !isDirty || !dashboard) return
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
  }, [isDirty, isSharedView, dashboard, widgets, markSaved, setIsSaving])

  const onLayoutChange = useCallback(
    (_layout: unknown, allLayouts: DashboardLayout) => {
      if (!isSharedView) updateLayout(allLayouts)
    },
    [updateLayout, isSharedView],
  )

  return { dashboard, isEditMode, isSharedView, onLayoutChange }
}
