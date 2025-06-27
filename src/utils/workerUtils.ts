/**
 * Utility functions for executing functions (without Web Workers or Worker Threads)
 * This is a replacement for the original multithreaded implementation
 */

/**
 * Execute a function directly in the main thread
 *
 * @param fnString The function to execute as a string
 * @param args The arguments to pass to the function
 * @returns A promise that resolves with the result of the function
 */
export function executeInThread<T>(fnString: string, args: any): Promise<T> {
  try {
    // Parse the function from string and execute it
    const fn = new Function('return ' + fnString)()
    return Promise.resolve(fn(args) as T)
  } catch (error) {
    return Promise.reject(error)
  }
}

/**
 * No-op function for backward compatibility
 * This function does nothing since there are no worker pools to clean up
 */
export function cleanupWorkerPools(): void {
  // No-op function
  console.log('Worker pools cleanup called (no-op in non-threaded version)')
}
