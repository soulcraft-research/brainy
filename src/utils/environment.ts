/**
 * Utility functions for environment detection
 */

/**
 * Check if code is running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * Check if code is running in a Node.js environment
 */
export function isNode(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  )
}

/**
 * Check if code is running in a Web Worker environment
 */
export function isWebWorker(): boolean {
  return (
    typeof self === 'object' &&
    self.constructor &&
    self.constructor.name === 'DedicatedWorkerGlobalScope'
  )
}

/**
 * Check if Web Workers are available in the current environment
 */
export function areWebWorkersAvailable(): boolean {
  return isBrowser() && typeof Worker !== 'undefined'
}

/**
 * Check if Worker Threads are available in the current environment (Node.js)
 */
export async function areWorkerThreadsAvailable(): Promise<boolean> {
  if (!isNode()) return false

  try {
    // Use dynamic import to avoid errors in browser environments
    await import('worker_threads')
    return true
  } catch (e) {
    return false
  }
}

/**
 * Synchronous version that doesn't actually try to load the module
 * This is safer in ES module environments
 */
export function areWorkerThreadsAvailableSync(): boolean {
  if (!isNode()) return false

  // In Node.js 24.3.0+, worker_threads is always available
  return parseInt(process.versions.node.split('.')[0]) >= 24
}

/**
 * Determine if threading is available in the current environment
 * Returns true if either Web Workers (browser) or Worker Threads (Node.js) are available
 */
export function isThreadingAvailable(): boolean {
  return areWebWorkersAvailable() || areWorkerThreadsAvailableSync()
}

/**
 * Async version of isThreadingAvailable
 */
export async function isThreadingAvailableAsync(): Promise<boolean> {
  return areWebWorkersAvailable() || (await areWorkerThreadsAvailable())
}
