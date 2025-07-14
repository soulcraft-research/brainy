// In: @soulcraft/brainy/src/utils/textEncoding.ts

/**
 * Checks if the code is running in a Node.js environment.
 */
function isNode(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  )
}

/**
 * Global flag to track if TensorFlow.js has been initialized
 * This helps prevent multiple registrations of the same kernels
 */
const TENSORFLOW_INITIALIZED = Symbol('TENSORFLOW_INITIALIZED')

/**
 * Flag to track if the patch has been applied
 * This prevents multiple applications of the patch
 */
let patchApplied = false

/**
 * CRITICAL: Applies a compatibility patch for TensorFlow.js when running in a modern
 * Node.js ES Module environment. This must be called before any TensorFlow.js
 * modules are imported.
 *
 * This function prevents the "TextEncoder is not a constructor" error by preemptively
 * creating a compliant PlatformNode class with proper TextEncoder/TextDecoder support
 * and placing it on the global object where TensorFlow.js expects to find it.
 *
 * The race condition occurs because TensorFlow.js's platform detection might run
 * before the necessary global objects are properly initialized in certain Node.js
 * environments, particularly when the package is being used by other applications.
 *
 * This function is called from setup.ts, which must be the first import in unified.ts
 * to ensure the patch is applied before any TensorFlow.js code is executed.
 *
 * It also applies a patch to prevent duplicate kernel registrations when TensorFlow.js
 * is imported multiple times.
 */
export function applyTensorFlowPatch(): void {
  // Prevent multiple applications of the patch
  if (patchApplied) {
    return
  }

  if (!isNode()) {
    return // Patch is only for Node.js
  }

  // In modern Node.js with ES Modules, TensorFlow.js can fail during its
  // initial platform detection. This patch preempts that logic by creating
  // a compliant "Platform" class that uses the standard global TextEncoder
  // and placing it on the global object where TensorFlow.js expects to find it.
  try {
    // Ensure TextEncoder and TextDecoder are available
    const nodeUtil = require('util')
    const TextEncoderPolyfill = nodeUtil.TextEncoder || global.TextEncoder
    const TextDecoderPolyfill = nodeUtil.TextDecoder || global.TextDecoder

    if (!TextEncoderPolyfill || !TextDecoderPolyfill) {
      console.warn(
        'Brainy: TextEncoder or TextDecoder not available, attempting to polyfill'
      )

      // If still not available, try to use a simple polyfill
      if (!TextEncoderPolyfill) {
        class SimpleTextEncoder {
          encode(input: string): Uint8Array {
            const buf = Buffer.from(input, 'utf8')
            return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
          }
        }

        global.TextEncoder = SimpleTextEncoder
      }

      if (!TextDecoderPolyfill) {
        class SimpleTextDecoder {
          decode(input?: Uint8Array): string {
            if (!input) return ''
            return Buffer.from(
              input.buffer,
              input.byteOffset,
              input.byteLength
            ).toString('utf8')
          }
        }

        global.TextDecoder = SimpleTextDecoder
      }
    } else {
      // Ensure they're available globally
      global.TextEncoder = TextEncoderPolyfill
      global.TextDecoder = TextDecoderPolyfill
    }

    // Create a PlatformNode implementation that uses the polyfilled TextEncoder/TextDecoder
    class BrainyPlatformNode {
      // Use the polyfilled TextEncoder/TextDecoder
      readonly util = {
        TextEncoder: global.TextEncoder,
        TextDecoder: global.TextDecoder,

        // Add utility functions that TensorFlow.js might need
        isTypedArray: (arr: any): boolean => {
          return ArrayBuffer.isView(arr) && !(arr instanceof DataView)
        },

        isFloat32Array: (arr: any): boolean => {
          return (
            arr instanceof Float32Array ||
            (arr &&
              Object.prototype.toString.call(arr) === '[object Float32Array]')
          )
        }
      }

      // Create instances of the encoder/decoder
      readonly textEncoder: any
      readonly textDecoder: any

      constructor() {
        try {
          // Initialize encoders using constructors
          this.textEncoder = new global.TextEncoder()
          this.textDecoder = new global.TextDecoder()
        } catch (e) {
          console.warn(
            'Brainy: Error creating TextEncoder/TextDecoder instances:',
            e
          )
          // Provide fallback implementations if instantiation fails
          this.textEncoder = {
            encode: (input: string): Uint8Array => {
              const buf = Buffer.from(input, 'utf8')
              return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
            }
          }
          this.textDecoder = {
            decode: (input?: Uint8Array): string => {
              if (!input) return ''
              return Buffer.from(
                input.buffer,
                input.byteOffset,
                input.byteLength
              ).toString('utf8')
            }
          }
        }
      }

      isTypedArray(arr: any): arr is Float32Array | Int32Array | Uint8Array {
        return ArrayBuffer.isView(arr) && !(arr instanceof DataView)
      }

      isFloat32Array(arr: any): arr is Float32Array {
        return (
          arr instanceof Float32Array ||
          (arr &&
            Object.prototype.toString.call(arr) === '[object Float32Array]')
        )
      }
    }

    // Assign the custom platform class to the global scope.
    // TensorFlow.js specifically looks for `PlatformNode`.
    global.PlatformNode = BrainyPlatformNode

    // Also create an instance and assign it to global.platformNode (lowercase p)
    // This is needed for some TensorFlow.js versions
    global.platformNode = new BrainyPlatformNode()

    // Set up a global flag to track TensorFlow.js initialization
    global[TENSORFLOW_INITIALIZED] = false

    // Monkey patch the registerKernel function to prevent duplicate registrations
    // This will be applied when TensorFlow.js is imported
    const originalRegisterKernel = global.registerKernel
    if (!originalRegisterKernel) {
      // Set up a handler to intercept the registerKernel function when it's defined
      Object.defineProperty(global, 'registerKernel', {
        set: function (newRegisterKernel) {
          // Replace the setter with our patched version
          Object.defineProperty(global, 'registerKernel', {
            value: function (kernel: any) {
              // Check if this kernel is already registered
              const kernelName = kernel.kernelName
              const backendName = kernel.backendName
              const key = `${kernelName}_${backendName}`

              // Use a global registry to track registered kernels
              if (!global.__REGISTERED_KERNELS__) {
                global.__REGISTERED_KERNELS__ = new Set()
              }

              // If this kernel is already registered, skip it
              if (global.__REGISTERED_KERNELS__.has(key)) {
                return
              }

              // Otherwise, register it and add it to our registry
              global.__REGISTERED_KERNELS__.add(key)
              return newRegisterKernel(kernel)
            },
            configurable: true,
            writable: true
          })
        },
        configurable: true
      })
    }

    // Mark the patch as applied
    patchApplied = true
    console.log('Brainy: Successfully applied TensorFlow.js platform patch')
  } catch (error) {
    console.warn('Brainy: Failed to apply TensorFlow.js platform patch:', error)
  }
}
