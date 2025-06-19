/**
 * Unified entry point for Brainy
 * This file exports everything from index.ts and adds environment detection
 * to ensure the library works in any environment (Node.js, browser, serverless)
 */

// Environment detection (will be replaced by the build process)
const isBrowser = typeof window !== 'undefined'
const isNode =
  typeof process !== 'undefined' && process.versions && process.versions.node
const isServerless = !isBrowser && !isNode

// Export environment information
export const environment = {
  isBrowser,
  isNode,
  isServerless
}

// Re-export everything from index.ts
export * from './index.js'
