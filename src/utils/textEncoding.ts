import { isNode } from './environment.js'

// This module provides TextEncoder/TextDecoder utilities
// Previously needed for TensorFlow.js compatibility, now simplified for Transformers.js

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

    // Float32Array patching removed - not needed for Transformers.js + ONNX Runtime

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
      'Brainy: Successfully applied TextEncoder/TextDecoder patches for Node.js compatibility'
    )
    patchApplied = true
  } catch (error) {
    console.warn(
      'Brainy: Failed to apply early TextEncoder/TextDecoder patch:',
      error
    )
  }
}

/**
 * Apply TextEncoder/TextDecoder patches for Node.js compatibility
 * This is a safety measure in case the module-level patch didn't run
 * Simplified from previous TensorFlow.js requirements
 */
export async function applyTensorFlowPatch(): Promise<void> {
  // Apply patches for all non-browser environments that might need TextEncoder/TextDecoder
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
      'Brainy: Applying TextEncoder/TextDecoder patch via function call'
    )

    // CRITICAL FIX: Patch the global environment to ensure TextEncoder/TextDecoder are available
    // This approach works by ensuring the global constructors are available
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

    // Ensure process.versions is properly set for Node.js detection
    if (typeof process !== 'undefined' && process.versions) {
      // Ensure libraries see this as a Node.js environment
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
    console.warn('Brainy: Failed to apply TextEncoder/TextDecoder patch:', error)
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
  console.warn('Failed to apply TextEncoder/TextDecoder patch at module load:', error)
})
