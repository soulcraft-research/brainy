/**
 * Augmentation Event Pipeline
 *
 * This module provides a pipeline for managing and executing multiple augmentations
 * of each type. It allows registering multiple augmentations and executing them
 * in sequence or in parallel.
 */

import {
  BrainyAugmentations,
  IAugmentation,
  IWebSocketSupport,
  AugmentationResponse,
  AugmentationType
} from './types/augmentations.js'

/**
 * Type definitions for the augmentation registry
 */
type AugmentationRegistry = {
  sense: BrainyAugmentations.ISenseAugmentation[];
  conduit: BrainyAugmentations.IConduitAugmentation[];
  cognition: BrainyAugmentations.ICognitionAugmentation[];
  memory: BrainyAugmentations.IMemoryAugmentation[];
  perception: BrainyAugmentations.IPerceptionAugmentation[];
  dialog: BrainyAugmentations.IDialogAugmentation[];
  activation: BrainyAugmentations.IActivationAugmentation[];
  webSocket: IWebSocketSupport[];
}

/**
 * Execution mode for the pipeline
 */
export enum ExecutionMode {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  FIRST_SUCCESS = 'firstSuccess',
  FIRST_RESULT = 'firstResult'
}

/**
 * Options for pipeline execution
 */
export interface PipelineOptions {
  mode?: ExecutionMode;
  timeout?: number;
  stopOnError?: boolean;
}

/**
 * Default pipeline options
 */
const DEFAULT_PIPELINE_OPTIONS: PipelineOptions = {
  mode: ExecutionMode.SEQUENTIAL,
  timeout: 30000,
  stopOnError: false
}

/**
 * AugmentationPipeline class
 *
 * Manages multiple augmentations of each type and provides methods to execute them.
 */
export class AugmentationPipeline {
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
  public register<T extends IAugmentation>(augmentation: T): AugmentationPipeline {
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
  public unregister(augmentationName: string): AugmentationPipeline {
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
   * Execute a sense pipeline
   *
   * @param method The method to execute on each sense augmentation
   * @param args The arguments to pass to the method
   * @param options The pipeline execution options
   * @returns A promise that resolves with the results from all augmentations
   */
  public async executeSensePipeline<
    M extends keyof BrainyAugmentations.ISenseAugmentation & string,
    R extends BrainyAugmentations.ISenseAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never
  >(
    method: M & (BrainyAugmentations.ISenseAugmentation[M] extends (...args: any[]) => any ? M : never),
    args: Parameters<Extract<BrainyAugmentations.ISenseAugmentation[M], (...args: any[]) => any>>,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    const opts = { ...DEFAULT_PIPELINE_OPTIONS, ...options }
    return this.executeTypedPipeline<BrainyAugmentations.ISenseAugmentation, M, R>(
      this.registry.sense,
      method,
      args,
      opts
    )
  }

  /**
   * Execute a conduit pipeline
   *
   * @param method The method to execute on each conduit augmentation
   * @param args The arguments to pass to the method
   * @param options The pipeline execution options
   * @returns A promise that resolves with the results from all augmentations
   */
  public async executeConduitPipeline<
    M extends keyof BrainyAugmentations.IConduitAugmentation & string,
    R extends BrainyAugmentations.IConduitAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never
  >(
    method: M & (BrainyAugmentations.IConduitAugmentation[M] extends (...args: any[]) => any ? M : never),
    args: Parameters<Extract<BrainyAugmentations.IConduitAugmentation[M], (...args: any[]) => any>>,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    const opts = { ...DEFAULT_PIPELINE_OPTIONS, ...options }
    return this.executeTypedPipeline<BrainyAugmentations.IConduitAugmentation, M, R>(
      this.registry.conduit,
      method,
      args,
      opts
    )
  }

  /**
   * Execute a cognition pipeline
   *
   * @param method The method to execute on each cognition augmentation
   * @param args The arguments to pass to the method
   * @param options The pipeline execution options
   * @returns A promise that resolves with the results from all augmentations
   */
  public async executeCognitionPipeline<
    M extends keyof BrainyAugmentations.ICognitionAugmentation & string,
    R extends BrainyAugmentations.ICognitionAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never
  >(
    method: M & (BrainyAugmentations.ICognitionAugmentation[M] extends (...args: any[]) => any ? M : never),
    args: Parameters<Extract<BrainyAugmentations.ICognitionAugmentation[M], (...args: any[]) => any>>,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    const opts = { ...DEFAULT_PIPELINE_OPTIONS, ...options }
    return this.executeTypedPipeline<BrainyAugmentations.ICognitionAugmentation, M, R>(
      this.registry.cognition,
      method,
      args,
      opts
    )
  }

  /**
   * Execute a memory pipeline
   *
   * @param method The method to execute on each memory augmentation
   * @param args The arguments to pass to the method
   * @param options The pipeline execution options
   * @returns A promise that resolves with the results from all augmentations
   */
  public async executeMemoryPipeline<
    M extends keyof BrainyAugmentations.IMemoryAugmentation & string,
    R extends BrainyAugmentations.IMemoryAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never
  >(
    method: M & (BrainyAugmentations.IMemoryAugmentation[M] extends (...args: any[]) => any ? M : never),
    args: Parameters<Extract<BrainyAugmentations.IMemoryAugmentation[M], (...args: any[]) => any>>,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    const opts = { ...DEFAULT_PIPELINE_OPTIONS, ...options }
    return this.executeTypedPipeline<BrainyAugmentations.IMemoryAugmentation, M, R>(
      this.registry.memory,
      method,
      args,
      opts
    )
  }

  /**
   * Execute a perception pipeline
   *
   * @param method The method to execute on each perception augmentation
   * @param args The arguments to pass to the method
   * @param options The pipeline execution options
   * @returns A promise that resolves with the results from all augmentations
   */
  public async executePerceptionPipeline<
    M extends keyof BrainyAugmentations.IPerceptionAugmentation & string,
    R extends BrainyAugmentations.IPerceptionAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never
  >(
    method: M & (BrainyAugmentations.IPerceptionAugmentation[M] extends (...args: any[]) => any ? M : never),
    args: Parameters<Extract<BrainyAugmentations.IPerceptionAugmentation[M], (...args: any[]) => any>>,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    const opts = { ...DEFAULT_PIPELINE_OPTIONS, ...options }
    return this.executeTypedPipeline<BrainyAugmentations.IPerceptionAugmentation, M, R>(
      this.registry.perception,
      method,
      args,
      opts
    )
  }

  /**
   * Execute a dialog pipeline
   *
   * @param method The method to execute on each dialog augmentation
   * @param args The arguments to pass to the method
   * @param options The pipeline execution options
   * @returns A promise that resolves with the results from all augmentations
   */
  public async executeDialogPipeline<
    M extends keyof BrainyAugmentations.IDialogAugmentation & string,
    R extends BrainyAugmentations.IDialogAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never
  >(
    method: M & (BrainyAugmentations.IDialogAugmentation[M] extends (...args: any[]) => any ? M : never),
    args: Parameters<Extract<BrainyAugmentations.IDialogAugmentation[M], (...args: any[]) => any>>,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    const opts = { ...DEFAULT_PIPELINE_OPTIONS, ...options }
    return this.executeTypedPipeline<BrainyAugmentations.IDialogAugmentation, M, R>(
      this.registry.dialog,
      method,
      args,
      opts
    )
  }

  /**
   * Execute an activation pipeline
   *
   * @param method The method to execute on each activation augmentation
   * @param args The arguments to pass to the method
   * @param options The pipeline execution options
   * @returns A promise that resolves with the results from all augmentations
   */
  public async executeActivationPipeline<
    M extends keyof BrainyAugmentations.IActivationAugmentation & string,
    R extends BrainyAugmentations.IActivationAugmentation[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never
  >(
    method: M & (BrainyAugmentations.IActivationAugmentation[M] extends (...args: any[]) => any ? M : never),
    args: Parameters<Extract<BrainyAugmentations.IActivationAugmentation[M], (...args: any[]) => any>>,
    options: PipelineOptions = {}
  ): Promise<Promise<{ success: boolean; data: R; error?: string }>[]> {
    const opts = { ...DEFAULT_PIPELINE_OPTIONS, ...options }
    return this.executeTypedPipeline<BrainyAugmentations.IActivationAugmentation, M, R>(
      this.registry.activation,
      method,
      args,
      opts
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
   * Execute a pipeline for a specific augmentation type
   *
   * @param augmentations The augmentations to execute
   * @param method The method to execute on each augmentation
   * @param args The arguments to pass to the method
   * @param options The pipeline execution options
   * @returns A promise that resolves with the results from all augmentations
   */
  private async executeTypedPipeline<
    T extends IAugmentation,
    M extends keyof T & string,
    R extends T[M] extends (...args: any[]) => AugmentationResponse<infer U> ? U : never
  >(
    augmentations: T[],
    method: M & (T[M] extends (...args: any[]) => any ? M : never),
    args: Parameters<Extract<T[M], (...args: any[]) => any>>,
    options: PipelineOptions
  ): Promise<Promise<{
    success: boolean
    data: R
    error?: string
  }>[]> {
    if (augmentations.length === 0) {
      return []
    }

    // Create a function to execute the method on an augmentation
    const executeMethod = async (augmentation: T): Promise<{
      success: boolean
      data: R
      error?: string
    }> => {
      try {
        // Create a timeout promise if a timeout is specified
        const timeoutPromise = options.timeout
          ? new Promise<{
            success: boolean
            data: R
            error?: string
          }>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Timeout executing ${String(method)} on ${augmentation.name}`))
            }, options.timeout)
          })
          : null

        // Execute the method on the augmentation
        const methodPromise = (augmentation[method] as Function)(...args) as AugmentationResponse<R>

        // Race the method promise against the timeout promise if a timeout is specified
        const result = timeoutPromise
          ? await Promise.race([methodPromise, timeoutPromise])
          : await methodPromise

        return result
      } catch (error) {
        console.error(`Error executing ${String(method)} on ${augmentation.name}:`, error)
        return {
          success: false,
          data: null as unknown as R,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }

    // Execute the pipeline based on the specified mode
    switch (options.mode) {
      case ExecutionMode.PARALLEL:
        // Execute all augmentations in parallel
        return augmentations.map(executeMethod)

      case ExecutionMode.FIRST_SUCCESS:
        // Execute augmentations sequentially until one succeeds
        for (const augmentation of augmentations) {
          const resultPromise = executeMethod(augmentation)
          const result = await resultPromise
          if (result.success) {
            return [resultPromise]
          }
        }
        return []

      case ExecutionMode.FIRST_RESULT:
        // Execute augmentations sequentially until one returns a result
        for (const augmentation of augmentations) {
          const resultPromise = executeMethod(augmentation)
          const result = await resultPromise
          if (result.success && result.data) {
            return [resultPromise]
          }
        }
        return []

      case ExecutionMode.SEQUENTIAL:
      default:
        // Execute augmentations sequentially
        const results: Promise<{
          success: boolean
          data: R
          error?: string
        }>[] = []
        for (const augmentation of augmentations) {
          const resultPromise = executeMethod(augmentation)
          results.push(resultPromise)

          // Check if we need to stop on error
          if (options.stopOnError) {
            const result = await resultPromise
            if (!result.success) {
              break
            }
          }
        }
        return results
    }
  }
}

// Create and export a default instance of the pipeline
export const augmentationPipeline = new AugmentationPipeline()
