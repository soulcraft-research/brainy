/**
 * Custom patched implementation of TensorFlow.js PlatformNode class
 * This resolves the TextEncoder/TextDecoder constructor issues
 */

export class PatchedPlatformNode {
  util: {
    TextEncoder: typeof TextEncoder
    TextDecoder: typeof TextDecoder
    isFloat32Array: (arr: any) => boolean
    isTypedArray: (arr: any) => boolean
  }
  textEncoder: TextEncoder
  textDecoder: TextDecoder

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
      // Provide constructor references directly
      TextEncoder,
      TextDecoder
    }

    // Initialize TextEncoder/TextDecoder instances
    this.textEncoder = new TextEncoder()
    this.textDecoder = new TextDecoder()
  }

  // Define isFloat32Array directly on the instance
  isFloat32Array(arr: any) {
    return !!(
      arr instanceof Float32Array ||
      (arr && Object.prototype.toString.call(arr) === '[object Float32Array]')
    )
  }

  // Define isTypedArray directly on the instance
  isTypedArray(arr: any) {
    return !!(ArrayBuffer.isView(arr) && !(arr instanceof DataView))
  }
}
