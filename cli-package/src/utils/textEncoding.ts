/**
 * Unified Text Encoding Utilities
 *
 * This module provides a consistent way to handle text encoding/decoding across all environments
 * using the native TextEncoder/TextDecoder APIs.
 */

/**
 * Get a text encoder that works in the current environment
 * @returns A TextEncoder instance
 */
export function getTextEncoder(): TextEncoder {
  return new TextEncoder()
}

/**
 * Get a text decoder that works in the current environment
 * @returns A TextDecoder instance
 */
export function getTextDecoder(): TextDecoder {
  return new TextDecoder()
}

/**
 * Apply the TensorFlow.js platform patch if needed
 * This function patches the global object to provide a PlatformNode class
 * that uses native TextEncoder/TextDecoder
 */
export function applyTensorFlowPatch(): void {
  try {
    // Define a custom Platform class that works in both Node.js and browser environments
    class Platform {
      util: any
      textEncoder: TextEncoder
      textDecoder: TextDecoder

      constructor() {
        // Create a util object with necessary methods and constructors
        this.util = {
          // Use native TextEncoder and TextDecoder
          TextEncoder: globalThis.TextEncoder || TextEncoder,
          TextDecoder: globalThis.TextDecoder || TextDecoder
        }

        // Initialize using native constructors directly
        this.textEncoder = new (globalThis.TextEncoder || TextEncoder)()
        this.textDecoder = new (globalThis.TextDecoder || TextDecoder)()
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

    // Get the global object in a way that works in both Node.js and browser
    const globalObj =
      typeof global !== 'undefined'
        ? global
        : typeof window !== 'undefined'
          ? window
          : typeof self !== 'undefined'
            ? self
            : {}

    // Only apply in Node.js environment
    if (
      typeof process !== 'undefined' &&
      process.versions &&
      process.versions.node
    ) {
      // Assign the Platform class to the global object as PlatformNode for Node.js
      ;(globalObj as any).PlatformNode = Platform
      // Also create an instance and assign it to global.platformNode (lowercase p)
      ;(globalObj as any).platformNode = new Platform()
    } else if (typeof window !== 'undefined' || typeof self !== 'undefined') {
      // In browser environments, we might need to provide similar functionality
      // but we'll use a different name to avoid conflicts
      ;(globalObj as any).PlatformBrowser = Platform
      ;(globalObj as any).platformBrowser = new Platform()
    }
  } catch (error) {
    console.warn('Failed to apply TensorFlow.js platform patch:', error)
  }
}
