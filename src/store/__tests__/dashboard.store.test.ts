import { act } from '@testing-library/react'
import { useDashboardStore } from '../dashboard.store'
import type { Dashboard, Widget, GridLayoutItem } from '@/types'

const makeDashboard = (): Dashboard => ({
  id: 'dash-1',
  name: 'Test Dashboard',
  layout: { lg: [], md: [], sm: [], xs: [] },
  widgetIds: [],
  filterIds: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ownerId: 'user-1',
})

const makeTextWidget = (id: string): Widget =>
  ({
    id,
    type: 'text',
    title: `Widget ${id}`,
    roles: [],
    filterBindings: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    textConfig: { content: 'Hello' },
  }) as Widget

const makeLayoutItem = (id: string): GridLayoutItem => ({
  i: id,
  x: 0,
  y: 0,
  w: 4,
  h: 3,
})

beforeEach(() => {
  act(() => {
    useDashboardStore.setState({
      dashboard: null,
      widgets: {},
      isEditMode: false,
      isDirty: false,
      isSaving: false,
    })
  })
})

describe('dashboard.store', () => {
  describe('setDashboard', () => {
    it('normalizes widgets into a Record keyed by id', () => {
      const w1 = makeTextWidget('w1')
      const w2 = makeTextWidget('w2')
      act(() => useDashboardStore.getState().setDashboard(makeDashboard(), [w1, w2]))

      const { widgets } = useDashboardStore.getState()
      expect(Object.keys(widgets)).toHaveLength(2)
      expect(widgets['w1']).toEqual(w1)
    })

    it('resets isDirty flag', () => {
      act(() => useDashboardStore.setState({ isDirty: true }))
      act(() => useDashboardStore.getState().setDashboard(makeDashboard(), []))
      expect(useDashboardStore.getState().isDirty).toBe(false)
    })
  })

  describe('setEditMode', () => {
    it('toggles edit mode', () => {
      act(() => useDashboardStore.getState().setEditMode(true))
      expect(useDashboardStore.getState().isEditMode).toBe(true)
      act(() => useDashboardStore.getState().setEditMode(false))
      expect(useDashboardStore.getState().isEditMode).toBe(false)
    })
  })

  describe('addWidget', () => {
    it('adds widget to store and updates layout + widgetIds', () => {
      act(() => useDashboardStore.getState().setDashboard(makeDashboard(), []))
      const widget = makeTextWidget('w1')
      const layoutItem = makeLayoutItem('w1')

      act(() => useDashboardStore.getState().addWidget(widget, layoutItem))

      const state = useDashboardStore.getState()
      expect(state.widgets['w1']).toEqual(widget)
      expect(state.dashboard?.widgetIds).toContain('w1')
      expect(state.dashboard?.layout.lg).toHaveLength(1)
      expect(state.isDirty).toBe(true)
    })
  })

  describe('updateWidget', () => {
    it('merges partial update into existing widget', () => {
      act(() => {
        useDashboardStore.getState().setDashboard(makeDashboard(), [makeTextWidget('w1')])
      })
      act(() => useDashboardStore.getState().updateWidget('w1', { title: 'Updated Title' }))
      expect(useDashboardStore.getState().widgets['w1'].title).toBe('Updated Title')
      expect(useDashboardStore.getState().isDirty).toBe(true)
    })
  })

  describe('removeWidget', () => {
    it('removes widget from store, layout, and widgetIds', () => {
      const widget = makeTextWidget('w1')
      act(() => useDashboardStore.getState().setDashboard(makeDashboard(), []))
      act(() => useDashboardStore.getState().addWidget(widget, makeLayoutItem('w1')))
      act(() => useDashboardStore.getState().removeWidget('w1'))

      const state = useDashboardStore.getState()
      expect(state.widgets['w1']).toBeUndefined()
      expect(state.dashboard?.widgetIds).not.toContain('w1')
      expect(state.dashboard?.layout.lg).toHaveLength(0)
    })
  })

  describe('updateLayout', () => {
    it('updates layout and marks dirty', () => {
      act(() => useDashboardStore.getState().setDashboard(makeDashboard(), []))
      const newLayout = { lg: [makeLayoutItem('w1')], md: [], sm: [], xs: [] }
      act(() => useDashboardStore.getState().updateLayout(newLayout))

      const state = useDashboardStore.getState()
      expect(state.dashboard?.layout.lg).toHaveLength(1)
      expect(state.isDirty).toBe(true)
    })
  })

  describe('markSaved', () => {
    it('resets isDirty to false', () => {
      act(() => useDashboardStore.setState({ isDirty: true }))
      act(() => useDashboardStore.getState().markSaved())
      expect(useDashboardStore.getState().isDirty).toBe(false)
    })
  })
})
