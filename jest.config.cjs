/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',

  // Runs after the test framework is installed — jest globals (expect, describe, etc.) are available
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],

  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { configFile: './babel.config.json' }],
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg|ico)$': '<rootDir>/src/test/__mocks__/fileMock.cjs',
    'react-grid-layout/css/styles\\.css': 'identity-obj-proxy',
    'react-resizable/css/styles\\.css': 'identity-obj-proxy',
  },

  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/integration/**/*.test.{ts,tsx}',
  ],

  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/test/**',
    '!src/main.tsx',
    '!src/**/*.config.ts',
    '!src/types/**',
    '!src/constants/**',
  ],

  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',

  // Transform ESM-only node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(jsonpath-plus|react-markdown|remark.*|rehype.*|unified|bail|is-plain-obj|trough|vfile.*|unist.*|mdast.*|micromark.*|decode-named-character-reference|character-entities)/)',
  ],
}
