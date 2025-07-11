/**
 * This file is imported for its side effects to patch the environment
 * for TensorFlow.js before any other library code runs.
 *
 * It ensures that by the time TensorFlow.js is imported by any other
 * module, the necessary compatibility fixes for the current Node.js
 * environment are already in place.
 */
import { applyTensorFlowPatch } from './utils/textEncoding.js'

// Apply the TensorFlow.js platform patch if needed
applyTensorFlowPatch()
