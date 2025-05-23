/**
 * OPFS BrainyData
 * A vector database using HNSW indexing with Origin Private File System storage
 */

// Export main BrainyData class and related types
import { BrainyData, BrainyDataConfig } from './brainyData.js'
export { BrainyData }
export type { BrainyDataConfig }

// Export distance functions for convenience
import { 
  euclideanDistance, 
  cosineDistance, 
  manhattanDistance, 
  dotProductDistance 
} from './utils/index.js'
export { 
  euclideanDistance, 
  cosineDistance, 
  manhattanDistance, 
  dotProductDistance 
}

// Export storage adapters
import { 
  OPFSStorage, 
  MemoryStorage, 
  createStorage 
} from './storage/opfsStorage.js'
export { 
  OPFSStorage, 
  MemoryStorage, 
  createStorage 
}

// Export types
import type {
  Vector,
  VectorDocument,
  SearchResult,
  DistanceFunction,
  EmbeddingFunction,
  EmbeddingModel,
  HNSWNode,
  Edge,
  HNSWConfig,
  StorageAdapter
} from './coreTypes.js'
export type {
  Vector,
  VectorDocument,
  SearchResult,
  DistanceFunction,
  EmbeddingFunction,
  EmbeddingModel,
  HNSWNode,
  Edge,
  HNSWConfig,
  StorageAdapter
}
