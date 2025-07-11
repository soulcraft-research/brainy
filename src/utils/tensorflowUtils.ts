/**
 * Utility functions for TensorFlow.js compatibility
 * This module provides utility functions that TensorFlow.js might need
 * and avoids the need to use globalThis.util
 */

// Import the TensorFlowUtilObject interface
import type {
  TensorFlowUtilObject,
  PlatformNodeObject
} from '../types/tensorflowTypes.js'

// Note: TensorFlow.js platform patch is applied in setup.ts
// This ensures the global PlatformNode class uses our text encoding utilities

/**
 * Check if an array is a Float32Array
 * @param arr - The array to check
 * @returns True if the array is a Float32Array
 */
export function isFloat32Array(arr: unknown): boolean {
  return !!(
    arr instanceof Float32Array ||
    (arr && Object.prototype.toString.call(arr) === '[object Float32Array]')
  )
}

/**
 * Check if an array is a TypedArray
 * @param arr - The array to check
 * @returns True if the array is a TypedArray
 */
export function isTypedArray(arr: unknown): boolean {
  return !!(ArrayBuffer.isView(arr) && !(arr instanceof DataView))
}
