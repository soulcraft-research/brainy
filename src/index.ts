/**
 * Brainy
 * A vector and graph database using HNSW
 */

// CRITICAL: The TensorFlow.js environment patch is now centralized in setup.ts
// We import setup.js below which applies the necessary patches through textEncoding.js
// This ensures a consistent patching approach and avoids conflicts

// Import the setup file for its side-effects.
// This MUST be the very first import to ensure patches are applied
// before any other module (like TensorFlow.js) is loaded.
import './setup.js'

// Export main BrainyData class and related types
import { BrainyData, BrainyDataConfig } from './brainyData.js'

export { BrainyData }
export type { BrainyDataConfig }

// Export distance functions for convenience
import {
  euclideanDistance,
  cosineDistance,
  manhattanDistance,
  dotProductDistance,
  getStatistics
} from './utils/index.js'

export {
  euclideanDistance,
  cosineDistance,
  manhattanDistance,
  dotProductDistance,
  getStatistics
}

// Export embedding functionality
import {
  UniversalSentenceEncoder,
  createEmbeddingFunction,
  createTensorFlowEmbeddingFunction,
  createThreadedEmbeddingFunction,
  defaultEmbeddingFunction
} from './utils/embedding.js'

// Export worker utilities
import { executeInThread, cleanupWorkerPools } from './utils/workerUtils.js'

// Export logging utilities
import { 
  logger, 
  LogLevel, 
  configureLogger, 
  createModuleLogger 
} from './utils/logger.js'

// Export environment utilities
import {
  isBrowser,
  isNode,
  isWebWorker,
  areWebWorkersAvailable,
  areWorkerThreadsAvailable,
  areWorkerThreadsAvailableSync,
  isThreadingAvailable,
  isThreadingAvailableAsync
} from './utils/environment.js'

export {
  UniversalSentenceEncoder,
  createEmbeddingFunction,
  createTensorFlowEmbeddingFunction,
  createThreadedEmbeddingFunction,
  defaultEmbeddingFunction,

  // Worker utilities
  executeInThread,
  cleanupWorkerPools,

  // Environment utilities
  isBrowser,
  isNode,
  isWebWorker,
  areWebWorkersAvailable,
  areWorkerThreadsAvailable,
  areWorkerThreadsAvailableSync,
  isThreadingAvailable,
  isThreadingAvailableAsync,
  
  // Logging utilities
  logger,
  LogLevel,
  configureLogger,
  createModuleLogger
}

// Export storage adapters
import {
  OPFSStorage,
  MemoryStorage,
  R2Storage,
  S3CompatibleStorage,
  createStorage
} from './storage/storageFactory.js'

export {
  OPFSStorage,
  MemoryStorage,
  R2Storage,
  S3CompatibleStorage,
  createStorage
}

// FileSystemStorage is exported separately to avoid browser build issues
export { FileSystemStorage } from './storage/adapters/fileSystemStorage.js'

// Export unified pipeline
import {
  Pipeline,
  pipeline,
  augmentationPipeline,
  ExecutionMode,
  PipelineOptions,
  PipelineResult,
  executeStreamlined,
  executeByType,
  executeSingle,
  processStaticData,
  processStreamingData,
  createPipeline,
  createStreamingPipeline,
  StreamlinedExecutionMode,
  StreamlinedPipelineOptions,
  StreamlinedPipelineResult
} from './pipeline.js'

// Export sequential pipeline (for backward compatibility)
import {
  SequentialPipeline,
  sequentialPipeline,
  SequentialPipelineOptions
} from './sequentialPipeline.js'

// Export augmentation factory
import {
  createSenseAugmentation,
  addWebSocketSupport,
  executeAugmentation,
  loadAugmentationModule,
  AugmentationOptions
} from './augmentationFactory.js'

export {
  // Unified pipeline exports
  Pipeline,
  pipeline,
  augmentationPipeline,
  ExecutionMode,
  SequentialPipeline,
  sequentialPipeline,

  // Streamlined pipeline exports (now part of unified pipeline)
  executeStreamlined,
  executeByType,
  executeSingle,
  processStaticData,
  processStreamingData,
  createPipeline,
  createStreamingPipeline,
  StreamlinedExecutionMode,

  // Augmentation factory exports
  createSenseAugmentation,
  addWebSocketSupport,
  executeAugmentation,
  loadAugmentationModule
}
export type {
  PipelineOptions,
  PipelineResult,
  SequentialPipelineOptions,
  StreamlinedPipelineOptions,
  StreamlinedPipelineResult,
  AugmentationOptions
}

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
export type { AugmentationRegistryLoaderOptions, AugmentationLoadResult }

// Export augmentation implementations
import {
  MemoryStorageAugmentation,
  FileSystemStorageAugmentation,
  OPFSStorageAugmentation,
  createMemoryAugmentation
} from './augmentations/memoryAugmentations.js'
import {
  WebSocketConduitAugmentation,
  WebRTCConduitAugmentation,
  createConduitAugmentation
} from './augmentations/conduitAugmentations.js'
import {
  ServerSearchConduitAugmentation,
  ServerSearchActivationAugmentation,
  createServerSearchAugmentations
} from './augmentations/serverSearchAugmentations.js'

// Non-LLM exports
export {
  MemoryStorageAugmentation,
  FileSystemStorageAugmentation,
  OPFSStorageAugmentation,
  createMemoryAugmentation,
  WebSocketConduitAugmentation,
  WebRTCConduitAugmentation,
  createConduitAugmentation,
  ServerSearchConduitAugmentation,
  ServerSearchActivationAugmentation,
  createServerSearchAugmentations
}

// LLM augmentations are optional and not imported by default
// They can be imported directly from their module if needed:
// import { LLMCognitionAugmentation, LLMActivationAugmentation, createLLMAugmentations } from './augmentations/llmAugmentations.js'

// Export types
import type {
  Vector,
  VectorDocument,
  SearchResult,
  DistanceFunction,
  EmbeddingFunction,
  EmbeddingModel,
  HNSWNoun,
  HNSWVerb,
  HNSWConfig,
  StorageAdapter
} from './coreTypes.js'

// Export HNSW index and optimized version
import { HNSWIndex } from './hnsw/hnswIndex.js'
import {
  HNSWIndexOptimized,
  HNSWOptimizedConfig
} from './hnsw/hnswIndexOptimized.js'

export { HNSWIndex, HNSWIndexOptimized }

export type {
  Vector,
  VectorDocument,
  SearchResult,
  DistanceFunction,
  EmbeddingFunction,
  EmbeddingModel,
  HNSWNoun,
  HNSWVerb,
  HNSWConfig,
  HNSWOptimizedConfig,
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

export type { IAugmentation, AugmentationResponse, IWebSocketSupport }
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
  Location,
  Thing,
  Event,
  Concept,
  Content,
  Collection,
  Organization,
  Document,
  Media,
  File,
  Message,
  Dataset,
  Product,
  Service,
  User,
  Task,
  Project,
  Process,
  State,
  Role,
  Topic,
  Language,
  Currency,
  Measurement
} from './types/graphTypes.js'
import { NounType, VerbType } from './types/graphTypes.js'

export type {
  GraphNoun,
  GraphVerb,
  EmbeddedGraphVerb,
  Person,
  Location,
  Thing,
  Event,
  Concept,
  Content,
  Collection,
  Organization,
  Document,
  Media,
  File,
  Message,
  Dataset,
  Product,
  Service,
  User,
  Task,
  Project,
  Process,
  State,
  Role,
  Topic,
  Language,
  Currency,
  Measurement
}
// Export type utility functions
import { getNounTypes, getVerbTypes, getNounTypeMap, getVerbTypeMap } from './utils/typeUtils.js'

export { 
  NounType, 
  VerbType,
  getNounTypes,
  getVerbTypes,
  getNounTypeMap,
  getVerbTypeMap
}

// Export MCP (Model Control Protocol) components
import {
  BrainyMCPAdapter,
  MCPAugmentationToolset,
  BrainyMCPService
} from './mcp/index.js' // Import from mcp/index.js
import {
  MCPRequest,
  MCPResponse,
  MCPDataAccessRequest,
  MCPToolExecutionRequest,
  MCPSystemInfoRequest,
  MCPAuthenticationRequest,
  MCPRequestType,
  MCPServiceOptions,
  MCPTool,
  MCP_VERSION
} from './types/mcpTypes.js'

export {
  // MCP classes
  BrainyMCPAdapter,
  MCPAugmentationToolset,
  BrainyMCPService,

  // MCP types
  MCPRequestType,
  MCP_VERSION
}

export type {
  MCPRequest,
  MCPResponse,
  MCPDataAccessRequest,
  MCPToolExecutionRequest,
  MCPSystemInfoRequest,
  MCPAuthenticationRequest,
  MCPServiceOptions,
  MCPTool
}
