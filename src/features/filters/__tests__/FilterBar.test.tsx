import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { FilterBar } from '../FilterBar'
import { useFilterStore } from '@/store/filter.store'
import type { Filter } from '@/types'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

const statusFilter: Filter = {
  id: 'status',
  label: 'Status',
  type: 'single-select',
  order: 0,
  options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }],
  value: null,
}

const nameFilter: Filter = {
  id: 'name',
  label: 'Name',
  type: 'text-search',
  order: 1,
  value: null,
}

beforeEach(() => {
  act(() => useFilterStore.setState({ filters: [] }))
})

describe('FilterBar', () => {
  it('renders nothing when there are no filters', () => {
    render(<FilterBar />, { wrapper })
    // FilterBar returns null when no filters — no labels or inputs rendered
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders filter labels for each filter', () => {
    act(() => useFilterStore.getState().initFilters([statusFilter, nameFilter]))
    render(<FilterBar />, { wrapper })
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
  })

  it('renders a clear button when filters are present', () => {
    act(() => useFilterStore.getState().initFilters([statusFilter]))
    render(<FilterBar />, { wrapper })
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
  })

  it('renders filters in sorted order by .order field', () => {
    const f1: Filter = { ...statusFilter, id: 'f1', label: 'Alpha', order: 1 }
    const f2: Filter = { ...statusFilter, id: 'f2', label: 'Beta', order: 0, options: [] }
    act(() => useFilterStore.getState().initFilters([f1, f2]))
    render(<FilterBar />, { wrapper })
    const bodyText = document.body.textContent ?? ''
    // Beta (order 0) should appear before Alpha (order 1) in the DOM
    expect(bodyText.indexOf('Beta')).toBeLessThan(bodyText.indexOf('Alpha'))
  })

  it('clicking clear calls resetAllFilters and sets values to null', () => {
    act(() => {
      useFilterStore.getState().initFilters([statusFilter])
      useFilterStore.getState().setFilterValue('status', 'active')
    })
    render(<FilterBar />, { wrapper })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /clear/i }))
    })
    expect(useFilterStore.getState().filters[0].value).toBeNull()
  })
})
