/**
 * Utility functions for environment detection
 */

/**
 * Check if code is running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if code is running in a Node.js environment
 */
export function isNode(): boolean {
  return typeof process !== 'undefined' && 
    process.versions != null && 
    process.versions.node != null;
}

/**
 * Check if code is running in a Web Worker environment
 */
export function isWebWorker(): boolean {
  return typeof self === 'object' && 
    self.constructor && 
    self.constructor.name === 'DedicatedWorkerGlobalScope';
}

/**
 * Check if Web Workers are available in the current environment
 */
export function areWebWorkersAvailable(): boolean {
  return isBrowser() && typeof Worker !== 'undefined';
}

/**
 * Check if Worker Threads are available in the current environment (Node.js)
 */
export function areWorkerThreadsAvailable(): boolean {
  if (!isNode()) return false;

  try {
    // Dynamic import to avoid errors in browser environments
    require('worker_threads');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Determine if threading is available in the current environment
 * Always returns false since multithreading has been removed
 */
export function isThreadingAvailable(): boolean {
  return false;
}
