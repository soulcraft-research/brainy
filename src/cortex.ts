/**
 * Cortex - The Brain's Central Orchestration System
 * 
 * 🧠⚛️ The cerebral cortex that coordinates all augmentations
 * 
 * This is the main export for the Cortex system. It provides the central
 * coordination for all augmentations, managing their registration, execution,
 * and pipeline orchestration.
 */

// Re-export from augmentationPipeline (which contains the Cortex class)
export { 
  Cortex,
  cortex,
  ExecutionMode,
  PipelineOptions,
  // Backward compatibility
  AugmentationPipeline,
  augmentationPipeline
} from './augmentationPipeline.js'

// Re-export augmentation types for convenience
export type {
  BrainyAugmentations,
  IAugmentation,
  ISenseAugmentation,
  IConduitAugmentation,
  ICognitionAugmentation,
  IMemoryAugmentation,
  IPerceptionAugmentation,
  IDialogAugmentation,
  IActivationAugmentation,
  IWebSocketSupport,
  AugmentationResponse,
  AugmentationType
} from './types/augmentations.js'