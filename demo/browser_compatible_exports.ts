// Import and provide Buffer polyfill for browser environment
import { Buffer } from 'buffer'
// Make Buffer available globally
globalThis.Buffer = Buffer

// Explicitly avoid importing Node.js modules like 'fs' and 'util'
// by using a dynamic import with a shim for Node.js modules
if (typeof window !== 'undefined') {
  // Browser environment - create empty shims for Node.js modules
  // Add missing properties to match the Node.js Require interface
  const browserRequire = function(module: string) {
    if (module === 'fs' || module === 'util' || module === 'path') {
      console.warn(`Module '${module}' is not available in browser environments.`)
      return {}
    }
    throw new Error(`Cannot require module '${module}' in browser environment.`)
  }

  // Add the missing properties from the Node.js Require interface
  browserRequire.cache = {}
  browserRequire.extensions = {}
  browserRequire.main = { exports: {} }
  browserRequire.resolve = (id: string) => id

  // Assign to window
  window.require = browserRequire as any
}

// Export only browser-compatible parts
export { BrainyData } from '../src/brainyData.js'
export type { BrainyDataConfig } from '../src/brainyData.js'
export { NounType, VerbType } from '../src/types/graphTypes.js'
export type { GraphNoun } from '../src/types/graphTypes.js'

// Export core types
export type {
  Vector,
  VectorDocument,
  SearchResult,
  DistanceFunction,
  EmbeddingFunction,
  HNSWConfig,
  StorageAdapter
} from '../src/coreTypes.js'

// Export distance functions for convenience
export {
  euclideanDistance,
  cosineDistance,
  manhattanDistance,
  dotProductDistance
} from '../src/utils/index.js'

// Export embedding functionality
export {
  UniversalSentenceEncoder,
  createEmbeddingFunction,
  createTensorFlowEmbeddingFunction,
  defaultEmbeddingFunction
} from '../src/utils/embedding.js'

// Export storage adapters (only browser-compatible ones)
export {
  OPFSStorage,
  MemoryStorage,
  createStorage
} from '../src/storage/opfsStorage.js'

// Note: Exclude CLI and Node.js specific parts
