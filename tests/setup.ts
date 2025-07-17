/**
 * Simple test setup for Brainy library
 * No direct TensorFlow references - patches are handled internally by Brainy
 */

import { beforeEach } from 'vitest'

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
