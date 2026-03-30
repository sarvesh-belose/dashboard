import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'

// Clean up DOM after each test
afterEach(() => {
  cleanup()
})

// Mock ResizeObserver (not available in jsdom)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver (used by Mantine popovers/dropdowns)
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds = []
  takeRecords() { return [] }
} as unknown as typeof IntersectionObserver

// Mock matchMedia (jsdom does not implement it)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock Highcharts side-effect modules
jest.mock('highcharts/highcharts-more', () => ({ default: () => {} }))
jest.mock('highcharts/modules/exporting', () => ({ default: () => {} }))
jest.mock('highcharts/modules/accessibility', () => ({ default: () => {} }))

// Mock HighchartsReact to avoid Highcharts rendering in jsdom
jest.mock('highcharts-react-official', () => ({
  __esModule: true,
  default: ({ options }: { options: unknown }) => (
    <div data-testid="highcharts-mock" data-options={JSON.stringify(options)} />
  ),
}))

// Mock react-grid-layout to avoid complex DOM measurements
jest.mock('react-grid-layout', () => ({
  ResponsiveGridLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="grid-layout">{children}</div>
  ),
  useContainerWidth: () => ({ width: 1200, containerRef: { current: null } }),
}))

// Mock zustand persist middleware (avoid localStorage side effects in unit tests)
jest.mock('zustand/middleware', () => ({
  persist: (config: unknown) => config,
}))

// Stub crypto.randomUUID for deterministic IDs
let uuidCounter = 0
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => `test-uuid-${++uuidCounter}`,
  },
})

beforeEach(() => {
  uuidCounter = 0
  localStorage.clear()
})

import React from 'react'
