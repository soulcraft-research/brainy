/**
 * Type definitions for TensorFlow.js compatibility
 * This file exports type definitions for TensorFlow.js utilities
 */

// Define the shape of the util object used for TensorFlow.js compatibility
export interface TensorFlowUtilObject {
  isFloat32Array?: (arr: unknown) => boolean
  isTypedArray?: (arr: unknown) => boolean

  [key: string]: unknown
}

// Define the shape of the PlatformNode object that might exist in global
export interface PlatformNodeObject {
  isFloat32Array?: (arr: unknown) => boolean
  isTypedArray?: (arr: unknown) => boolean

  [key: string]: unknown
}

// Define the shape of the tf object that might exist in global
export interface TensorFlowObject {
  util?: TensorFlowUtilObject

  [key: string]: unknown
}

// Extend the Window and WorkerGlobalScope interfaces to include the importTensorFlow function
declare global {
  interface Window {
    importTensorFlow?: () => Promise<any>
  }

  interface WorkerGlobalScope {
    importTensorFlow?: () => Promise<any>
  }

  // Declare types for the global object and globalThis
  var global: {
    util?: TensorFlowUtilObject
    [key: string]: any
  }

  var globalThis: {
    util?: TensorFlowUtilObject
    [key: string]: any
  }
}
