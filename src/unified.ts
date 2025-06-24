/**
 * Unified entry point for Brainy
 * This file exports everything from index.ts
 * Environment detection is handled here and made available to all components
 */

// Export environment information
export const environment = {
  isBrowser: typeof window !== 'undefined',
  isNode:
    typeof process !== 'undefined' && process.versions && process.versions.node,
  isServerless:
    typeof window === 'undefined' &&
    (typeof process === 'undefined' ||
      !process.versions ||
      !process.versions.node)
}

// Make environment information available globally
if (typeof globalThis !== 'undefined') {
  globalThis.__ENV__ = environment
}

// Log the detected environment
console.log(
  `Brainy running in ${
    environment.isBrowser
      ? 'browser'
      : environment.isNode
        ? 'Node.js'
        : 'serverless/unknown'
  } environment`
)

// Re-export everything from index.ts
export * from './index.js'
