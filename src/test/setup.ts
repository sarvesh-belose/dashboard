import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'
import { server } from './msw-server'

// Start MSW before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Reset handlers between tests
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// Clean up after all tests
afterAll(() => server.close())

// Mock Highcharts modules (they use side-effect imports)
vi.mock('highcharts/highcharts-more', () => ({ default: () => {} }))
vi.mock('highcharts/modules/exporting', () => ({ default: () => {} }))
vi.mock('highcharts/modules/accessibility', () => ({ default: () => {} }))

// Mock react-grid-layout css imports
vi.mock('react-grid-layout/css/styles.css', () => ({}))
vi.mock('react-resizable/css/styles.css', () => ({}))

// Stub crypto.randomUUID for deterministic IDs in tests
let uuidCounter = 0
vi.stubGlobal('crypto', {
  ...global.crypto,
  randomUUID: () => `test-uuid-${++uuidCounter}`,
})

// Reset UUID counter between tests
afterEach(() => { uuidCounter = 0 })
