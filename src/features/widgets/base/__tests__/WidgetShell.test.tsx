import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WidgetShell } from '../WidgetShell'
import { useDashboardStore } from '@/store/dashboard.store'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { useAuthStore } from '@/store/auth.store'
import { WidgetRegistry } from '@/registry/WidgetRegistry'
import type { Widget, Dashboard, User } from '@/types'

// Mock WidgetRegistry
jest.mock('@/registry/WidgetRegistry', () => ({
  WidgetRegistry: {
    get: jest.fn(),
  },
}))

const MockWidgetComponent = ({ widget }: { widget: Widget }) => (
  <div data-testid="widget-content">{widget.title}</div>
)

const mockEntry = {
  type: 'text' as const,
  label: 'Text',
  component: MockWidgetComponent,
  wizardSteps: [],
  defaultConfig: () => ({}),
}

const makeDashboard = (): Dashboard => ({
  id: 'dash-1',
  name: 'Test',
  layout: { lg: [], md: [], sm: [], xs: [] },
  widgetIds: ['w1'],
  filterIds: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ownerId: 'user-1',
})

const makeWidget = (roles: string[] = []): Widget =>
  ({
    id: 'w1',
    type: 'text',
    title: 'My Widget',
    roles,
    filterBindings: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    textConfig: { content: 'hello' },
  }) as Widget

const makeUser = (...roleIds: string[]): User => ({
  id: 'u1',
  name: 'Test User',
  email: 'test@test.com',
  roleIds,
})

const createClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } })

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createClient()}>
    <MantineProvider>{children}</MantineProvider>
  </QueryClientProvider>
)

beforeEach(() => {
  ;(WidgetRegistry.get as jest.Mock).mockReturnValue(mockEntry)
  act(() => {
    useDashboardStore.setState({ dashboard: null, widgets: {}, isEditMode: false, isDirty: false, isSaving: false })
    useWidgetWizardStore.getState().closeWizard()
    useAuthStore.setState({ currentUser: makeUser('viewer'), roles: [], isAuthenticated: true })
  })
})

describe('WidgetShell', () => {
  it('renders nothing when widget is not found in store', () => {
    render(<WidgetShell widgetId="nonexistent" />, { wrapper })
    expect(screen.queryByTestId('widget-content')).not.toBeInTheDocument()
  })

  it('renders widget content when widget exists in store', () => {
    act(() => {
      useDashboardStore.getState().setDashboard(makeDashboard(), [makeWidget()])
    })
    render(<WidgetShell widgetId="w1" />, { wrapper })
    expect(screen.getAllByText('My Widget')).not.toHaveLength(0)
    expect(screen.getByTestId('widget-content')).toBeInTheDocument()
  })

  it('hides edit/delete buttons outside edit mode', () => {
    act(() => {
      useDashboardStore.getState().setDashboard(makeDashboard(), [makeWidget()])
      useDashboardStore.setState({ isEditMode: false })
    })
    render(<WidgetShell widgetId="w1" />, { wrapper })
    // The Tooltip labels are accessible labels; ActionIcons don't have aria-label by default
    // We verify edit buttons are absent by checking count of action icons
    const actionIcons = screen.getAllByRole('button')
    // Only refresh button should be visible (1 button)
    expect(actionIcons).toHaveLength(1)
  })

  it('shows edit/delete buttons in edit mode', () => {
    act(() => {
      useDashboardStore.getState().setDashboard(makeDashboard(), [makeWidget()])
      useDashboardStore.setState({ isEditMode: true })
    })
    render(<WidgetShell widgetId="w1" />, { wrapper })
    // Refresh + Edit + Delete = 3 buttons
    const actionIcons = screen.getAllByRole('button')
    expect(actionIcons).toHaveLength(3)
  })

  it('clicking remove widget removes it from store', () => {
    act(() => {
      useDashboardStore.getState().setDashboard(makeDashboard(), [makeWidget()])
      useDashboardStore.setState({ isEditMode: true })
    })
    render(<WidgetShell widgetId="w1" />, { wrapper })
    const buttons = screen.getAllByRole('button')
    // Delete is the last button (index 2)
    act(() => {
      fireEvent.click(buttons[2])
    })
    expect(useDashboardStore.getState().widgets['w1']).toBeUndefined()
  })

  it('clicking edit opens the wizard with the widget id', () => {
    act(() => {
      useDashboardStore.getState().setDashboard(makeDashboard(), [makeWidget()])
      useDashboardStore.setState({ isEditMode: true })
    })
    render(<WidgetShell widgetId="w1" />, { wrapper })
    const buttons = screen.getAllByRole('button')
    // Edit is the middle button (index 1)
    act(() => {
      fireEvent.click(buttons[1])
    })
    expect(useWidgetWizardStore.getState().isOpen).toBe(true)
    expect(useWidgetWizardStore.getState().editingWidgetId).toBe('w1')
  })

  it('does not render widget content when user lacks required role', () => {
    act(() => {
      useDashboardStore.getState().setDashboard(makeDashboard(), [makeWidget(['admin'])])
      useAuthStore.setState({ currentUser: makeUser('viewer'), roles: [], isAuthenticated: true })
    })
    render(<WidgetShell widgetId="w1" />, { wrapper })
    expect(screen.queryByTestId('widget-content')).not.toBeInTheDocument()
  })

  it('renders nothing when registry has no entry for the widget type', () => {
    ;(WidgetRegistry.get as jest.Mock).mockReturnValue(undefined)
    act(() => {
      useDashboardStore.getState().setDashboard(makeDashboard(), [makeWidget()])
    })
    render(<WidgetShell widgetId="w1" />, { wrapper })
    expect(screen.queryByTestId('widget-content')).not.toBeInTheDocument()
  })
})
