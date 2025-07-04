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

// Flag to track if we're in a Node.js environment
const isNodeEnvironment = 
  typeof process !== 'undefined' && 
  process.versions && 
  process.versions.node

// Promise to load Node.js TextEncoder and TextDecoder
let nodeUtilPromise: Promise<any> | null = null

// Function to get TextEncoder based on environment
async function getTextEncoder(): Promise<typeof TextEncoder | null> {
  // First check if TextEncoder is globally available
  if (typeof TextEncoder !== 'undefined') {
    return TextEncoder
  }

  // Then try to get it from Node.js util module
  if (isNodeEnvironment) {
    try {
      // Check if we can access the util module directly (in case it's already loaded)
      // @ts-ignore - Ignore TypeScript error for global.require
      if (typeof global !== 'undefined' && global.require && global.require.cache && global.require.cache['util']) {
        // @ts-ignore - Ignore TypeScript error for global.require
        const cachedUtil = global.require('util')
        if (cachedUtil && cachedUtil.TextEncoder) {
          return cachedUtil.TextEncoder
        }
      }

      // Otherwise, use dynamic import
      if (!nodeUtilPromise) {
        nodeUtilPromise = import('util').catch(error => {
          console.warn('Failed to import from util:', error)
          return null
        })
      }

      const util = await nodeUtilPromise
      return util?.TextEncoder || null
    } catch (error) {
      console.warn('Error accessing TextEncoder:', error)
      return null
    }
  }

  return null
}

// Function to get TextDecoder based on environment
async function getTextDecoder(): Promise<typeof TextDecoder | null> {
  // First check if TextDecoder is globally available
  if (typeof TextDecoder !== 'undefined') {
    return TextDecoder
  }

  // Then try to get it from Node.js util module
  if (isNodeEnvironment) {
    try {
      // Check if we can access the util module directly (in case it's already loaded)
      // @ts-ignore - Ignore TypeScript error for global.require
      if (typeof global !== 'undefined' && global.require && global.require.cache && global.require.cache['util']) {
        // @ts-ignore - Ignore TypeScript error for global.require
        const cachedUtil = global.require('util')
        if (cachedUtil && cachedUtil.TextDecoder) {
          return cachedUtil.TextDecoder
        }
      }

      // Otherwise, use dynamic import
      if (!nodeUtilPromise) {
        nodeUtilPromise = import('util').catch(error => {
          console.warn('Failed to import from util:', error)
          return null
        })
      }

      const util = await nodeUtilPromise
      return util?.TextDecoder || null
    } catch (error) {
      console.warn('Error accessing TextDecoder:', error)
      return null
    }
  }

  return null
}

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
          // Provide synchronous constructors that return objects with the expected interface
          // TensorFlow.js expects these to be synchronous
          TextEncoder: function() {
            // For Node.js environments, create a direct implementation
            if (isNodeEnvironment) {
              return {
                encode: (str: string) => {
                  try {
                    // Direct implementation for Node.js
                    // Convert string to UTF-8 encoded Uint8Array
                    const buffer = Buffer.from(str, 'utf-8')
                    const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
                    return uint8Array
                  } catch (error) {
                    console.warn('Error in Node.js TextEncoder implementation:', error)
                    return new Uint8Array([])
                  }
                }
              }
            } 
            // For browser environments, use the global TextEncoder
            else if (typeof TextEncoder !== 'undefined') {
              return new TextEncoder()
            } 
            // Fallback for other environments
            else {
              console.warn('TextEncoder not available in this environment')
              return {
                encode: (str: string) => new Uint8Array([])
              }
            }
          },
          TextDecoder: function() {
            // For Node.js environments, create a direct implementation
            if (isNodeEnvironment) {
              return {
                decode: (bytes: Uint8Array) => {
                  try {
                    // Direct implementation for Node.js
                    // Convert Uint8Array to string using Buffer
                    const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
                    return buffer.toString('utf-8')
                  } catch (error) {
                    console.warn('Error in Node.js TextDecoder implementation:', error)
                    return ''
                  }
                }
              }
            } 
            // For browser environments, use the global TextDecoder
            else if (typeof TextDecoder !== 'undefined') {
              return new TextDecoder()
            } 
            // Fallback for other environments
            else {
              console.warn('TextDecoder not available in this environment')
              return {
                decode: (bytes: Uint8Array) => ''
              }
            }
          }
        }

        // Initialize TextEncoder/TextDecoder
        this.initializeEncoders()
      }

      // Initialize TextEncoder and TextDecoder asynchronously
      async initializeEncoders() {
        try {
          const TextEncoderClass = await getTextEncoder()
          if (TextEncoderClass) {
            this.textEncoder = new TextEncoderClass()
          } else {
            console.warn('TextEncoder is not available in this environment')
            this.textEncoder = { encode: (str: string) => new Uint8Array([]) }
          }

          const TextDecoderClass = await getTextDecoder()
          if (TextDecoderClass) {
            this.textDecoder = new TextDecoderClass()
          } else {
            console.warn('TextDecoder is not available in this environment')
            this.textDecoder = { decode: (bytes: Uint8Array) => '' }
          }
        } catch (error) {
          console.error('Failed to initialize encoders:', error)
          this.textEncoder = { encode: (str: string) => new Uint8Array([]) }
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
