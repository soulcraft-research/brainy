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
        // Create a util object with only the necessary methods
        this.util = {
          isFloat32Array: (arr) =>
            !!(
              arr instanceof Float32Array ||
              (arr &&
                Object.prototype.toString.call(arr) === '[object Float32Array]')
            ),
          isTypedArray: (arr) =>
            !!(ArrayBuffer.isView(arr) && !(arr instanceof DataView))
        }

        // Initialize TextEncoder/TextDecoder instances directly from global
        this.textEncoder = new TextEncoder()
        this.textDecoder = new TextDecoder()
      }
    }

    // Assign the PlatformNode class to the global object
    global.PlatformNode = PlatformNode

    // Also create an instance and assign it to global.platformNode (lowercase p)
    global.platformNode = new PlatformNode()
  } catch (error) {
    console.warn('Failed to define global PlatformNode class:', error)
  }
}

// Now load and run the actual CLI
import('./dist/cli.js').catch((err) => {
  console.error('Error loading CLI:', err)
  process.exit(1)
})
