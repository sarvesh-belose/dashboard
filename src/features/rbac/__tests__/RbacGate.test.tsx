import React from 'react'
import { render, screen } from '@testing-library/react'
import { act } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { RbacGate } from '../RbacGate'
import { useAuthStore } from '@/store/auth.store'
import type { Widget, User } from '@/types'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

const makeTextWidget = (roles: string[] = []): Widget =>
  ({
    id: 'w1',
    type: 'text',
    title: 'Test Widget',
    roles,
    filterBindings: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    textConfig: { content: 'hello' },
  }) as Widget

const makeUser = (id: string, ...roleIds: string[]): User => ({
  id,
  name: 'Test User',
  email: 'test@test.com',
  roleIds,
})

beforeEach(() => {
  act(() => useAuthStore.setState({ currentUser: null, roles: [], isAuthenticated: false }))
})

describe('RbacGate', () => {
  it('renders children for authenticated user when widget has no role restrictions', () => {
    act(() => useAuthStore.setState({ currentUser: makeUser('u1', 'viewer'), roles: [], isAuthenticated: true }))
    const widget = makeTextWidget([])
    render(
      <RbacGate widget={widget}>
        <span data-testid="content">visible</span>
      </RbacGate>,
      { wrapper },
    )
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('renders children when user has the required role', () => {
    act(() => useAuthStore.setState({ currentUser: makeUser('u1', 'analyst'), roles: [], isAuthenticated: true }))
    const widget = makeTextWidget(['analyst'])
    render(
      <RbacGate widget={widget}>
        <span data-testid="content">visible</span>
      </RbacGate>,
      { wrapper },
    )
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('renders fallback when user lacks the required role', () => {
    act(() => useAuthStore.setState({ currentUser: makeUser('u1', 'viewer'), roles: [], isAuthenticated: true }))
    const widget = makeTextWidget(['admin'])
    render(
      <RbacGate widget={widget} fallback={<span data-testid="fallback">no access</span>}>
        <span data-testid="content">secret</span>
      </RbacGate>,
      { wrapper },
    )
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(screen.getByTestId('fallback')).toBeInTheDocument()
  })

  it('renders nothing when access denied and no fallback provided', () => {
    act(() => useAuthStore.setState({ currentUser: makeUser('u1', 'viewer'), roles: [], isAuthenticated: true }))
    const widget = makeTextWidget(['admin'])
    render(
      <RbacGate widget={widget}>
        <span data-testid="content">secret</span>
      </RbacGate>,
      { wrapper },
    )
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
  })

  it('admin bypasses all role checks', () => {
    act(() => useAuthStore.setState({ currentUser: makeUser('u1', 'admin'), roles: [], isAuthenticated: true }))
    const widget = makeTextWidget(['finance-only'])
    render(
      <RbacGate widget={widget}>
        <span data-testid="content">admin sees all</span>
      </RbacGate>,
      { wrapper },
    )
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('hides widget when user is null (unauthenticated), even for public widgets', () => {
    act(() => useAuthStore.setState({ currentUser: null, roles: [], isAuthenticated: false }))
    const widget = makeTextWidget([])
    render(
      <RbacGate widget={widget} fallback={<span data-testid="fallback">login required</span>}>
        <span data-testid="content">protected</span>
      </RbacGate>,
      { wrapper },
    )
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(screen.getByTestId('fallback')).toBeInTheDocument()
  })

  it('hides widget requiring specific role when user is null', () => {
    act(() => useAuthStore.setState({ currentUser: null, roles: [], isAuthenticated: false }))
    const widget = makeTextWidget(['analyst'])
    render(
      <RbacGate widget={widget} fallback={<span data-testid="fallback">no access</span>}>
        <span data-testid="content">protected</span>
      </RbacGate>,
      { wrapper },
    )
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(screen.getByTestId('fallback')).toBeInTheDocument()
  })
})
