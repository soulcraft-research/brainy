/**
 * Pipeline - Unified API (Delegates to Cortex)
 *
 * This module provides backward compatibility by delegating all functionality to the Cortex class.
 * Per the cleanup strategy, everything consolidates into ONE Cortex class.
 */

// Import the ONE consolidated Cortex class
import { 
  Cortex, 
  cortex, 
  ExecutionMode as CortexExecutionMode, 
  PipelineOptions as CortexPipelineOptions 
} from './augmentationPipeline.js'

import {
  IAugmentation,
  AugmentationResponse,
  BrainyAugmentations
} from './types/augmentations.js'
import { IPipeline } from './types/pipelineTypes.js'

// Re-export types from Cortex for backward compatibility
export const ExecutionMode = CortexExecutionMode
export type PipelineOptions = CortexPipelineOptions

/**
 * Pipeline result (backward compatibility type)
 */
export interface PipelineResult<T> {
  success: boolean
  data: T
  error?: string
}

/**
 * Pipeline class - Delegates everything to Cortex
 * 
 * This provides backward compatibility while consolidating all functionality
 * into the single Cortex class as per the cleanup strategy.
 */
export class Pipeline implements IPipeline {
  private cortexInstance: Cortex

  constructor() {
    this.cortexInstance = new Cortex()
  }

  /**
   * Register an augmentation (delegates to Cortex)
   */
  public register<T extends IAugmentation>(augmentation: T): Pipeline {
    this.cortexInstance.register(augmentation)
    return this
  }

  /**
   * Unregister an augmentation (delegates to Cortex)
   */
  public unregister(augmentationName: string): Pipeline {
    this.cortexInstance.unregister(augmentationName)
    return this
  }

  /**
   * Execute sense pipeline (delegates to Cortex)
   */
  public async executeSensePipeline<
    M extends keyof BrainyAugmentations.ISenseAugmentation & string,
    R extends BrainyAugmentations.ISenseAugmentation[M] extends (
      ...args: any[]
    ) => AugmentationResponse<infer U>
      ? U
      : never
  >(
    method: M,
    args: Parameters<
      Extract<
        BrainyAugmentations.ISenseAugmentation[M],
        (...args: any[]) => any
      >
    >,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    return this.cortexInstance.executeSensePipeline(method, args, options)
  }

  /**
   * Execute conduit pipeline (delegates to Cortex)
   */
  public async executeConduitPipeline<
    M extends keyof BrainyAugmentations.IConduitAugmentation & string,
    R extends BrainyAugmentations.IConduitAugmentation[M] extends (
      ...args: any[]
    ) => AugmentationResponse<infer U>
      ? U
      : never
  >(
    method: M,
    args: Parameters<
      Extract<
        BrainyAugmentations.IConduitAugmentation[M],
        (...args: any[]) => any
      >
    >,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    return this.cortexInstance.executeConduitPipeline(method, args, options)
  }

  /**
   * Execute cognition pipeline (delegates to Cortex)
   */
  public async executeCognitionPipeline<
    M extends keyof BrainyAugmentations.ICognitionAugmentation & string,
    R extends BrainyAugmentations.ICognitionAugmentation[M] extends (
      ...args: any[]
    ) => AugmentationResponse<infer U>
      ? U
      : never
  >(
    method: M,
    args: Parameters<
      Extract<
        BrainyAugmentations.ICognitionAugmentation[M],
        (...args: any[]) => any
      >
    >,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    return this.cortexInstance.executeCognitionPipeline(method, args, options)
  }

  /**
   * Execute memory pipeline (delegates to Cortex)
   */
  public async executeMemoryPipeline<
    M extends keyof BrainyAugmentations.IMemoryAugmentation & string,
    R extends BrainyAugmentations.IMemoryAugmentation[M] extends (
      ...args: any[]
    ) => AugmentationResponse<infer U>
      ? U
      : never
  >(
    method: M,
    args: Parameters<
      Extract<
        BrainyAugmentations.IMemoryAugmentation[M],
        (...args: any[]) => any
      >
    >,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    return this.cortexInstance.executeMemoryPipeline(method, args, options)
  }

  /**
   * Execute perception pipeline (delegates to Cortex)
   */
  public async executePerceptionPipeline<
    M extends keyof BrainyAugmentations.IPerceptionAugmentation & string,
    R extends BrainyAugmentations.IPerceptionAugmentation[M] extends (
      ...args: any[]
    ) => AugmentationResponse<infer U>
      ? U
      : never
  >(
    method: M,
    args: Parameters<
      Extract<
        BrainyAugmentations.IPerceptionAugmentation[M],
        (...args: any[]) => any
      >
    >,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    return this.cortexInstance.executePerceptionPipeline(method, args, options)
  }

  /**
   * Execute dialog pipeline (delegates to Cortex)
   */
  public async executeDialogPipeline<
    M extends keyof BrainyAugmentations.IDialogAugmentation & string,
    R extends BrainyAugmentations.IDialogAugmentation[M] extends (
      ...args: any[]
    ) => AugmentationResponse<infer U>
      ? U
      : never
  >(
    method: M,
    args: Parameters<
      Extract<
        BrainyAugmentations.IDialogAugmentation[M],
        (...args: any[]) => any
      >
    >,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    return this.cortexInstance.executeDialogPipeline(method, args, options)
  }

  /**
   * Execute activation pipeline (delegates to Cortex)
   */
  public async executeActivationPipeline<
    M extends keyof BrainyAugmentations.IActivationAugmentation & string,
    R extends BrainyAugmentations.IActivationAugmentation[M] extends (
      ...args: any[]
    ) => AugmentationResponse<infer U>
      ? U
      : never
  >(
    method: M,
    args: Parameters<
      Extract<
        BrainyAugmentations.IActivationAugmentation[M],
        (...args: any[]) => any
      >
    >,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    return this.cortexInstance.executeActivationPipeline(method, args, options)
  }

  // Additional delegation methods for full compatibility
  public async initialize(): Promise<void> {
    return this.cortexInstance.initialize()
  }

  public async shutDown(): Promise<void> {
    return this.cortexInstance.shutDown()
  }

  public getAllAugmentations(): IAugmentation[] {
    return this.cortexInstance.getAllAugmentations()
  }

  public enableAugmentation(name: string): boolean {
    return this.cortexInstance.enableAugmentation(name)
  }

  public disableAugmentation(name: string): boolean {
    return this.cortexInstance.disableAugmentation(name)
  }

  public isAugmentationEnabled(name: string): boolean {
    return this.cortexInstance.isAugmentationEnabled(name)
  }
}

// Create single global Pipeline instance that delegates to Cortex
export const pipeline = new Pipeline()

// Backward compatibility exports
export const augmentationPipeline = pipeline

// Streamlined execution functions - delegate to cortex
export const executeStreamlined = cortex.executeSensePipeline.bind(cortex)
export const executeByType = cortex.executeTypedPipeline.bind(cortex) 
export const executeSingle = cortex.executeSingle.bind(cortex)
export const processStaticData = cortex.processStaticData.bind(cortex)
export const processStreamingData = cortex.processStreamingData.bind(cortex)

// Factory functions
export const createPipeline = <T, R>() => new Pipeline()
export const createStreamingPipeline = <T, R>() => new Pipeline()

// Backward compatibility type aliases
export enum StreamlinedExecutionMode {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  FIRST_SUCCESS = 'firstSuccess',
  FIRST_RESULT = 'firstResult',
  THREADED = 'threaded'
}

export type StreamlinedPipelineOptions = PipelineOptions
export type StreamlinedPipelineResult<T> = PipelineResult<T>