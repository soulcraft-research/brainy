/**
 * Simple test setup for Brainy library
 * No direct TensorFlow references - patches are handled internally by Brainy
 */

import { beforeEach, afterEach, afterAll } from 'vitest'
import { existsSync, rmSync } from 'fs'
import { join } from 'path'

// Define the test utilities type for reuse
type TestUtilsType = {
  createTestVector: (dimensions: number) => number[]
  timeout: number
}

// Extend global type definitions for both global and globalThis
declare global {
  let testUtils: TestUtilsType | undefined
  let __ENV__: any
}

// Explicitly declare globalThis interface to ensure TypeScript recognizes these properties
declare global {
  interface globalThis {
    testUtils?: TestUtilsType | undefined
    __ENV__?: any
  }
}

// Clean up between tests
beforeEach(() => {
  // Clear any global state that might interfere with tests
  if (typeof globalThis !== 'undefined' && globalThis.__ENV__) {
    delete globalThis.__ENV__
  }
  if (typeof global !== 'undefined' && global.__ENV__) {
    delete global.__ENV__
  }
  
  // Clean up test data directory to prevent file accumulation
  const testDataDir = join(process.cwd(), 'brainy-data')
  if (existsSync(testDataDir)) {
    try {
      rmSync(testDataDir, { recursive: true, force: true })
    } catch (error) {
      // Ignore errors during cleanup
    }
  }
})

// Clean up after each test
afterEach(() => {
  // Force garbage collection if available (requires --expose-gc flag)
  if (global.gc) {
    global.gc()
  }
})

// Final cleanup after all tests
afterAll(() => {
  // Clean up test data directory
  const testDataDir = join(process.cwd(), 'brainy-data')
  if (existsSync(testDataDir)) {
    try {
      rmSync(testDataDir, { recursive: true, force: true })
    } catch (error) {
      // Ignore errors during cleanup
    }
  }
})

// Add simple test utilities to both global and globalThis for compatibility
const testUtilsObject = {
  // Create a simple test vector with predictable values
  createTestVector: (dimensions: number): number[] => {
    return Array.from({ length: dimensions }, (_, i) => (i + 1) / dimensions)
  },

  // Standard timeout for async operations
  timeout: 30000
}

global.testUtils = testUtilsObject
globalThis.testUtils = testUtilsObject

// Set a clear test environment flag for embedding system
globalThis.__BRAINY_TEST_ENV__ = true
if (typeof global !== 'undefined') {
  (global as any).__BRAINY_TEST_ENV__ = true
}
