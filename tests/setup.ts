/**
 * Simple test setup for Brainy library
 * No direct TensorFlow references - patches are handled internally by Brainy
 */

import { beforeEach } from 'vitest'

// Extend global type definitions
declare global {
  let testUtils:
    | {
        createTestVector: (dimensions: number) => number[]
        timeout: number
      }
    | undefined
  let __ENV__: any
}

// Clean up between tests
beforeEach(() => {
  // Clear any global state that might interfere with tests
  if (typeof global !== 'undefined' && global.__ENV__) {
    delete global.__ENV__
  }
})

// Add simple test utilities
global.testUtils = {
  // Create a simple test vector with predictable values
  createTestVector: (dimensions: number): number[] => {
    return Array.from({ length: dimensions }, (_, i) => (i + 1) / dimensions)
  },

  // Standard timeout for async operations
  timeout: 30000
}
