import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardToolbar } from '../DashboardToolbar'
import { useDashboardStore } from '@/store/dashboard.store'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import type { Dashboard } from '@/types'

const makeDashboard = (): Dashboard => ({
  id: 'dash-1',
  name: 'My Dashboard',
  layout: { lg: [], md: [], sm: [], xs: [] },
  widgetIds: [],
  filterIds: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ownerId: 'user-1',
})

const createClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } })

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createClient()}>
    <MantineProvider>{children}</MantineProvider>
  </QueryClientProvider>
)

beforeEach(() => {
  act(() => {
    useDashboardStore.setState({ dashboard: null, widgets: {}, isEditMode: false, isDirty: false, isSaving: false, isSharedView: false })
    useWidgetWizardStore.getState().closeWizard()
  })
})

describe('DashboardToolbar', () => {
  it('displays the dashboard name', () => {
    act(() => useDashboardStore.getState().setDashboard(makeDashboard(), []))
    render(<DashboardToolbar />, { wrapper })
    expect(screen.getByText('My Dashboard')).toBeInTheDocument()
  })

  it('shows fallback name when no dashboard loaded', () => {
    render(<DashboardToolbar />, { wrapper })
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('does not show Unsaved badge when isDirty is false', () => {
    act(() => useDashboardStore.getState().setDashboard(makeDashboard(), []))
    render(<DashboardToolbar />, { wrapper })
    expect(screen.queryByText(/unsaved/i)).not.toBeInTheDocument()
  })

  it('shows Unsaved badge when isDirty is true', () => {
    act(() => {
      useDashboardStore.getState().setDashboard(makeDashboard(), [])
      useDashboardStore.setState({ isDirty: true })
    })
    render(<DashboardToolbar />, { wrapper })
    expect(screen.getByText(/unsaved/i)).toBeInTheDocument()
  })

  it('does not show Add Widget button when not in edit mode', () => {
    render(<DashboardToolbar />, { wrapper })
    expect(screen.queryByRole('button', { name: /add widget/i })).not.toBeInTheDocument()
  })

  it('shows Add Widget button in edit mode', () => {
    act(() => useDashboardStore.setState({ isEditMode: true }))
    render(<DashboardToolbar />, { wrapper })
    expect(screen.getByRole('button', { name: /add widget/i })).toBeInTheDocument()
  })

  it('clicking Add Widget opens the wizard', () => {
    act(() => useDashboardStore.setState({ isEditMode: true }))
    render(<DashboardToolbar />, { wrapper })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /add widget/i }))
    })
    expect(useWidgetWizardStore.getState().isOpen).toBe(true)
    expect(useWidgetWizardStore.getState().editingWidgetId).toBeNull()
  })

  it('clicking edit toggle switches from view to edit mode', () => {
    act(() => {
      useDashboardStore.getState().setDashboard(makeDashboard(), [])
      useDashboardStore.setState({ isEditMode: false, isDirty: false })
    })
    render(<DashboardToolbar />, { wrapper })
    // Click the edit/view mode toggle by its tooltip label
    const editToggle = screen.getByRole('button', { name: /switch to edit mode/i })
    act(() => {
      fireEvent.click(editToggle)
    })
    expect(useDashboardStore.getState().isEditMode).toBe(true)
  })

  it('shows Save button when isDirty', () => {
    act(() => {
      useDashboardStore.getState().setDashboard(makeDashboard(), [])
      useDashboardStore.setState({ isDirty: true })
    })
    render(<DashboardToolbar />, { wrapper })
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('save button calls markSaved', () => {
    act(() => {
      useDashboardStore.getState().setDashboard(makeDashboard(), [])
      useDashboardStore.setState({ isDirty: true })
    })
    render(<DashboardToolbar />, { wrapper })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /save/i }))
    })
    expect(useDashboardStore.getState().isDirty).toBe(false)
  })
})
