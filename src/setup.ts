/**
 * CRITICAL: This file is imported for its side effects to patch the environment
 * for TensorFlow.js before any other library code runs.
 *
 * It ensures that by the time TensorFlow.js is imported by any other
 * module, the necessary compatibility fixes for the current Node.js
 * environment are already in place.
 *
 * This file MUST be imported as the first import in unified.ts to prevent
 * race conditions with TensorFlow.js initialization. Failure to do so will
 * result in errors like "TextEncoder is not a constructor" when the package
 * is used in Node.js environments.
 *
 * The package.json file marks this file as having side effects to prevent
 * tree-shaking by bundlers, ensuring the patch is always applied.
 */

// CRITICAL: Apply the TensorFlow.js patch immediately at the top level
// This ensures it runs as early as possible in the module loading process
// before any imports are processed
if (
  typeof process !== 'undefined' &&
  process.versions &&
  process.versions.node
) {
  try {
    // For CommonJS environments, use require to ensure synchronous loading
    if (typeof require === 'function') {
      const textEncoding = require('./utils/textEncoding.js')
      if (
        textEncoding &&
        typeof textEncoding.applyTensorFlowPatch === 'function'
      ) {
        textEncoding.applyTensorFlowPatch()
        console.log(
          'Applied TensorFlow.js patch via CommonJS require in setup.ts'
        )
      }
    }
  } catch (e) {
    console.warn('Failed to apply TensorFlow.js patch via require:', e)
    // Continue to the import-based approach
  }
}

// Also import normally for ES modules environments
import { applyTensorFlowPatch } from './utils/textEncoding.js'

// Apply the TensorFlow.js platform patch if needed
// This will be a no-op if the patch was already applied via require above
applyTensorFlowPatch()
console.log(
  'Applied or verified TensorFlow.js patch via ES modules in setup.ts'
)
