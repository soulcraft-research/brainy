/**
 * Unified Text Encoding Utilities for CLI
 *
 * This module provides a consistent way to handle text encoding/decoding across all environments
 * without relying on TextEncoder/TextDecoder polyfills or patches.
 */

/**
 * Apply the TensorFlow.js platform patch if needed
 * This function patches the global object to provide a PlatformNode class
 * that uses our text encoding utilities instead of relying on TextEncoder/TextDecoder
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
        textEncoder: any
        textDecoder: any

        constructor() {
          // Create a util object with necessary methods and constructors
          this.util = {
            // Use native TextEncoder and TextDecoder
            TextEncoder: TextEncoder,
            TextDecoder: TextDecoder
          }

          // Initialize using the constructors from util
          this.textEncoder = new this.util.TextEncoder()
          this.textDecoder = new this.util.TextDecoder()
        }

        // Define isFloat32Array directly on the instance
        isFloat32Array(arr: any) {
          return !!(
            arr instanceof Float32Array ||
            (arr &&
              Object.prototype.toString.call(arr) ===
                '[object Float32Array]')
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
    } catch (error) {
      console.warn('Failed to apply TensorFlow.js platform patch:', error)
    }
  }
}
