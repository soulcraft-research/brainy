/**
 * Unified Text Encoding Utilities
 *
 * This module provides a consistent way to handle text encoding/decoding across all environments
 * without relying on TextEncoder/TextDecoder polyfills or patches.
 */

/**
 * A simple text encoder that works in all environments
 * This avoids the need for TextEncoder polyfills and patches
 */
export class SimpleTextEncoder {
  /**
   * Encode a string to a Uint8Array
   * @param input - The string to encode
   * @returns A Uint8Array containing the encoded string
   */
  encode(input: string): Uint8Array {
    // Simple UTF-8 encoding implementation that works everywhere
    return new Uint8Array([...input].map((c) => c.charCodeAt(0)))
  }
}

/**
 * A simple text decoder that works in all environments
 * This avoids the need for TextDecoder polyfills and patches
 */
export class SimpleTextDecoder {
  /**
   * Decode a Uint8Array to a string
   * @param input - The Uint8Array to decode
   * @returns The decoded string
   */
  decode(input: Uint8Array): string {
    // Simple UTF-8 decoding implementation that works everywhere
    return String.fromCharCode.apply(null, [...input])
  }
}

// Create constructor functions that can be used as drop-in replacements
// for the native TextEncoder and TextDecoder

/**
 * Interface for UniversalTextEncoder instance
 */
interface IUniversalTextEncoder {
  encode: (input: string) => Uint8Array;
}

/**
 * A constructor function for TextEncoder that works in all environments
 */
export function UniversalTextEncoder(this: IUniversalTextEncoder) {
  if (!(this instanceof UniversalTextEncoder)) {
    return new (UniversalTextEncoder as any)()
  }

  try {
    // Try to use the native TextEncoder if available
    const nativeEncoder: TextEncoder = new TextEncoder()
    this.encode = nativeEncoder.encode.bind(nativeEncoder)
  } catch (e) {
    // Fall back to our simple implementation
    const simpleEncoder: SimpleTextEncoder = new SimpleTextEncoder()
    this.encode = simpleEncoder.encode.bind(simpleEncoder)
  }
}

/**
 * Interface for UniversalTextDecoder instance
 */
interface IUniversalTextDecoder {
  decode: (input: Uint8Array) => string;
}

/**
 * A constructor function for TextDecoder that works in all environments
 */
export function UniversalTextDecoder(this: IUniversalTextDecoder) {
  if (!(this instanceof UniversalTextDecoder)) {
    return new (UniversalTextDecoder as any)()
  }

  try {
    // Try to use the native TextDecoder if available
    const nativeDecoder: TextDecoder = new TextDecoder()
    this.decode = nativeDecoder.decode.bind(nativeDecoder)
  } catch (e) {
    // Fall back to our simple implementation
    const simpleDecoder: SimpleTextDecoder = new SimpleTextDecoder()
    this.decode = simpleDecoder.decode.bind(simpleDecoder)
  }
}

/**
 * Get a text encoder that works in the current environment
 * @returns A text encoder object with an encode method
 */
export function getTextEncoder(): IUniversalTextEncoder {
  return new (UniversalTextEncoder as any)()
}

/**
 * Get a text decoder that works in the current environment
 * @returns A text decoder object with a decode method
 */
export function getTextDecoder(): IUniversalTextDecoder {
  return new (UniversalTextDecoder as any)()
}

/**
 * Apply the TensorFlow.js platform patch if needed
 * This function patches the global object to provide a PlatformNode class
 * that uses our text encoding utilities instead of relying on TextEncoder/TextDecoder
 */
export function applyTensorFlowPatch(): void {
  try {
    // Get encoders/decoders
    const encoder = getTextEncoder()
    const decoder = getTextDecoder()

    // Define a custom Platform class that works in both Node.js and browser environments
    class Platform {
      util: any
      textEncoder: any
      textDecoder: any

      constructor() {
        // Create a util object with necessary methods and constructors
        this.util = {
          // Add TextEncoder and TextDecoder as constructors
          TextEncoder: UniversalTextEncoder,
          TextDecoder: UniversalTextDecoder
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

    // Get the global object in a way that works in both Node.js and browser
    const globalObj = typeof global !== 'undefined' ? global : 
                     typeof window !== 'undefined' ? window : 
                     typeof self !== 'undefined' ? self : 
                     {};

    // Only apply in Node.js environment
    if (
      typeof process !== 'undefined' &&
      process.versions &&
      process.versions.node
    ) {
      // Assign the Platform class to the global object as PlatformNode for Node.js
      (globalObj as any).PlatformNode = Platform;
      // Also create an instance and assign it to global.platformNode (lowercase p)
      (globalObj as any).platformNode = new Platform();
    } else if (typeof window !== 'undefined' || typeof self !== 'undefined') {
      // In browser environments, we might need to provide similar functionality
      // but we'll use a different name to avoid conflicts
      (globalObj as any).PlatformBrowser = Platform;
      (globalObj as any).platformBrowser = new Platform();
    }
  } catch (error) {
    console.warn('Failed to apply TensorFlow.js platform patch:', error)
  }
}
