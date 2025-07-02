/**
 * Utility functions for TensorFlow.js compatibility
 * This module provides utility functions that TensorFlow.js might need
 * and avoids the need to use globalThis.util
 */

// Import the TensorFlowUtilObject interface
import type {
  TensorFlowUtilObject,
  PlatformNodeObject
} from '../types/tensorflowTypes.js'

// Define a global PlatformNode class for TensorFlow.js compatibility
// This is needed because TensorFlow.js creates its own PlatformNode instance
// and we need to ensure it uses the correct TextEncoder/TextDecoder
if (
  typeof global !== 'undefined' &&
  typeof process !== 'undefined' &&
  process.versions &&
  process.versions.node &&
  process.versions.node.split('.')[0] >= '23'
) {
  try {
    // Define the PlatformNode class that TensorFlow.js will use
    class PlatformNode {
      util: any
      textEncoder: any
      textDecoder: any

      constructor() {
        // Create a util object with the necessary methods
        this.util = {
          isFloat32Array,
          isTypedArray,
          // Use the global TextEncoder/TextDecoder directly
          TextEncoder:
            typeof TextEncoder !== 'undefined'
              ? TextEncoder
              : function () {
                  console.warn(
                    'TextEncoder constructor called but not available'
                  )
                  return { encode: (str: string) => new Uint8Array([]) }
                },
          TextDecoder:
            typeof TextDecoder !== 'undefined'
              ? TextDecoder
              : function () {
                  console.warn(
                    'TextDecoder constructor called but not available'
                  )
                  return { decode: (bytes: Uint8Array) => '' }
                }
        }

        // Initialize TextEncoder/TextDecoder directly from globals
        if (typeof TextEncoder !== 'undefined') {
          this.textEncoder = new TextEncoder()
        } else {
          console.warn('TextEncoder is not available in this environment')
          this.textEncoder = { encode: (str: string) => new Uint8Array([]) }
        }

        if (typeof TextDecoder !== 'undefined') {
          this.textDecoder = new TextDecoder()
        } else {
          console.warn('TextDecoder is not available in this environment')
          this.textDecoder = { decode: (bytes: Uint8Array) => '' }
        }
      }
    }

    // Assign the PlatformNode class to the global object
    ;(global as any).PlatformNode = PlatformNode

    // Also create an instance and assign it to global.platformNode (lowercase p)
    // Some TensorFlow.js code might look for this
    ;(global as any).platformNode = new PlatformNode()

    console.log(
      'Defined global PlatformNode class for TensorFlow.js compatibility'
    )
  } catch (error) {
    console.warn('Failed to define global PlatformNode class:', error)
  }
}

/**
 * Check if an array is a Float32Array
 * @param arr - The array to check
 * @returns True if the array is a Float32Array
 */
export function isFloat32Array(arr: unknown): boolean {
  return !!(
    arr instanceof Float32Array ||
    (arr && Object.prototype.toString.call(arr) === '[object Float32Array]')
  )
}

/**
 * Check if an array is a TypedArray
 * @param arr - The array to check
 * @returns True if the array is a TypedArray
 */
export function isTypedArray(arr: unknown): boolean {
  return !!(ArrayBuffer.isView(arr) && !(arr instanceof DataView))
}
