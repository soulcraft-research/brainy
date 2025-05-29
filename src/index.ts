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

// Export augmentation registry for build-time loading
import {
  availableAugmentations,
  registerAugmentation,
  initializeAugmentationPipeline,
  setAugmentationEnabled,
  getAugmentationsByType
} from './augmentationRegistry.js'

export {
  availableAugmentations,
  registerAugmentation,
  initializeAugmentationPipeline,
  setAugmentationEnabled,
  getAugmentationsByType
}

// Export augmentation registry loader for build tools
import {
  loadAugmentationsFromModules,
  createAugmentationRegistryPlugin,
  createAugmentationRegistryRollupPlugin
} from './augmentationRegistryLoader.js'
import type {
  AugmentationRegistryLoaderOptions,
  AugmentationLoadResult
} from './augmentationRegistryLoader.js'

export {
  loadAugmentationsFromModules,
  createAugmentationRegistryPlugin,
  createAugmentationRegistryRollupPlugin
}
export type {
  AugmentationRegistryLoaderOptions,
  AugmentationLoadResult
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

// Export augmentation types
import type {
  IAugmentation,
  AugmentationResponse,
  IWebSocketSupport,
  ISenseAugmentation,
  IConduitAugmentation,
  ICognitionAugmentation,
  IMemoryAugmentation,
  IPerceptionAugmentation,
  IDialogAugmentation,
  IActivationAugmentation
} from './types/augmentations.js'
import { AugmentationType, BrainyAugmentations } from './types/augmentations.js'

export type {
  IAugmentation,
  AugmentationResponse,
  IWebSocketSupport
}
export {
  AugmentationType,
  BrainyAugmentations,
  ISenseAugmentation,
  IConduitAugmentation,
  ICognitionAugmentation,
  IMemoryAugmentation,
  IPerceptionAugmentation,
  IDialogAugmentation,
  IActivationAugmentation
}

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

// Export graph types
import type {
  GraphNoun,
  GraphVerb,
  EmbeddedGraphVerb,
  Person,
  Place,
  Thing,
  Event,
  Concept,
  Content
} from './types/graphTypes.js'
import { NounType, VerbType } from './types/graphTypes.js'

export type {
  GraphNoun,
  GraphVerb,
  EmbeddedGraphVerb,
  Person,
  Place,
  Thing,
  Event,
  Concept,
  Content
}
export { NounType, VerbType }
