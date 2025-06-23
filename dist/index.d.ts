/**
 * OPFS BrainyData
 * A vector database using HNSW indexing with Origin Private File System storage
 */
import { BrainyData, BrainyDataConfig } from './brainyData.js';
export { BrainyData };
export type { BrainyDataConfig };
import { euclideanDistance, cosineDistance, manhattanDistance, dotProductDistance } from './utils/index.js';
export { euclideanDistance, cosineDistance, manhattanDistance, dotProductDistance };
import { UniversalSentenceEncoder, createEmbeddingFunction, createTensorFlowEmbeddingFunction, defaultEmbeddingFunction } from './utils/embedding.js';
export { UniversalSentenceEncoder, createEmbeddingFunction, createTensorFlowEmbeddingFunction, defaultEmbeddingFunction };
import { OPFSStorage, MemoryStorage, createStorage } from './storage/opfsStorage.js';
import { FileSystemStorage } from './storage/fileSystemStorage.js';
import { R2Storage, S3CompatibleStorage } from './storage/s3CompatibleStorage.js';
export { OPFSStorage, MemoryStorage, FileSystemStorage, R2Storage, S3CompatibleStorage, createStorage };
import { Pipeline, pipeline, augmentationPipeline, ExecutionMode, PipelineOptions, PipelineResult, executeStreamlined, executeByType, executeSingle, processStaticData, processStreamingData, createPipeline, createStreamingPipeline, StreamlinedExecutionMode, StreamlinedPipelineOptions, StreamlinedPipelineResult } from './pipeline.js';
import { SequentialPipeline, sequentialPipeline, SequentialPipelineOptions } from './sequentialPipeline.js';
import { createSenseAugmentation, addWebSocketSupport, executeAugmentation, loadAugmentationModule, AugmentationOptions } from './augmentationFactory.js';
export { Pipeline, pipeline, augmentationPipeline, ExecutionMode, SequentialPipeline, sequentialPipeline, executeStreamlined, executeByType, executeSingle, processStaticData, processStreamingData, createPipeline, createStreamingPipeline, StreamlinedExecutionMode, createSenseAugmentation, addWebSocketSupport, executeAugmentation, loadAugmentationModule };
export type { PipelineOptions, PipelineResult, SequentialPipelineOptions, StreamlinedPipelineOptions, StreamlinedPipelineResult, AugmentationOptions };
import { availableAugmentations, registerAugmentation, initializeAugmentationPipeline, setAugmentationEnabled, getAugmentationsByType } from './augmentationRegistry.js';
export { availableAugmentations, registerAugmentation, initializeAugmentationPipeline, setAugmentationEnabled, getAugmentationsByType };
import { loadAugmentationsFromModules, createAugmentationRegistryPlugin, createAugmentationRegistryRollupPlugin } from './augmentationRegistryLoader.js';
import type { AugmentationRegistryLoaderOptions, AugmentationLoadResult } from './augmentationRegistryLoader.js';
export { loadAugmentationsFromModules, createAugmentationRegistryPlugin, createAugmentationRegistryRollupPlugin };
export type { AugmentationRegistryLoaderOptions, AugmentationLoadResult };
import { MemoryStorageAugmentation, FileSystemStorageAugmentation, OPFSStorageAugmentation, createMemoryAugmentation } from './augmentations/memoryAugmentations.js';
import { WebSocketConduitAugmentation, WebRTCConduitAugmentation, createConduitAugmentation } from './augmentations/conduitAugmentations.js';
import { ServerSearchConduitAugmentation, ServerSearchActivationAugmentation, createServerSearchAugmentations } from './augmentations/serverSearchAugmentations.js';
export { MemoryStorageAugmentation, FileSystemStorageAugmentation, OPFSStorageAugmentation, createMemoryAugmentation, WebSocketConduitAugmentation, WebRTCConduitAugmentation, createConduitAugmentation, ServerSearchConduitAugmentation, ServerSearchActivationAugmentation, createServerSearchAugmentations };
import type { Vector, VectorDocument, SearchResult, DistanceFunction, EmbeddingFunction, EmbeddingModel, HNSWNoun, GraphVerb, HNSWConfig, StorageAdapter } from './coreTypes.js';
import { HNSWIndex } from './hnsw/hnswIndex.js';
import { HNSWIndexOptimized, HNSWOptimizedConfig } from './hnsw/hnswIndexOptimized.js';
export { HNSWIndex, HNSWIndexOptimized };
export type { Vector, VectorDocument, SearchResult, DistanceFunction, EmbeddingFunction, EmbeddingModel, HNSWNoun, GraphVerb, HNSWConfig, HNSWOptimizedConfig, StorageAdapter };
import type { IAugmentation, AugmentationResponse, IWebSocketSupport, ISenseAugmentation, IConduitAugmentation, ICognitionAugmentation, IMemoryAugmentation, IPerceptionAugmentation, IDialogAugmentation, IActivationAugmentation } from './types/augmentations.js';
import { AugmentationType, BrainyAugmentations } from './types/augmentations.js';
export type { IAugmentation, AugmentationResponse, IWebSocketSupport };
export { AugmentationType, BrainyAugmentations, ISenseAugmentation, IConduitAugmentation, ICognitionAugmentation, IMemoryAugmentation, IPerceptionAugmentation, IDialogAugmentation, IActivationAugmentation };
export type { IWebSocketCognitionAugmentation, IWebSocketSenseAugmentation, IWebSocketPerceptionAugmentation, IWebSocketActivationAugmentation, IWebSocketDialogAugmentation, IWebSocketConduitAugmentation, IWebSocketMemoryAugmentation } from './types/augmentations.js';
import type { GraphNoun, EmbeddedGraphVerb, Person, Place, Thing, Event, Concept, Content } from './types/graphTypes.js';
import { NounType, VerbType } from './types/graphTypes.js';
export type { GraphNoun, EmbeddedGraphVerb, Person, Place, Thing, Event, Concept, Content };
export { NounType, VerbType };
import { BrainyMCPAdapter, MCPAugmentationToolset, BrainyMCPService } from './mcp/index.js';
import { MCPRequest, MCPResponse, MCPDataAccessRequest, MCPToolExecutionRequest, MCPSystemInfoRequest, MCPAuthenticationRequest, MCPRequestType, MCPServiceOptions, MCPTool, MCP_VERSION } from './types/mcpTypes.js';
export { BrainyMCPAdapter, MCPAugmentationToolset, BrainyMCPService, MCPRequestType, MCP_VERSION };
export type { MCPRequest, MCPResponse, MCPDataAccessRequest, MCPToolExecutionRequest, MCPSystemInfoRequest, MCPAuthenticationRequest, MCPServiceOptions, MCPTool };
//# sourceMappingURL=index.d.ts.map