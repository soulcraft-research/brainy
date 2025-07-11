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
      // Try different approaches to create a function from string
      let fn
      try {
        // First try with 'return' prefix
        fn = new Function('return ' + fnString)()
      } catch (functionError) {
        console.warn(
          'Fallback: Error creating function with return syntax, trying alternative approaches',
          functionError
        )

        try {
          // Try wrapping in parentheses for function expressions
          fn = new Function('return (' + fnString + ')')()
        } catch (wrapError) {
          console.warn(
            'Fallback: Error creating function with parentheses wrapping',
            wrapError
          )

          try {
            // Try direct approach for named functions
            fn = new Function(fnString)()
          } catch (directError) {
            console.warn(
              'Fallback: Direct approach failed, trying with function wrapper',
              directError
            )

            try {
              // Try wrapping in a function that returns the function expression
              fn = new Function(
                'return function(args) { return (' + fnString + ')(args); }'
              )()
            } catch (wrapperError) {
              console.error(
                'Fallback: All approaches to create function failed',
                wrapperError
              )
              throw new Error(
                'Failed to create function from string: ' +
                  (functionError as Error).message
              )
            }
          }
        }
      }

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
      import('node:worker_threads')
        .then(({ Worker, isMainThread, parentPort, workerData }) => {
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
            worker = new Worker(
              `
            import { parentPort, workerData } from 'node:worker_threads';

            // Add TensorFlow.js platform patch for Node.js
            if (typeof global !== 'undefined') {
              try {
                // Define a custom PlatformNode class
                class PlatformNode {
                  constructor() {
                    // Create a util object with necessary methods
                    this.util = {
                      // Add isFloat32Array and isTypedArray directly to util
                      isFloat32Array: (arr) => {
                        return !!(
                          arr instanceof Float32Array ||
                          (arr &&
                            Object.prototype.toString.call(arr) === '[object Float32Array]')
                        );
                      },
                      isTypedArray: (arr) => {
                        return !!(ArrayBuffer.isView(arr) && !(arr instanceof DataView));
                      },
                      // Use native TextEncoder and TextDecoder
                      TextEncoder: TextEncoder,
                      TextDecoder: TextDecoder
                    };

                    // Initialize encoders using native constructors
                    this.textEncoder = new TextEncoder();
                    this.textDecoder = new TextDecoder();
                  }

                  // Define isFloat32Array directly on the instance
                  isFloat32Array(arr) {
                    return !!(
                      arr instanceof Float32Array ||
                      (arr && Object.prototype.toString.call(arr) === '[object Float32Array]')
                    );
                  }

                  // Define isTypedArray directly on the instance
                  isTypedArray(arr) {
                    return !!(ArrayBuffer.isView(arr) && !(arr instanceof DataView));
                  }
                }

                // Assign the PlatformNode class to the global object
                global.PlatformNode = PlatformNode;

                // Also create an instance and assign it to global.platformNode
                global.platformNode = new PlatformNode();

                // Ensure global.util exists and has the necessary methods
                if (!global.util) {
                  global.util = {};
                }

                // Add isFloat32Array method if it doesn't exist
                if (!global.util.isFloat32Array) {
                  global.util.isFloat32Array = (arr) => {
                    return !!(
                      arr instanceof Float32Array ||
                      (arr && Object.prototype.toString.call(arr) === '[object Float32Array]')
                    );
                  };
                }

                // Add isTypedArray method if it doesn't exist
                if (!global.util.isTypedArray) {
                  global.util.isTypedArray = (arr) => {
                    return !!(ArrayBuffer.isView(arr) && !(arr instanceof DataView));
                  };
                }
              } catch (error) {
                console.warn('Failed to apply TensorFlow.js platform patch:', error);
              }
            }

            const fn = new Function('return ' + workerData.fnString)();
            const result = fn(workerData.args);
            parentPort.postMessage({ result });
          `,
              {
                eval: true,
                workerData: { fnString, args }
              }
            )

            workerPool.set(workerId, worker)
          } else {
            // Reuse an existing worker
            const poolKeys = Array.from(workerPool.keys())
            const randomKey =
              poolKeys[Math.floor(Math.random() * poolKeys.length)]
            worker = workerPool.get(randomKey)

            // Terminate and recreate if the worker is busy
            if (worker._busy) {
              worker.terminate()
              worker = new Worker(
                `
              import { parentPort, workerData } from 'node:worker_threads';

              // Add TensorFlow.js platform patch for Node.js
              if (typeof global !== 'undefined') {
                try {
                  // Define a custom PlatformNode class
                  class PlatformNode {
                    constructor() {
                      // Create a util object with necessary methods
                      this.util = {
                        // Use native TextEncoder and TextDecoder
                        TextEncoder: TextEncoder,
                        TextDecoder: TextDecoder
                      };

                      // Initialize encoders using native constructors
                      this.textEncoder = new TextEncoder();
                      this.textDecoder = new TextDecoder();
                    }

                    // Define isFloat32Array directly on the instance
                    isFloat32Array(arr) {
                      return !!(
                        arr instanceof Float32Array ||
                        (arr && Object.prototype.toString.call(arr) === '[object Float32Array]')
                      );
                    }

                    // Define isTypedArray directly on the instance
                    isTypedArray(arr) {
                      return !!(ArrayBuffer.isView(arr) && !(arr instanceof DataView));
                    }
                  }

                  // Assign the PlatformNode class to the global object
                  global.PlatformNode = PlatformNode;

                  // Also create an instance and assign it to global.platformNode
                  global.platformNode = new PlatformNode();

                  // Ensure global.util exists and has the necessary methods
                  if (!global.util) {
                    global.util = {};
                  }

                  // Add isFloat32Array method if it doesn't exist
                  if (!global.util.isFloat32Array) {
                    global.util.isFloat32Array = (arr) => {
                      return !!(
                        arr instanceof Float32Array ||
                        (arr && Object.prototype.toString.call(arr) === '[object Float32Array]')
                      );
                    };
                  }

                  // Add isTypedArray method if it doesn't exist
                  if (!global.util.isTypedArray) {
                    global.util.isTypedArray = (arr) => {
                      return !!(ArrayBuffer.isView(arr) && !(arr instanceof DataView));
                    };
                  }
                } catch (error) {
                  console.warn('Failed to apply TensorFlow.js platform patch:', error);
                }
              }

              const fn = new Function('return ' + workerData.fnString)();
              const result = fn(workerData.args);
              parentPort.postMessage({ result });
            `,
                {
                  eval: true,
                  workerData: { fnString, args }
                }
              )
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
        })
        .catch(reject)
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
      // Use the dedicated worker.js file instead of creating a blob
      // Try different approaches to locate the worker.js file
      let workerPath = './worker.js'

      try {
        // First try to use the import.meta.url if available (modern browsers)
        if (typeof import.meta !== 'undefined' && import.meta.url) {
          const baseUrl = import.meta.url.substring(
            0,
            import.meta.url.lastIndexOf('/') + 1
          )
          workerPath = `${baseUrl}worker.js`
        }
        // Fallback to a relative path based on the unified.js location
        else if (typeof document !== 'undefined') {
          // Find the script tag that loaded unified.js
          const scripts = document.getElementsByTagName('script')
          for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].src
            if (src && src.includes('unified.js')) {
              // Get the directory path
              workerPath =
                src.substring(0, src.lastIndexOf('/') + 1) + 'worker.js'
              break
            }
          }
        }
      } catch (e) {
        console.warn(
          'Could not determine worker path from import.meta.url, using relative path',
          e
        )
      }

      // If we couldn't determine the path, try some common locations
      if (workerPath === './worker.js' && typeof window !== 'undefined') {
        // Try to find the worker.js in the same directory as the current page
        const pageUrl = window.location.href
        const pageDir = pageUrl.substring(0, pageUrl.lastIndexOf('/') + 1)
        workerPath = `${pageDir}worker.js`

        // Also check for dist/worker.js
        if (typeof document !== 'undefined') {
          const distWorkerPath = `${pageDir}dist/worker.js`
          // Create a test request to see if the file exists
          const xhr = new XMLHttpRequest()
          xhr.open('HEAD', distWorkerPath, false)
          try {
            xhr.send()
            if (xhr.status >= 200 && xhr.status < 300) {
              workerPath = distWorkerPath
            }
          } catch (e) {
            // Ignore errors, we'll use the default path
          }
        }
      }

      console.log('Using worker path:', workerPath)

      // Try to create a worker, but fall back to inline worker or main thread execution if it fails
      let worker: Worker
      try {
        worker = new Worker(workerPath)
      } catch (error) {
        console.warn(
          'Failed to create Web Worker from file, trying inline worker:',
          error
        )

        try {
          // Create an inline worker using a Blob
          const workerCode = `
            // Brainy Inline Worker Script
            console.log('Brainy Inline Worker: Started');

            self.onmessage = function (e) {
              try {
                console.log('Brainy Inline Worker: Received message', e.data ? 'with data' : 'without data');

                if (!e.data || !e.data.fnString) {
                  throw new Error('Invalid message: missing function string');
                }

                console.log('Brainy Inline Worker: Creating function from string');
                const fn = new Function('return ' + e.data.fnString)();

                console.log('Brainy Inline Worker: Executing function with args');
                const result = fn(e.data.args);

                console.log('Brainy Inline Worker: Function executed successfully, posting result');
                self.postMessage({ result: result });
              } catch (error) {
                console.error('Brainy Inline Worker: Error executing function', error);
                self.postMessage({ 
                  error: error.message,
                  stack: error.stack
                });
              }
            };
          `

          const blob = new Blob([workerCode], {
            type: 'application/javascript'
          })
          const blobUrl = URL.createObjectURL(blob)
          worker = new Worker(blobUrl)

          console.log('Created inline worker using Blob URL')
        } catch (inlineWorkerError) {
          console.warn(
            'Failed to create inline Web Worker, falling back to main thread execution:',
            inlineWorkerError
          )
          // Execute in main thread as fallback
          try {
            const fn = new Function('return ' + fnString)()
            resolve(fn(args) as T)
            return
          } catch (mainThreadError) {
            reject(mainThreadError)
            return
          }
        }
      }

      // Set a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.warn(
          'Web Worker execution timed out, falling back to main thread'
        )
        worker.terminate()

        // Execute in main thread as fallback
        try {
          const fn = new Function('return ' + fnString)()
          resolve(fn(args) as T)
        } catch (mainThreadError) {
          reject(mainThreadError)
        }
      }, 25000) // 25 second timeout (less than the 30 second test timeout)

      worker.onmessage = function (e) {
        clearTimeout(timeoutId)
        if (e.data.error) {
          reject(new Error(e.data.error))
        } else {
          resolve(e.data.result as T)
        }
        worker.terminate()
      }

      worker.onerror = function (e) {
        clearTimeout(timeoutId)
        console.warn(
          'Web Worker error, falling back to main thread execution:',
          e.message
        )
        worker.terminate()

        // Execute in main thread as fallback
        try {
          const fn = new Function('return ' + fnString)()
          resolve(fn(args) as T)
        } catch (mainThreadError) {
          reject(mainThreadError)
        }
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
    import('node:worker_threads')
      .then(({ Worker }) => {
        for (const worker of workerPool.values()) {
          worker.terminate()
        }
        workerPool.clear()
        console.log('Worker pools cleaned up')
      })
      .catch(console.error)
  }
}
