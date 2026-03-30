/**
 * Integration test: Widget Creation Flow (store level)
 *
 * Verifies the end-to-end store interactions for creating a widget via the
 * wizard and committing it to the dashboard store.
 */
import { act } from '@testing-library/react'
import { useDashboardStore } from '@/store/dashboard.store'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { WizardStep } from '@/constants/widget.constants'
import type { Dashboard, Widget, GridLayoutItem } from '@/types'

const makeDashboard = (): Dashboard => ({
  id: 'dash-1',
  name: 'Test Dashboard',
  layout: { lg: [], md: [], sm: [], xs: [] },
  widgetIds: [],
  filterIds: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ownerId: 'u1',
})

const makeTextWidget = (id: string): Widget =>
  ({
    id,
    type: 'text',
    title: 'My Text Widget',
    roles: [],
    filterBindings: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    textConfig: { content: '# Hello' },
  }) as Widget

const makeLayoutItem = (id: string): GridLayoutItem => ({
  i: id,
  x: 0,
  y: 0,
  w: 6,
  h: 4,
})

beforeEach(() => {
  act(() => {
    useDashboardStore.setState({ dashboard: null, widgets: {}, isEditMode: false, isDirty: false, isSaving: false })
    useWidgetWizardStore.getState().closeWizard()
  })
})

describe('Widget Creation flow', () => {
  it('full wizard flow: open → draft → commit → widget on dashboard', () => {
    // 1. Load a dashboard
    act(() => useDashboardStore.getState().setDashboard(makeDashboard(), []))

    // 2. Open the wizard
    act(() => useWidgetWizardStore.getState().openWizard())
    expect(useWidgetWizardStore.getState().isOpen).toBe(true)

    // 3. Fill in draft (type + title)
    act(() => {
      useWidgetWizardStore.getState().updateDraft({ type: 'text', title: 'My Text Widget' })
    })
    expect(useWidgetWizardStore.getState().draft.type).toBe('text')
    expect(useWidgetWizardStore.getState().draft.title).toBe('My Text Widget')

    // 4. Navigate through steps
    act(() => useWidgetWizardStore.getState().nextStep()) // SelectType → BasicInfo
    expect(useWidgetWizardStore.getState().currentStep).toBe(WizardStep.BasicInfo)
    expect(useWidgetWizardStore.getState().completedSteps.has(WizardStep.SelectType)).toBe(true)

    act(() => useWidgetWizardStore.getState().nextStep()) // BasicInfo → WidgetConfig (text skips API steps)
    expect(useWidgetWizardStore.getState().currentStep).toBe(WizardStep.WidgetConfig)

    // 5. Simulate saving — addWidget to dashboard store + close wizard
    const newWidget = makeTextWidget('test-uuid-1')
    const layoutItem = makeLayoutItem('test-uuid-1')

    act(() => {
      useDashboardStore.getState().addWidget(newWidget, layoutItem)
      useWidgetWizardStore.getState().closeWizard()
    })

    // 6. Verify widget is on the dashboard
    const state = useDashboardStore.getState()
    expect(state.widgets['test-uuid-1']).toEqual(newWidget)
    expect(state.dashboard?.widgetIds).toContain('test-uuid-1')
    expect(state.dashboard?.layout.lg).toHaveLength(1)
    expect(state.isDirty).toBe(true)

    // 7. Wizard is closed
    expect(useWidgetWizardStore.getState().isOpen).toBe(false)
    expect(useWidgetWizardStore.getState().draft).toEqual({})
  })

  it('editing an existing widget: open wizard with id → update draft → commit changes', () => {
    const existing = makeTextWidget('w1')
    act(() => useDashboardStore.getState().setDashboard(makeDashboard(), [existing]))

    // Open wizard for editing
    act(() => useWidgetWizardStore.getState().openWizard('w1', existing))
    expect(useWidgetWizardStore.getState().editingWidgetId).toBe('w1')
    expect(useWidgetWizardStore.getState().draft).toMatchObject({ title: 'My Text Widget' })

    // Modify the draft
    act(() => useWidgetWizardStore.getState().updateDraft({ title: 'Updated Title' }))
    expect(useWidgetWizardStore.getState().draft.title).toBe('Updated Title')

    // Apply update to dashboard store
    act(() => {
      useDashboardStore.getState().updateWidget('w1', { title: 'Updated Title' })
      useWidgetWizardStore.getState().closeWizard()
    })

    expect(useDashboardStore.getState().widgets['w1'].title).toBe('Updated Title')
    expect(useDashboardStore.getState().isDirty).toBe(true)
    expect(useWidgetWizardStore.getState().isOpen).toBe(false)
  })

  it('cancelling wizard does not modify dashboard', () => {
    act(() => useDashboardStore.getState().setDashboard(makeDashboard(), []))

    act(() => {
      useWidgetWizardStore.getState().openWizard()
      useWidgetWizardStore.getState().updateDraft({ type: 'chart', title: 'Abandoned Widget' })
    })

    // Cancel (close without saving)
    act(() => useWidgetWizardStore.getState().closeWizard())

    const state = useDashboardStore.getState()
    expect(state.dashboard?.widgetIds).toHaveLength(0)
    expect(Object.keys(state.widgets)).toHaveLength(0)
    expect(state.isDirty).toBe(false)
  })

  it('adding multiple widgets populates dashboard correctly', () => {
    act(() => useDashboardStore.getState().setDashboard(makeDashboard(), []))

    const w1 = makeTextWidget('w1')
    const w2 = makeTextWidget('w2')

    act(() => {
      useDashboardStore.getState().addWidget(w1, makeLayoutItem('w1'))
      useDashboardStore.getState().addWidget(w2, makeLayoutItem('w2'))
    })

    const state = useDashboardStore.getState()
    expect(Object.keys(state.widgets)).toHaveLength(2)
    expect(state.dashboard?.widgetIds).toContain('w1')
    expect(state.dashboard?.widgetIds).toContain('w2')
    expect(state.dashboard?.layout.lg).toHaveLength(2)
  })

  it('removing a widget cleans up layout and widgetIds', () => {
    act(() => useDashboardStore.getState().setDashboard(makeDashboard(), []))

    const w1 = makeTextWidget('w1')
    act(() => useDashboardStore.getState().addWidget(w1, makeLayoutItem('w1')))
    act(() => useDashboardStore.getState().removeWidget('w1'))

    const state = useDashboardStore.getState()
    expect(state.widgets['w1']).toBeUndefined()
    expect(state.dashboard?.widgetIds).not.toContain('w1')
    expect(state.dashboard?.layout.lg).toHaveLength(0)
  })
})
