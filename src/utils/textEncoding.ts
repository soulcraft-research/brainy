import { isNode } from './environment.js'

// Simplified TextEncoder/TextDecoder utilities for Node.js compatibility
// No longer needs complex TensorFlow.js patches - only basic TextEncoder/TextDecoder

/**
 * Flag to track if the patch has been applied
 */
let patchApplied = false

/**
 * Apply TextEncoder/TextDecoder patches for Node.js compatibility
 * Simplified version for Transformers.js/ONNX Runtime
 */
export async function applyTensorFlowPatch(): Promise<void> {
  // Apply patches for all non-browser environments that might need TextEncoder/TextDecoder
  const isBrowserEnv = typeof window !== 'undefined' && typeof document !== 'undefined'
  if (isBrowserEnv || patchApplied) {
    return // Browser environments don't need these patches, and don't patch twice
  }

  if (!isNode()) {
    return // Only patch Node.js environments
  }

  try {
    console.log('Brainy: Applying TextEncoder/TextDecoder patch for Node.js')

    // Get the appropriate global object
    const globalObj = (() => {
      if (typeof globalThis !== 'undefined') return globalThis
      if (typeof global !== 'undefined') return global
      return {} as any
    })()

    // Make sure TextEncoder and TextDecoder are available globally
    if (!globalObj.TextEncoder) {
      globalObj.TextEncoder = TextEncoder
    }
    if (!globalObj.TextDecoder) {
      globalObj.TextDecoder = TextDecoder
    }

    // Also set them on the global object for older code
    if (typeof global !== 'undefined') {
      if (!global.TextEncoder) {
        global.TextEncoder = TextEncoder
      }
      if (!global.TextDecoder) {
        global.TextDecoder = TextDecoder
      }
    }

    patchApplied = true
    console.log('Brainy: TextEncoder/TextDecoder patches applied successfully')
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

// Apply patch immediately if in Node.js
if (isNode()) {
  applyTensorFlowPatch().catch((error) => {
    console.warn('Failed to apply TextEncoder/TextDecoder patch at module load:', error)
  })
}