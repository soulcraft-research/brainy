/**
 * Unified entry point for Brainy
 * This file exports everything from index.ts
 * Environment detection is handled here and made available to all components
 */

// CRITICAL: The TensorFlow.js environment patch is now centralized in setup.ts
// We import setup.ts below which applies the necessary patches

// CRITICAL: Import setup.js first to ensure TensorFlow.js environment patching
// This MUST be the first import to prevent race conditions with TensorFlow.js initialization
// Moving or removing this import will cause errors like "TextEncoder is not a constructor"
// when the package is used in Node.js environments
//
// The setup.js file applies a patch that ensures TextEncoder/TextDecoder are properly
// available to TensorFlow.js before it initializes its platform detection
import './setup.js'

// Import environment detection functions
import { 
  isBrowser, 
  isNode, 
  isWebWorker, 
  isThreadingAvailable, 
  isThreadingAvailableAsync, 
  areWorkerThreadsAvailable 
} from './utils/environment.js'

// Export environment information with lazy evaluation
export const environment = {
  get isBrowser() {
    return isBrowser()
  },
  get isNode() {
    return isNode()
  },
  get isServerless() {
    return !isBrowser() && !isNode()
  },
  isWebWorker: function() {
    return isWebWorker()
  },
  get isThreadingAvailable() {
    return isThreadingAvailable()
  },
  isThreadingAvailableAsync: function() {
    return isThreadingAvailableAsync()
  },
  areWorkerThreadsAvailable: function() {
    return areWorkerThreadsAvailable()
  }
}

// Make environment information available globally
if (typeof globalThis !== 'undefined') {
  ;(globalThis as any).__ENV__ = environment
}

// Log the detected environment
console.log(
  `Brainy running in ${
    environment.isBrowser
      ? 'browser'
      : environment.isNode
        ? 'Node.js'
        : 'serverless/unknown'
  } environment`
)

// Re-export everything from index.ts
export * from './index.js'

// Export the TensorFlow patch function for testing and manual use
export { applyTensorFlowPatch } from './utils/textEncoding.js'
