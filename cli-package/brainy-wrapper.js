#!/usr/bin/env node

/**
 * Brainy CLI Wrapper
 * This script patches the global object to fix TextEncoder issues before loading the CLI
 */

console.log('Brainy running in Node.js environment')

// Define a custom PlatformNode class that doesn't rely on this.util.TextEncoder
if (
  typeof global !== 'undefined' &&
  typeof process !== 'undefined' &&
  process.versions &&
  process.versions.node
) {
  try {
    // Define a PlatformNode class that uses the global TextEncoder/TextDecoder directly
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
            )
          },
          isTypedArray: (arr) => {
            return !!(ArrayBuffer.isView(arr) && !(arr instanceof DataView))
          },
          // Instead of using constructors directly, create a utility object with constructors
          TextEncoder,
          TextDecoder
        }

        // Initialize TextEncoder/TextDecoder instances
        this.textEncoder = new TextEncoder()
        this.textDecoder = new TextDecoder()
      }

      // Define isFloat32Array directly on the instance
      isFloat32Array(arr) {
        return !!(
          arr instanceof Float32Array ||
          (arr &&
            Object.prototype.toString.call(arr) === '[object Float32Array]')
        )
      }

      // Define isTypedArray directly on the instance
      isTypedArray(arr) {
        return !!(ArrayBuffer.isView(arr) && !(arr instanceof DataView))
      }
    }

    // Assign the PlatformNode class to the global object
    global.PlatformNode = PlatformNode

    // Also create an instance and assign it to global.platformNode (lowercase p)
    global.platformNode = new PlatformNode()

    // Ensure global.util exists and has the necessary methods
    // This is needed because TensorFlow.js might look for these methods in global.util
    if (!global.util) {
      global.util = {}
    }

    // Add isFloat32Array method if it doesn't exist
    if (!global.util.isFloat32Array) {
      global.util.isFloat32Array = (arr) => {
        return !!(
          arr instanceof Float32Array ||
          (arr &&
            Object.prototype.toString.call(arr) === '[object Float32Array]')
        )
      }
    }

    // Add isTypedArray method if it doesn't exist
    if (!global.util.isTypedArray) {
      global.util.isTypedArray = (arr) => {
        return !!(ArrayBuffer.isView(arr) && !(arr instanceof DataView))
      }
    }
  } catch (error) {
    console.warn('Failed to define global PlatformNode class:', error)
  }
}

// Now load and run the actual CLI
import('./dist/cli.js').catch((err) => {
  console.error('Error loading CLI:', err)
  process.exit(1)
})
