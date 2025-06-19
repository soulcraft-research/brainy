/**
 * Unified entry point for Brainy
 * This file exports everything from index.ts
 * Environment detection is handled by the build process
 */

// Export environment information
// These values will be populated by the build process intro code
export const environment = {
  isBrowser: typeof window !== 'undefined',
  isNode: typeof process !== 'undefined' && process.versions && process.versions.node,
  isServerless: typeof window === 'undefined' && (typeof process === 'undefined' || !process.versions || !process.versions.node)
}

// Re-export everything from index.ts
export * from './index.js'
