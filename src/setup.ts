/**
 * CRITICAL: This file is imported for its side effects to patch the environment
 * for Node.js compatibility before any other library code runs.
 *
 * It ensures that by the time Transformers.js/ONNX Runtime is imported by any other
 * module, the necessary compatibility fixes for the current Node.js
 * environment are already in place.
 *
 * This file MUST be imported as the first import in unified.ts to prevent
 * race conditions with library initialization. Failure to do so may
 * result in errors like "TextEncoder is not a constructor" when the package
 * is used in Node.js environments.
 *
 * The package.json file marks this file as having side effects to prevent
 * tree-shaking by bundlers, ensuring the patch is always applied.
 */

// Get the appropriate global object for the current environment
const globalObj = (() => {
  if (typeof globalThis !== 'undefined') return globalThis
  if (typeof global !== 'undefined') return global
  if (typeof self !== 'undefined') return self
  return null // No global object available
})()

// Define TextEncoder and TextDecoder globally to make sure they're available
// Now works across all environments: Node.js, serverless, and other server environments
if (globalObj) {
  if (!globalObj.TextEncoder) {
    globalObj.TextEncoder = TextEncoder
  }
  if (!globalObj.TextDecoder) {
    globalObj.TextDecoder = TextDecoder
  }
  
  // Create special global constructors for library compatibility
  ;(globalObj as any).__TextEncoder__ = TextEncoder
  ;(globalObj as any).__TextDecoder__ = TextDecoder
}

// Also import normally for ES modules environments
import { applyTensorFlowPatch } from './utils/textEncoding.js'

// Apply the TextEncoder/TextDecoder compatibility patch
applyTensorFlowPatch()
console.log('Applied TextEncoder/TextDecoder patch via ES modules in setup.ts')
