import { isNode } from './environment.js'

// This module must be run BEFORE any TensorFlow.js code initializes
// It directly patches the global environment to fix TextEncoder/TextDecoder issues

// Extend the global type definitions to include our custom properties
declare global {
  let _utilShim: any
  let __TextEncoder__: typeof TextEncoder
  let __TextDecoder__: typeof TextDecoder
  let __brainy_util__: any
  let __utilShim: any
}

// Also extend the globalThis interface
interface GlobalThis {
  _utilShim?: any
  __TextEncoder__?: typeof TextEncoder
  __TextDecoder__?: typeof TextDecoder
  __brainy_util__?: any
  __utilShim?: any
}

/**
 * Flag to track if the patch has been applied
 */
let patchApplied = false

/**
 * Monkeypatch TensorFlow.js's PlatformNode class to fix TextEncoder/TextDecoder issues
 * CRITICAL: This runs immediately at the top level when this module is imported
 */
if (typeof globalThis !== 'undefined' && isNode()) {
  try {
    // Ensure TextEncoder/TextDecoder are globally available
    if (typeof globalThis.TextEncoder === 'undefined') {
      globalThis.TextEncoder = TextEncoder
    }
    if (typeof globalThis.TextDecoder === 'undefined') {
      globalThis.TextDecoder = TextDecoder
    }

    // Patch global objects to handle the TensorFlow.js constructor issue
    // This is needed because TF accesses TextEncoder/TextDecoder as constructors via this.util
    if (typeof global !== 'undefined') {
      if (!global.TextEncoder) {
        global.TextEncoder = TextEncoder
      }
      if (!global.TextDecoder) {
        global.TextDecoder = TextDecoder
      }
      // Also set the special global constructors that TensorFlow can use safely
      global.__TextEncoder__ = TextEncoder
      global.__TextDecoder__ = TextDecoder
    }

    // CRITICAL FIX: Create a custom util object that TensorFlow.js can use
    // We'll make this available globally so TensorFlow.js can find it
    const customUtil = {
      TextEncoder: TextEncoder,
      TextDecoder: TextDecoder,
      types: {
        isFloat32Array: (arr: any) => arr instanceof Float32Array,
        isInt32Array: (arr: any) => arr instanceof Int32Array,
        isUint8Array: (arr: any) => arr instanceof Uint8Array,
        isUint8ClampedArray: (arr: any) => arr instanceof Uint8ClampedArray
      }
    }

    // Make the custom util available globally
    if (typeof global !== 'undefined') {
      global.__brainy_util__ = customUtil
    }

    // Try to patch the global require cache if possible
    if (
      typeof global !== 'undefined' &&
      global.require &&
      global.require.cache
    ) {
      // Find the util module in the cache and patch it
      for (const key in global.require.cache) {
        if (key.endsWith('/util.js') || key === 'util') {
          const utilModule = global.require.cache[key]
          if (utilModule && utilModule.exports) {
            Object.assign(utilModule.exports, customUtil)
          }
        }
      }
    }

    // CRITICAL: Patch the Node.js util module directly
    try {
      const util = require('util')
      // Ensure TextEncoder and TextDecoder are available as constructors
      util.TextEncoder = TextEncoder as typeof util.TextEncoder
      util.TextDecoder = TextDecoder as typeof util.TextDecoder
    } catch (error) {
      // Ignore if util module is not available
    }

    // CRITICAL: Patch Float32Array to handle buffer alignment issues
    // This fixes the "byte length of Float32Array should be a multiple of 4" error
    if (typeof global !== 'undefined') {
      const originalFloat32Array = global.Float32Array

      global.Float32Array = class extends originalFloat32Array {
        constructor(arg?: any, byteOffset?: number, length?: number) {
          if (arg instanceof ArrayBuffer) {
            // Ensure buffer is properly aligned for Float32Array (multiple of 4 bytes)
            const alignedByteOffset = byteOffset || 0
            const alignedLength =
              length !== undefined
                ? length
                : (arg.byteLength - alignedByteOffset) / 4

            // Check if the buffer slice is properly aligned
            if (
              (arg.byteLength - alignedByteOffset) % 4 !== 0 &&
              length === undefined
            ) {
              // Create a new aligned buffer if the original isn't properly aligned
              const alignedByteLength =
                Math.floor((arg.byteLength - alignedByteOffset) / 4) * 4
              const alignedBuffer = new ArrayBuffer(alignedByteLength)
              const sourceView = new Uint8Array(
                arg,
                alignedByteOffset,
                alignedByteLength
              )
              const targetView = new Uint8Array(alignedBuffer)
              targetView.set(sourceView)
              super(alignedBuffer)
            } else {
              super(arg, alignedByteOffset, alignedLength)
            }
          } else {
            super(arg, byteOffset, length)
          }
        }
      } as any

      // Preserve static methods and properties
      Object.setPrototypeOf(global.Float32Array, originalFloat32Array)
      Object.defineProperty(global.Float32Array, 'name', {
        value: 'Float32Array'
      })
      Object.defineProperty(global.Float32Array, 'BYTES_PER_ELEMENT', {
        value: 4
      })
    }

    // CRITICAL: Patch any empty util shims that bundlers might create
    // This handles cases where bundlers provide empty shims for Node.js modules
    if (typeof global !== 'undefined') {
      // Look for common patterns of util shims in bundled code
      const checkAndPatchUtilShim = (obj: any) => {
        if (obj && typeof obj === 'object' && !obj.TextEncoder) {
          obj.TextEncoder = TextEncoder
          obj.TextDecoder = TextDecoder
          obj.types = obj.types || {
            isFloat32Array: (arr: any) => arr instanceof Float32Array,
            isInt32Array: (arr: any) => arr instanceof Int32Array,
            isUint8Array: (arr: any) => arr instanceof Uint8Array,
            isUint8ClampedArray: (arr: any) => arr instanceof Uint8ClampedArray
          }
        }
      }

      // Patch any existing util-like objects in global scope
      if (global._utilShim) {
        checkAndPatchUtilShim(global._utilShim)
      }

      // CRITICAL: Patch the bundled util shim directly
      // In bundled code, there's often a _utilShim object that needs patching
      if (
        typeof globalThis !== 'undefined' &&
        (globalThis as GlobalThis)._utilShim
      ) {
        checkAndPatchUtilShim((globalThis as GlobalThis)._utilShim)
      }

      // CRITICAL: Create and patch a global _utilShim if it doesn't exist
      // This ensures the bundled code will find the patched version
      if (!global._utilShim) {
        global._utilShim = {
          TextEncoder: TextEncoder,
          TextDecoder: TextDecoder,
          types: {
            isFloat32Array: (arr: any) => arr instanceof Float32Array,
            isInt32Array: (arr: any) => arr instanceof Int32Array,
            isUint8Array: (arr: any) => arr instanceof Uint8Array,
            isUint8ClampedArray: (arr: any) => arr instanceof Uint8ClampedArray
          }
        }
      } else {
        checkAndPatchUtilShim(global._utilShim)
      }

      // Also ensure it's available on globalThis
      if (
        typeof globalThis !== 'undefined' &&
        !(globalThis as GlobalThis)._utilShim
      ) {
        ;(globalThis as GlobalThis)._utilShim = global._utilShim
      }

      // Set up a property descriptor to catch util shim assignments
      try {
        Object.defineProperty(global, '_utilShim', {
          get() {
            return this.__utilShim || {}
          },
          set(value) {
            checkAndPatchUtilShim(value)
            this.__utilShim = value
          },
          configurable: true
        })
      } catch (e) {
        // Ignore if property can't be defined
      }

      // Also set up property descriptor on globalThis
      try {
        Object.defineProperty(globalThis, '_utilShim', {
          get() {
            return this.__utilShim || {}
          },
          set(value) {
            checkAndPatchUtilShim(value)
            this.__utilShim = value
          },
          configurable: true
        })
      } catch (e) {
        // Ignore if property can't be defined
      }
    }

    console.log(
      'Brainy: Successfully patched TensorFlow.js PlatformNode at module load time'
    )
    patchApplied = true
  } catch (error) {
    console.warn(
      'Brainy: Failed to apply early TensorFlow.js platform patch:',
      error
    )
  }
}

/**
 * Apply the TensorFlow.js platform patch if it hasn't been applied already
 * This is a safety measure in case the module-level patch didn't run
 * Now works across all environments: browser, Node.js, and serverless/server
 */
export async function applyTensorFlowPatch(): Promise<void> {
  // Apply patches for all non-browser environments that might need TensorFlow.js compatibility
  // This includes Node.js, serverless environments, and other server environments
  const isBrowserEnv = typeof window !== 'undefined' && typeof document !== 'undefined'
  if (isBrowserEnv) {
    return // Browser environments don't need these patches
  }

  // Get the appropriate global object for the current environment
  const globalObj = (() => {
    if (typeof globalThis !== 'undefined') return globalThis
    if (typeof global !== 'undefined') return global
    if (typeof self !== 'undefined') return self
    return {} as any // Fallback for unknown environments
  })()

  // Check if the critical globals exist, not just the flag
  // This allows re-patching if globals have been deleted
  const needsPatch = !patchApplied || 
    typeof globalObj.__TextEncoder__ === 'undefined' || 
    typeof globalObj.__TextDecoder__ === 'undefined'

  if (!needsPatch) {
    return
  }

  try {
    console.log(
      'Brainy: Applying TensorFlow.js platform patch via function call'
    )

    // CRITICAL FIX: Patch the global environment to ensure TextEncoder/TextDecoder are available
    // This approach works by ensuring the global constructors are available before TensorFlow.js loads
    // Now works across all environments: Node.js, serverless, and other server environments

    // Make sure TextEncoder and TextDecoder are available globally
    if (!globalObj.TextEncoder) {
      globalObj.TextEncoder = TextEncoder
    }
    if (!globalObj.TextDecoder) {
      globalObj.TextDecoder = TextDecoder
    }
    
    // Also set the special global constructors that TensorFlow can use safely
    ;(globalObj as any).__TextEncoder__ = TextEncoder
    ;(globalObj as any).__TextDecoder__ = TextDecoder

    // Also patch process.versions to ensure TensorFlow.js detects Node.js correctly
    if (typeof process !== 'undefined' && process.versions) {
      // Ensure TensorFlow.js sees this as a Node.js environment
      if (!process.versions.node) {
        process.versions.node = process.version
      }
    }

    // CRITICAL: Patch the Node.js util module directly
    try {
      const util = await import('util')
      // Ensure TextEncoder and TextDecoder are available as constructors
      util.TextEncoder = TextEncoder as typeof util.TextEncoder
      util.TextDecoder = TextDecoder as typeof util.TextDecoder
    } catch (error) {
      // Ignore if util module is not available
    }

    patchApplied = true
  } catch (error) {
    console.warn('Brainy: Failed to apply TensorFlow.js platform patch:', error)
  }
}

export function getTextEncoder(): TextEncoder {
  return new TextEncoder()
}

export function getTextDecoder(): TextDecoder {
  return new TextDecoder()
}

// Apply patch immediately
applyTensorFlowPatch().catch((error) => {
  console.warn('Failed to apply TensorFlow patch at module load:', error)
})
