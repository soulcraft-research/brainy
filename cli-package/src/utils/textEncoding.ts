/**
 * Unified Text Encoding Utilities for CLI
 *
 * This module provides a consistent way to handle text encoding/decoding across all environments
 * using the native TextEncoder/TextDecoder APIs.
 */

/**
 * Apply the TensorFlow.js platform patch if needed
 * This function patches the global object to provide a PlatformNode class
 * that uses native TextEncoder/TextDecoder
 */
export function applyTensorFlowPatch(): void {
  // Only apply in Node.js environment
  if (
    typeof global !== 'undefined' &&
    typeof process !== 'undefined' &&
    process.versions &&
    process.versions.node
  ) {
    try {
      // Define a custom PlatformNode class
      class PlatformNode {
        util: any
        textEncoder: TextEncoder
        textDecoder: TextDecoder

        constructor() {
          // Create a util object with necessary methods and constructors
          this.util = {
            // Add isFloat32Array and isTypedArray directly to util
            isFloat32Array: (arr: any) => {
              return !!(
                arr instanceof Float32Array ||
                (arr &&
                  Object.prototype.toString.call(arr) ===
                    '[object Float32Array]')
              )
            },
            isTypedArray: (arr: any) => {
              return !!(ArrayBuffer.isView(arr) && !(arr instanceof DataView))
            },
            // Use native TextEncoder and TextDecoder
            TextEncoder: TextEncoder,
            TextDecoder: TextDecoder
          }

          // Initialize using native constructors
          this.textEncoder = new TextEncoder()
          this.textDecoder = new TextDecoder()
        }

        // Define isFloat32Array directly on the instance
        isFloat32Array(arr: any) {
          return !!(
            arr instanceof Float32Array ||
            (arr &&
              Object.prototype.toString.call(arr) === '[object Float32Array]')
          )
        }

        // Define isTypedArray directly on the instance
        isTypedArray(arr: any) {
          return !!(ArrayBuffer.isView(arr) && !(arr instanceof DataView))
        }
      }

      // Assign the PlatformNode class to the global object
      ;(global as any).PlatformNode = PlatformNode

      // Also create an instance and assign it to global.platformNode (lowercase p)
      ;(global as any).platformNode = new PlatformNode()

      // Ensure global.util exists and has the necessary methods
      // This is needed because TensorFlow.js might look for these methods in global.util
      if (!(global as any).util) {
        ;(global as any).util = {}
      }

      // Add isFloat32Array method if it doesn't exist
      if (!(global as any).util.isFloat32Array) {
        ;(global as any).util.isFloat32Array = (arr: any) => {
          return !!(
            arr instanceof Float32Array ||
            (arr &&
              Object.prototype.toString.call(arr) === '[object Float32Array]')
          )
        }
      }

      // Add isTypedArray method if it doesn't exist
      if (!(global as any).util.isTypedArray) {
        ;(global as any).util.isTypedArray = (arr: any) => {
          return !!(ArrayBuffer.isView(arr) && !(arr instanceof DataView))
        }
      }
    } catch (error) {
      console.warn('Failed to apply TensorFlow.js platform patch:', error)
    }
  }
}
