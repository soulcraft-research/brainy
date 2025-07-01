/**
 * Utility functions for executing functions in Worker Threads (Node.js) or Web Workers (Browser)
 * This implementation leverages Node.js 24's improved Worker Threads API for better performance
 */

import { isBrowser, isNode } from './environment.js'

// Worker pool to reuse workers
const workerPool: Map<string, any> = new Map()
const MAX_POOL_SIZE = 4 // Adjust based on system capabilities

/**
 * Execute a function in a separate thread
 *
 * @param fnString The function to execute as a string
 * @param args The arguments to pass to the function
 * @returns A promise that resolves with the result of the function
 */
export function executeInThread<T>(fnString: string, args: any): Promise<T> {
  if (isNode()) {
    return executeInNodeWorker<T>(fnString, args)
  } else if (isBrowser() && typeof window !== 'undefined' && window.Worker) {
    return executeInWebWorker<T>(fnString, args)
  } else {
    // Fallback to main thread execution
    try {
      const fn = new Function('return ' + fnString)()
      return Promise.resolve(fn(args) as T)
    } catch (error) {
      return Promise.reject(error)
    }
  }
}

/**
 * Execute a function in a Node.js Worker Thread
 * Optimized for Node.js 24 with improved Worker Threads performance
 */
function executeInNodeWorker<T>(fnString: string, args: any): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    try {
      // Dynamically import worker_threads (Node.js only)
      import('node:worker_threads').then(({ Worker, isMainThread, parentPort, workerData }) => {
        if (!isMainThread && parentPort) {
          // We're inside a worker, execute the function
          const fn = new Function('return ' + workerData.fnString)()
          const result = fn(workerData.args)
          parentPort.postMessage({ result })
          return
        }

        // Get a worker from the pool or create a new one
        const workerId = `worker-${Math.random().toString(36).substring(2, 9)}`
        let worker: any

        if (workerPool.size < MAX_POOL_SIZE) {
          // Create a new worker
          worker = new Worker(`
            import { parentPort, workerData } from 'node:worker_threads';
            const fn = new Function('return ' + workerData.fnString)();
            const result = fn(workerData.args);
            parentPort.postMessage({ result });
          `, { 
            eval: true, 
            workerData: { fnString, args } 
          })

          workerPool.set(workerId, worker)
        } else {
          // Reuse an existing worker
          const poolKeys = Array.from(workerPool.keys())
          const randomKey = poolKeys[Math.floor(Math.random() * poolKeys.length)]
          worker = workerPool.get(randomKey)

          // Terminate and recreate if the worker is busy
          if (worker._busy) {
            worker.terminate()
            worker = new Worker(`
              import { parentPort, workerData } from 'node:worker_threads';
              const fn = new Function('return ' + workerData.fnString)();
              const result = fn(workerData.args);
              parentPort.postMessage({ result });
            `, { 
              eval: true, 
              workerData: { fnString, args } 
            })
            workerPool.set(randomKey, worker)
          }

          worker._busy = true
        }

        worker.on('message', (message: any) => {
          worker._busy = false
          resolve(message.result as T)
        })

        worker.on('error', (err: any) => {
          worker._busy = false
          reject(err)
        })

        worker.on('exit', (code: number) => {
          if (code !== 0) {
            worker._busy = false
            reject(new Error(`Worker stopped with exit code ${code}`))
          }
        })
      }).catch(reject)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Execute a function in a Web Worker (Browser environment)
 */
function executeInWebWorker<T>(fnString: string, args: any): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    try {
      const workerCode = `
        self.onmessage = function(e) {
          try {
            const fn = new Function('return ' + e.data.fnString)();
            const result = fn(e.data.args);
            self.postMessage({ result: result });
          } catch (error) {
            self.postMessage({ error: error.message });
          }
        };
      `
      const blob = new Blob([workerCode], { type: 'application/javascript' })
      const url = URL.createObjectURL(blob)
      const worker = new Worker(url)

      worker.onmessage = function(e) {
        if (e.data.error) {
          reject(new Error(e.data.error))
        } else {
          resolve(e.data.result as T)
        }
        worker.terminate()
        URL.revokeObjectURL(url)
      }

      worker.onerror = function(e) {
        reject(new Error(`Worker error: ${e.message}`))
        worker.terminate()
        URL.revokeObjectURL(url)
      }

      worker.postMessage({ fnString, args })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Clean up all worker pools
 * This should be called when the application is shutting down
 */
export function cleanupWorkerPools(): void {
  if (isNode()) {
    import('node:worker_threads').then(({ Worker }) => {
      for (const worker of workerPool.values()) {
        worker.terminate()
      }
      workerPool.clear()
      console.log('Worker pools cleaned up')
    }).catch(console.error)
  }
}
