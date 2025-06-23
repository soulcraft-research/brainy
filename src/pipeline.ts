/**
 * Unified Pipeline
 *
 * This module combines the functionality of the primary augmentation pipeline and the streamlined pipeline
 * into a single, unified pipeline system. It provides both the registry functionality of the primary pipeline
 * and the simplified execution API of the streamlined pipeline.
 */

import {
  IAugmentation,
  AugmentationType,
  AugmentationResponse,
  IWebSocketSupport,
  BrainyAugmentations
} from './types/augmentations.js'
import { AugmentationRegistry, IPipeline } from './types/pipelineTypes.js'
import { isThreadingAvailable } from './utils/environment.js'
import { executeInThread } from './utils/workerUtils.js'
import { executeAugmentation } from './augmentationFactory.js'
import { setDefaultPipeline } from './augmentationRegistry.js'

/**
 * Execution mode for the pipeline
 */
export enum ExecutionMode {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  FIRST_SUCCESS = 'firstSuccess',
  FIRST_RESULT = 'firstResult',
  THREADED = 'threaded'  // Execute in separate threads when available
}

/**
 * Options for pipeline execution
 */
export interface PipelineOptions {
  mode?: ExecutionMode;
  timeout?: number;
  stopOnError?: boolean;
  forceThreading?: boolean;  // Force threading even if not in THREADED mode
  disableThreading?: boolean;  // Disable threading even if in THREADED mode
}

/**
 * Default pipeline options
 */
const DEFAULT_PIPELINE_OPTIONS: PipelineOptions = {
  mode: ExecutionMode.SEQUENTIAL,
  timeout: 30000,
  stopOnError: false,
  forceThreading: false,
  disableThreading: false
}

/**
 * Result of a pipeline execution
 */
export interface PipelineResult<T> {
  results: AugmentationResponse<T>[];
  errors: Error[];
  successful: AugmentationResponse<T>[];
}

/**
 * Pipeline class
 *
 * Manages multiple augmentations of each type and provides methods to execute them.
 * Implements the IPipeline interface to avoid circular dependencies.
 */
export class Pipeline implements IPipeline {
  private registry: AugmentationRegistry = {
    sense: [],
    conduit: [],
    cognition: [],
    memory: [],
    perception: [],
    dialog: [],
    activation: [],
    webSocket: []
  }

  /**
   * Register an augmentation with the pipeline
   *
   * @param augmentation The augmentation to register
   * @returns The pipeline instance for chaining
   */
  public register<T extends IAugmentation>(augmentation: T): Pipeline {
    let registered = false

    // Check for specific augmentation types
    if (this.isAugmentationType<BrainyAugmentations.ISenseAugmentation>(
      augmentation,
      'processRawData',
      'listenToFeed'
    )) {
      this.registry.sense.push(augmentation)
      registered = true
    } else if (this.isAugmentationType<BrainyAugmentations.IConduitAugmentation>(
      augmentation,
      'establishConnection',
      'readData',
      'writeData',
      'monitorStream'
    )) {
      this.registry.conduit.push(augmentation)
      registered = true
    } else if (this.isAugmentationType<BrainyAugmentations.ICognitionAugmentation>(
      augmentation,
      'reason',
      'infer',
      'executeLogic'
    )) {
      this.registry.cognition.push(augmentation)
      registered = true
    } else if (this.isAugmentationType<BrainyAugmentations.IMemoryAugmentation>(
      augmentation,
      'storeData',
      'retrieveData',
      'updateData',
      'deleteData',
      'listDataKeys'
    )) {
      this.registry.memory.push(augmentation)
      registered = true
    } else if (this.isAugmentationType<BrainyAugmentations.IPerceptionAugmentation>(
      augmentation,
      'interpret',
      'organize',
      'generateVisualization'
    )) {
      this.registry.perception.push(augmentation)
      registered = true
    } else if (this.isAugmentationType<BrainyAugmentations.IDialogAugmentation>(
      augmentation,
      'processUserInput',
      'generateResponse',
      'manageContext'
    )) {
      this.registry.dialog.push(augmentation)
      registered = true
    } else if (this.isAugmentationType<BrainyAugmentations.IActivationAugmentation>(
      augmentation,
      'triggerAction',
      'generateOutput',
      'interactExternal'
    )) {
      this.registry.activation.push(augmentation)
      registered = true
    }

    // Check if the augmentation supports WebSocket
    if (this.isAugmentationType<IWebSocketSupport>(
      augmentation,
      'connectWebSocket',
      'sendWebSocketMessage',
      'onWebSocketMessage',
      'closeWebSocket'
    )) {
      this.registry.webSocket.push(augmentation as IWebSocketSupport)
      registered = true
    }

    // If the augmentation wasn't registered as any known type, throw an error
    if (!registered) {
      throw new Error(`Unknown augmentation type: ${augmentation.name}`)
    }

    return this
  }

  /**
   * Unregister an augmentation from the pipeline
   *
   * @param augmentationName The name of the augmentation to unregister
   * @returns The pipeline instance for chaining
   */
  public unregister(augmentationName: string): Pipeline {
    let found = false

    // Remove from all registries
    for (const type in this.registry) {
      const typedRegistry = this.registry[type as keyof AugmentationRegistry]
      const index = typedRegistry.findIndex(aug => aug.name === augmentationName)

      if (index !== -1) {
        typedRegistry.splice(index, 1)
        found = true
      }
    }

    return this
  }

  /**
   * Initialize all registered augmentations
   *
   * @returns A promise that resolves when all augmentations are initialized
   */
  public async initialize(): Promise<void> {
    const allAugmentations = this.getAllAugmentations()

    await Promise.all(
      allAugmentations.map(augmentation =>
        augmentation.initialize().catch(error => {
          console.error(`Failed to initialize augmentation ${augmentation.name}:`, error)
        })
      )
    )
  }

  /**
   * Shut down all registered augmentations
   *
   * @returns A promise that resolves when all augmentations are shut down
   */
  public async shutDown(): Promise<void> {
    const allAugmentations = this.getAllAugmentations()

    await Promise.all(
      allAugmentations.map(augmentation =>
        augmentation.shutDown().catch(error => {
          console.error(`Failed to shut down augmentation ${augmentation.name}:`, error)
        })
      )
    )
  }

  /**
   * Get all registered augmentations
   *
   * @returns An array of all registered augmentations
   */
  public getAllAugmentations(): IAugmentation[] {
    // Create a Set to avoid duplicates (an augmentation might be in multiple registries)
    const allAugmentations = new Set<IAugmentation>([
      ...this.registry.sense,
      ...this.registry.conduit,
      ...this.registry.cognition,
      ...this.registry.memory,
      ...this.registry.perception,
      ...this.registry.dialog,
      ...this.registry.activation,
      ...this.registry.webSocket
    ])

    // Convert back to array
    return Array.from(allAugmentations)
  }

  /**
   * Get all augmentations of a specific type
   *
   * @param type The type of augmentation to get
   * @returns An array of all augmentations of the specified type
   */
  public getAugmentationsByType(type: AugmentationType): IAugmentation[] {
    switch (type) {
      case AugmentationType.SENSE:
        return [...this.registry.sense]
      case AugmentationType.CONDUIT:
        return [...this.registry.conduit]
      case AugmentationType.COGNITION:
        return [...this.registry.cognition]
      case AugmentationType.MEMORY:
        return [...this.registry.memory]
      case AugmentationType.PERCEPTION:
        return [...this.registry.perception]
      case AugmentationType.DIALOG:
        return [...this.registry.dialog]
      case AugmentationType.ACTIVATION:
        return [...this.registry.activation]
      case AugmentationType.WEBSOCKET:
        return [...this.registry.webSocket]
      default:
        return []
    }
  }

  /**
   * Get all available augmentation types
   *
   * @returns An array of all augmentation types that have at least one registered augmentation
   */
  public getAvailableAugmentationTypes(): AugmentationType[] {
    const availableTypes: AugmentationType[] = []

    if (this.registry.sense.length > 0) availableTypes.push(AugmentationType.SENSE)
    if (this.registry.conduit.length > 0) availableTypes.push(AugmentationType.CONDUIT)
    if (this.registry.cognition.length > 0) availableTypes.push(AugmentationType.COGNITION)
    if (this.registry.memory.length > 0) availableTypes.push(AugmentationType.MEMORY)
    if (this.registry.perception.length > 0) availableTypes.push(AugmentationType.PERCEPTION)
    if (this.registry.dialog.length > 0) availableTypes.push(AugmentationType.DIALOG)
    if (this.registry.activation.length > 0) availableTypes.push(AugmentationType.ACTIVATION)
    if (this.registry.webSocket.length > 0) availableTypes.push(AugmentationType.WEBSOCKET)

    return availableTypes
  }

  /**
   * Get all WebSocket-supporting augmentations
   *
   * @returns An array of all augmentations that support WebSocket connections
   */
  public getWebSocketAugmentations(): IWebSocketSupport[] {
    return [...this.registry.webSocket]
  }

  /**
   * Check if an augmentation is of a specific type
   *
   * @param augmentation The augmentation to check
   * @param methods The methods that should be present on the augmentation
   * @returns True if the augmentation is of the specified type
   */
  private isAugmentationType<T extends IAugmentation>(
    augmentation: IAugmentation,
    ...methods: (keyof T)[]
  ): augmentation is T {
    // First check that the augmentation has all the required base methods
    const baseMethodsExist = [
      'initialize',
      'shutDown',
      'getStatus'
    ].every(method => typeof (augmentation as any)[method] === 'function')

    if (!baseMethodsExist) {
      return false
    }

    // Then check that it has all the specific methods for this type
    return methods.every(method => typeof (augmentation as any)[method] === 'function')
  }

  /**
   * Determines if threading should be used based on options and environment
   * 
   * @param options The pipeline options
   * @returns True if threading should be used, false otherwise
   */
  private shouldUseThreading(options: PipelineOptions): boolean {
    // If threading is explicitly disabled, don't use it
    if (options.disableThreading) {
      return false
    }

    // If threading is explicitly forced, use it if available
    if (options.forceThreading) {
      return isThreadingAvailable()
    }

    // If in THREADED mode, use threading if available
    if (options.mode === ExecutionMode.THREADED) {
      return isThreadingAvailable()
    }

    // Otherwise, don't use threading
    return false
  }

  /**
   * Executes a method on multiple augmentations using the specified execution mode
   * 
   * @param augmentations The augmentations to execute the method on
   * @param method The method to execute
   * @param args The arguments to pass to the method
   * @param options Options for the execution
   * @returns A promise that resolves with the results
   */
  public async execute<T>(
    augmentations: IAugmentation[],
    method: string,
    args: any[] = [],
    options: PipelineOptions = {}
  ): Promise<PipelineResult<T>> {
    const opts = { ...DEFAULT_PIPELINE_OPTIONS, ...options }
    const enabledAugmentations = augmentations.filter(aug => aug.enabled !== false)

    if (enabledAugmentations.length === 0) {
      return { results: [], errors: [], successful: [] }
    }

    const result: PipelineResult<T> = {
      results: [],
      errors: [],
      successful: []
    }

    // Create a function to execute with timeout
    const executeWithTimeout = async (
      augmentation: IAugmentation
    ): Promise<AugmentationResponse<T>> => {
      try {
        // Create a timeout promise if a timeout is specified
        if (opts.timeout) {
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(
                new Error(`Timeout executing ${method} on ${augmentation.name}`)
              )
            }, opts.timeout)
          })

          // Check if threading should be used
          const useThreading = this.shouldUseThreading(opts)

          // Execute the method on the augmentation, using threading if appropriate
          let methodPromise: Promise<AugmentationResponse<T>>

          if (useThreading) {
            // Execute in a separate thread
            try {
              // Create a function that can be serialized and executed in a worker
              const workerFn = (...workerArgs: any[]) => {
                // This function will be stringified and executed in the worker
                // It needs to be self-contained
                const augFn = augmentation[method as string] as Function
                return augFn.apply(augmentation, workerArgs)
              }

              methodPromise = executeInThread<AugmentationResponse<T>>(workerFn, ...args)
            } catch (threadError) {
              console.warn(`Failed to execute in thread, falling back to main thread: ${threadError}`)
              // Fall back to executing in the main thread
              methodPromise = Promise.resolve((augmentation[method] as Function)(...args) as AugmentationResponse<T>)
            }
          } else {
            // Execute in the main thread
            methodPromise = Promise.resolve((augmentation[method] as Function)(...args) as AugmentationResponse<T>)
          }

          // Race the method promise against the timeout promise
          return await Promise.race([methodPromise, timeoutPromise])
        } else {
          // No timeout, just execute the method
          return await executeAugmentation<any, T>(augmentation, method, ...args)
        }
      } catch (error) {
        result.errors.push(
          error instanceof Error ? error : new Error(String(error))
        )
        return {
          success: false,
          data: null as any,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }

    // Execute based on the specified mode
    switch (opts.mode) {
      case ExecutionMode.PARALLEL:
      case ExecutionMode.THREADED:
        // Execute all augmentations in parallel
        result.results = await Promise.all(
          enabledAugmentations.map((aug) => executeWithTimeout(aug))
        )
        break

      case ExecutionMode.FIRST_SUCCESS:
        // Execute augmentations sequentially until one succeeds
        for (const augmentation of enabledAugmentations) {
          const response = await executeWithTimeout(augmentation)
          result.results.push(response)

          if (response.success) {
            break
          }
        }
        break

      case ExecutionMode.FIRST_RESULT:
        // Execute augmentations sequentially until one returns a non-null result
        for (const augmentation of enabledAugmentations) {
          const response = await executeWithTimeout(augmentation)
          result.results.push(response)

          if (
            response.success &&
            response.data !== null &&
            response.data !== undefined
          ) {
            break
          }
        }
        break

      case ExecutionMode.SEQUENTIAL:
      default:
        // Execute augmentations sequentially
        for (const augmentation of enabledAugmentations) {
          const response = await executeWithTimeout(augmentation)
          result.results.push(response)

          // Check if we need to stop on error
          if (opts.stopOnError && !response.success) {
            break
          }
        }
        break
    }

    // Filter successful results
    result.successful = result.results.filter((r) => r.success)

    return result
  }

  /**
   * Executes a method on augmentations of a specific type
   * 
   * @param type The type of augmentations to execute the method on
   * @param method The method to execute
   * @param args The arguments to pass to the method
   * @param options Options for the execution
   * @returns A promise that resolves with the results
   */
  public async executeByType<T>(
    type: AugmentationType,
    method: string,
    args: any[] = [],
    options: PipelineOptions = {}
  ): Promise<PipelineResult<T>> {
    const augmentations = this.getAugmentationsByType(type)
    return this.execute<T>(augmentations, method, args, options)
  }

  /**
   * Executes a method on a single augmentation with automatic error handling
   * 
   * @param augmentation The augmentation to execute the method on
   * @param method The method to execute
   * @param args The arguments to pass to the method
   * @returns A promise that resolves with the result
   */
  public async executeSingle<T>(
    augmentation: IAugmentation,
    method: string,
    ...args: any[]
  ): Promise<AugmentationResponse<T>> {
    return executeAugmentation<any, T>(augmentation, method, ...args)
  }

  /**
   * Process static data through a pipeline of augmentations
   * 
   * @param data The data to process
   * @param pipeline An array of processing steps, each with an augmentation, method, and optional args transformer
   * @param options Options for the execution
   * @returns A promise that resolves with the final result
   */
  public async processStaticData<T, R = any>(
    data: T,
    pipeline: Array<{
      augmentation: IAugmentation
      method: string
      transformArgs?: (data: any, prevResult?: any) => any[]
    }>,
    options: PipelineOptions = {}
  ): Promise<AugmentationResponse<R>> {
    let currentData = data
    let prevResult: any = undefined

    for (const step of pipeline) {
      // Transform args if a transformer is provided, otherwise use the current data as the only arg
      const args = step.transformArgs
        ? step.transformArgs(currentData, prevResult)
        : [currentData]

      // Execute the method
      const result = await this.executeSingle<any>(
        step.augmentation,
        step.method,
        ...args
      )

      // If the step failed, return the error
      if (!result.success) {
        return result as AugmentationResponse<R>
      }

      // Update the current data for the next step
      currentData = result.data
      prevResult = result
    }

    // Return the final result
    return prevResult as AugmentationResponse<R>
  }

  /**
   * Process streaming data through a pipeline of augmentations
   * 
   * @param source The source augmentation that provides the data stream
   * @param sourceMethod The method on the source augmentation that provides the data stream
   * @param sourceArgs The arguments to pass to the source method
   * @param pipeline An array of processing steps, each with an augmentation, method, and optional args transformer
   * @param callback Function to call with the results of processing each data item
   * @param options Options for the execution
   * @returns A promise that resolves when the pipeline is set up
   */
  public async processStreamingData<T>(
    source: IAugmentation,
    sourceMethod: string,
    sourceArgs: any[],
    pipeline: Array<{
      augmentation: IAugmentation
      method: string
      transformArgs?: (data: any, prevResult?: any) => any[]
    }>,
    callback: (result: AugmentationResponse<T>) => void,
    options: PipelineOptions = {}
  ): Promise<void> {
    // Create a chain of processors
    const processData = async (data: any) => {
      let currentData = data
      let prevResult: any = undefined

      for (const step of pipeline) {
        // Transform args if a transformer is provided, otherwise use the current data as the only arg
        const args = step.transformArgs
          ? step.transformArgs(currentData, prevResult)
          : [currentData]

        // Execute the method
        const result = await this.executeSingle<any>(
          step.augmentation,
          step.method,
          ...args
        )

        // If the step failed, return the error
        if (!result.success) {
          callback(result as AugmentationResponse<T>)
          return
        }

        // Update the current data for the next step
        currentData = result.data
        prevResult = result
      }

      // Call the callback with the final result
      callback(prevResult as AugmentationResponse<T>)
    }

    // The last argument to the source method should be a callback that receives the data
    const dataCallback = (data: any) => {
      processData(data).catch((error) => {
        console.error('Error processing streaming data:', error)
        callback({
          success: false,
          data: null as any,
          error: error instanceof Error ? error.message : String(error)
        })
      })
    }

    // Execute the source method with the provided args and the data callback
    await this.executeSingle(source, sourceMethod, ...sourceArgs, dataCallback)
  }

  /**
   * Create a reusable pipeline for processing data
   * 
   * @param pipeline An array of processing steps
   * @param options Options for the execution
   * @returns A function that processes data through the pipeline
   */
  public createPipeline<T, R>(
    pipeline: Array<{
      augmentation: IAugmentation
      method: string
      transformArgs?: (data: any, prevResult?: any) => any[]
    }>,
    options: PipelineOptions = {}
  ): (data: T) => Promise<AugmentationResponse<R>> {
    return (data: T) => this.processStaticData<T, R>(data, pipeline, options)
  }

  /**
   * Create a reusable streaming pipeline
   * 
   * @param source The source augmentation
   * @param sourceMethod The method on the source augmentation
   * @param pipeline An array of processing steps
   * @param options Options for the execution
   * @returns A function that sets up the streaming pipeline
   */
  public createStreamingPipeline<T, R>(
    source: IAugmentation,
    sourceMethod: string,
    pipeline: Array<{
      augmentation: IAugmentation
      method: string
      transformArgs?: (data: any, prevResult?: any) => any[]
    }>,
    options: PipelineOptions = {}
  ): (
    sourceArgs: any[],
    callback: (result: AugmentationResponse<R>) => void
  ) => Promise<void> {
    return (
      sourceArgs: any[],
      callback: (result: AugmentationResponse<R>) => void
    ) =>
      this.processStreamingData<R>(
        source,
        sourceMethod,
        sourceArgs,
        pipeline,
        callback,
        options
      )
  }

  // Legacy methods for backward compatibility

  /**
   * Execute a sense pipeline (legacy method)
   */
  public async executeSensePipeline<
    M extends keyof BrainyAugmentations.ISenseAugmentation & string,
    R extends BrainyAugmentations.ISenseAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never
  >(
    method: M & (BrainyAugmentations.ISenseAugmentation[M] extends (...args: any[]) => any ? M : never),
    args: Parameters<Extract<BrainyAugmentations.ISenseAugmentation[M], (...args: any[]) => any>>,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    const result = await this.executeByType<R>(AugmentationType.SENSE, method, args, options)
    return result.results.map(r => Promise.resolve(r))
  }

  /**
   * Execute a conduit pipeline (legacy method)
   */
  public async executeConduitPipeline<
    M extends keyof BrainyAugmentations.IConduitAugmentation & string,
    R extends BrainyAugmentations.IConduitAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never
  >(
    method: M & (BrainyAugmentations.IConduitAugmentation[M] extends (...args: any[]) => any ? M : never),
    args: Parameters<Extract<BrainyAugmentations.IConduitAugmentation[M], (...args: any[]) => any>>,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    const result = await this.executeByType<R>(AugmentationType.CONDUIT, method, args, options)
    return result.results.map(r => Promise.resolve(r))
  }

  /**
   * Execute a cognition pipeline (legacy method)
   */
  public async executeCognitionPipeline<
    M extends keyof BrainyAugmentations.ICognitionAugmentation & string,
    R extends BrainyAugmentations.ICognitionAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never
  >(
    method: M & (BrainyAugmentations.ICognitionAugmentation[M] extends (...args: any[]) => any ? M : never),
    args: Parameters<Extract<BrainyAugmentations.ICognitionAugmentation[M], (...args: any[]) => any>>,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    const result = await this.executeByType<R>(AugmentationType.COGNITION, method, args, options)
    return result.results.map(r => Promise.resolve(r))
  }

  /**
   * Execute a memory pipeline (legacy method)
   */
  public async executeMemoryPipeline<
    M extends keyof BrainyAugmentations.IMemoryAugmentation & string,
    R extends BrainyAugmentations.IMemoryAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never
  >(
    method: M & (BrainyAugmentations.IMemoryAugmentation[M] extends (...args: any[]) => any ? M : never),
    args: Parameters<Extract<BrainyAugmentations.IMemoryAugmentation[M], (...args: any[]) => any>>,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    const result = await this.executeByType<R>(AugmentationType.MEMORY, method, args, options)
    return result.results.map(r => Promise.resolve(r))
  }

  /**
   * Execute a perception pipeline (legacy method)
   */
  public async executePerceptionPipeline<
    M extends keyof BrainyAugmentations.IPerceptionAugmentation & string,
    R extends BrainyAugmentations.IPerceptionAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never
  >(
    method: M & (BrainyAugmentations.IPerceptionAugmentation[M] extends (...args: any[]) => any ? M : never),
    args: Parameters<Extract<BrainyAugmentations.IPerceptionAugmentation[M], (...args: any[]) => any>>,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    const result = await this.executeByType<R>(AugmentationType.PERCEPTION, method, args, options)
    return result.results.map(r => Promise.resolve(r))
  }

  /**
   * Execute a dialog pipeline (legacy method)
   */
  public async executeDialogPipeline<
    M extends keyof BrainyAugmentations.IDialogAugmentation & string,
    R extends BrainyAugmentations.IDialogAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never
  >(
    method: M & (BrainyAugmentations.IDialogAugmentation[M] extends (...args: any[]) => any ? M : never),
    args: Parameters<Extract<BrainyAugmentations.IDialogAugmentation[M], (...args: any[]) => any>>,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    const result = await this.executeByType<R>(AugmentationType.DIALOG, method, args, options)
    return result.results.map(r => Promise.resolve(r))
  }

  /**
   * Execute an activation pipeline (legacy method)
   */
  public async executeActivationPipeline<
    M extends keyof BrainyAugmentations.IActivationAugmentation & string,
    R extends BrainyAugmentations.IActivationAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never
  >(
    method: M & (BrainyAugmentations.IActivationAugmentation[M] extends (...args: any[]) => any ? M : never),
    args: Parameters<Extract<BrainyAugmentations.IActivationAugmentation[M], (...args: any[]) => any>>,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    const result = await this.executeByType<R>(AugmentationType.ACTIVATION, method, args, options)
    return result.results.map(r => Promise.resolve(r))
  }
}

// Create and export a default instance of the pipeline
export const pipeline = new Pipeline()

// Set the default pipeline instance for the augmentation registry
// This breaks the circular dependency between pipeline.ts and augmentationRegistry.ts
setDefaultPipeline(pipeline)

// Re-export the legacy pipeline for backward compatibility
export const augmentationPipeline = pipeline

// Re-export the streamlined execution functions for backward compatibility
export const executeStreamlined = <T>(
  augmentations: IAugmentation[],
  method: string,
  args: any[] = [],
  options: PipelineOptions = {}
): Promise<PipelineResult<T>> => {
  return pipeline.execute<T>(augmentations, method, args, options)
}

export const executeByType = <T>(
  type: AugmentationType,
  method: string,
  args: any[] = [],
  options: PipelineOptions = {}
): Promise<PipelineResult<T>> => {
  return pipeline.executeByType<T>(type, method, args, options)
}

export const executeSingle = <T>(
  augmentation: IAugmentation,
  method: string,
  ...args: any[]
): Promise<AugmentationResponse<T>> => {
  return pipeline.executeSingle<T>(augmentation, method, ...args)
}

export const processStaticData = <T, R = any>(
  data: T,
  pipelineSteps: Array<{
    augmentation: IAugmentation
    method: string
    transformArgs?: (data: any, prevResult?: any) => any[]
  }>,
  options: PipelineOptions = {}
): Promise<AugmentationResponse<R>> => {
  return pipeline.processStaticData<T, R>(data, pipelineSteps, options)
}

export const processStreamingData = <T>(
  source: IAugmentation,
  sourceMethod: string,
  sourceArgs: any[],
  pipelineSteps: Array<{
    augmentation: IAugmentation
    method: string
    transformArgs?: (data: any, prevResult?: any) => any[]
  }>,
  callback: (result: AugmentationResponse<T>) => void,
  options: PipelineOptions = {}
): Promise<void> => {
  return pipeline.processStreamingData<T>(source, sourceMethod, sourceArgs, pipelineSteps, callback, options)
}

export const createPipeline = <T, R>(
  pipelineSteps: Array<{
    augmentation: IAugmentation
    method: string
    transformArgs?: (data: any, prevResult?: any) => any[]
  }>,
  options: PipelineOptions = {}
): (data: T) => Promise<AugmentationResponse<R>> => {
  return pipeline.createPipeline<T, R>(pipelineSteps, options)
}

export const createStreamingPipeline = <T, R>(
  source: IAugmentation,
  sourceMethod: string,
  pipelineSteps: Array<{
    augmentation: IAugmentation
    method: string
    transformArgs?: (data: any, prevResult?: any) => any[]
  }>,
  options: PipelineOptions = {}
): (
  sourceArgs: any[],
  callback: (result: AugmentationResponse<R>) => void
) => Promise<void> => {
  return pipeline.createStreamingPipeline<T, R>(source, sourceMethod, pipelineSteps, options)
}

// For backward compatibility with StreamlinedExecutionMode
export const StreamlinedExecutionMode = ExecutionMode
export type StreamlinedPipelineOptions = PipelineOptions
export type StreamlinedPipelineResult<T> = PipelineResult<T>
