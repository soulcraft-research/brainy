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

// Export embedding functionality
import {
  SimpleEmbedding,
  UniversalSentenceEncoder,
  createEmbeddingFunction,
  createTensorFlowEmbeddingFunction,
  createSimpleEmbeddingFunction,
  defaultEmbeddingFunction
} from './utils/embedding.js'
export {
  SimpleEmbedding,
  UniversalSentenceEncoder,
  createEmbeddingFunction,
  createTensorFlowEmbeddingFunction,
  createSimpleEmbeddingFunction,
  defaultEmbeddingFunction
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

// Export augmentation pipeline
import {
  AugmentationPipeline,
  augmentationPipeline,
  ExecutionMode,
  PipelineOptions
} from './augmentationPipeline.js'
export {
  AugmentationPipeline,
  augmentationPipeline,
  ExecutionMode
}
export type { PipelineOptions }

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

// Export augmentation types
import type {
  IAugmentation,
  AugmentationResponse,
  IWebSocketSupport
} from './types/augmentations.js'
import { AugmentationType, BrainyAugmentations } from './types/augmentations.js'
export type {
  IAugmentation,
  AugmentationResponse,
  IWebSocketSupport
}
export { AugmentationType, BrainyAugmentations }

// Export combined WebSocket augmentation interfaces
export type {
  IWebSocketCognitionAugmentation,
  IWebSocketSenseAugmentation,
  IWebSocketPerceptionAugmentation,
  IWebSocketActivationAugmentation,
  IWebSocketDialogAugmentation,
  IWebSocketConduitAugmentation,
  IWebSocketMemoryAugmentation
} from './types/augmentations.js'
