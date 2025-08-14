/**
 * Pipeline - Clean Re-export of Cortex
 *
 * After the Great Cleanup: Pipeline IS Cortex. No delegation, no complexity.
 * ONE way to do everything.
 */

// Export the ONE consolidated Cortex class as Pipeline for those who prefer the name
export { 
  Cortex as Pipeline,
  cortex as pipeline,
  ExecutionMode,
  PipelineOptions
} from './augmentationPipeline.js'

// Re-export for backward compatibility in imports
export { 
  cortex as augmentationPipeline,
  Cortex
} from './augmentationPipeline.js'

// Simple factory functions
export const createPipeline = async () => {
  const { Cortex } = await import('./augmentationPipeline.js')
  return new Cortex()
}
export const createStreamingPipeline = async () => {
  const { Cortex } = await import('./augmentationPipeline.js')
  return new Cortex()
}

// Type aliases for consistency
export type { PipelineOptions as StreamlinedPipelineOptions } from './augmentationPipeline.js'
export type PipelineResult<T> = { success: boolean; data: T; error?: string }
export type StreamlinedPipelineResult<T> = PipelineResult<T>

// Execution mode alias
export enum StreamlinedExecutionMode {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel', 
  FIRST_SUCCESS = 'firstSuccess',
  FIRST_RESULT = 'firstResult',
  THREADED = 'threaded'
}