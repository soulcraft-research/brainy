/**
 * OPFS BrainyData
 * A vector database using HNSW indexing with Origin Private File System storage
 */

// Export main BrainyData class and related types
import { BrainyData, BrainyDataConfig } from './brainyData.ts'
export { BrainyData }
export type { BrainyDataConfig }

// Export distance functions for convenience
import { 
  euclideanDistance, 
  cosineDistance, 
  manhattanDistance, 
  dotProductDistance 
} from './utils/index.ts'
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
} from './utils/embedding.ts'
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
} from './storage/opfsStorage.ts'
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
} from './augmentationPipeline.ts'
export {
  AugmentationPipeline,
  augmentationPipeline,
  ExecutionMode
}
export type { PipelineOptions }

// Export plugin loader
import {
  loadPlugins,
  configureAndStartPipeline,
  createSensePluginConfig,
  createConduitPluginConfig
} from './pluginLoader.ts'
import type {
  PluginLoaderOptions,
  PluginConfig,
  PluginLoadResult
} from './pluginLoader.ts'
export {
  loadPlugins,
  configureAndStartPipeline,
  createSensePluginConfig,
  createConduitPluginConfig
}
export type {
  PluginLoaderOptions,
  PluginConfig,
  PluginLoadResult
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
} from './coreTypes.ts'
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
} from './types/augmentations.ts'
import { AugmentationType, BrainyAugmentations } from './types/augmentations.ts'
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
} from './types/augmentations.ts'

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
} from './types/graphTypes.ts'
import { NounType, VerbType } from './types/graphTypes.ts'
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
