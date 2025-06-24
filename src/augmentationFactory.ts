/**
 * Augmentation Factory
 *
 * This module provides a simplified factory for creating augmentations with minimal boilerplate.
 * It reduces the complexity of creating and using augmentations by providing a fluent API
 * and handling common patterns automatically.
 */

import {
  IAugmentation,
  AugmentationType,
  AugmentationResponse,
  ISenseAugmentation,
  IConduitAugmentation,
  ICognitionAugmentation,
  IMemoryAugmentation,
  IPerceptionAugmentation,
  IDialogAugmentation,
  IActivationAugmentation,
  IWebSocketSupport,
  WebSocketConnection
} from './types/augmentations.js'
import { registerAugmentation } from './augmentationRegistry.js'

/**
 * Options for creating an augmentation
 */
export interface AugmentationOptions {
  name: string
  description?: string
  enabled?: boolean
  autoRegister?: boolean
  autoInitialize?: boolean
}

/**
 * Base class for all augmentations created with the factory
 * Handles common functionality like initialization, shutdown, and status
 */
class BaseAugmentation implements IAugmentation {
  readonly name: string
  readonly description: string
  enabled: boolean = true
  protected isInitialized: boolean = false

  constructor(options: AugmentationOptions) {
    this.name = options.name
    this.description = options.description || `${options.name} augmentation`
    this.enabled = options.enabled !== false
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return
    this.isInitialized = true
  }

  async shutDown(): Promise<void> {
    this.isInitialized = false
  }

  async getStatus(): Promise<'active' | 'inactive' | 'error'> {
    return this.isInitialized ? 'active' : 'inactive'
  }

  protected async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }
}

/**
 * Factory for creating sense augmentations
 */
export function createSenseAugmentation(
  options: AugmentationOptions & {
    processRawData?: (
      rawData: Buffer | string,
      dataType: string
    ) =>
      | Promise<AugmentationResponse<{ nouns: string[]; verbs: string[] }>>
      | AugmentationResponse<{
          nouns: string[]
          verbs: string[]
        }>
    listenToFeed?: (
      feedUrl: string,
      callback: (data: { nouns: string[]; verbs: string[] }) => void
    ) => Promise<void>
  }
): ISenseAugmentation {
  const augmentation = new BaseAugmentation(options) as unknown as ISenseAugmentation

  // Implement the sense augmentation methods
  augmentation.processRawData = async (
    rawData: Buffer | string,
    dataType: string
  ) => {
    await augmentation.ensureInitialized()

    if (options.processRawData) {
      const result = options.processRawData(rawData, dataType)
      return result instanceof Promise ? await result : result
    }

    return {
      success: false,
      data: { nouns: [], verbs: [] },
      error: 'processRawData not implemented'
    }
  }

  augmentation.listenToFeed = async (
    feedUrl: string,
    callback: (data: { nouns: string[]; verbs: string[] }) => void
  ) => {
    await augmentation.ensureInitialized()

    if (options.listenToFeed) {
      return options.listenToFeed(feedUrl, callback)
    }

    throw new Error('listenToFeed not implemented')
  }

  // Auto-register if requested
  if (options.autoRegister) {
    registerAugmentation(augmentation)

    // Auto-initialize if requested
    if (options.autoInitialize) {
      augmentation.initialize().catch((error) => {
        console.error(
          `Failed to initialize augmentation ${augmentation.name}:`,
          error
        )
      })
    }
  }

  return augmentation
}

/**
 * Factory for creating conduit augmentations
 */
export function createConduitAugmentation(
  options: AugmentationOptions & {
    establishConnection?: (
      targetSystemId: string,
      config: Record<string, unknown>
    ) =>
      | Promise<AugmentationResponse<WebSocketConnection>>
      | AugmentationResponse<WebSocketConnection>
    readData?: (
      query: Record<string, unknown>,
      options?: Record<string, unknown>
    ) => Promise<AugmentationResponse<unknown>> | AugmentationResponse<unknown>
    writeData?: (
      data: Record<string, unknown>,
      options?: Record<string, unknown>
    ) => Promise<AugmentationResponse<unknown>> | AugmentationResponse<unknown>
    monitorStream?: (
      streamId: string,
      callback: (data: unknown) => void
    ) => Promise<void>
  }
): IConduitAugmentation {
  const augmentation = new BaseAugmentation(options) as unknown as IConduitAugmentation

  // Implement the conduit augmentation methods
  augmentation.establishConnection = async (
    targetSystemId: string,
    config: Record<string, unknown>
  ) => {
    await augmentation.ensureInitialized()

    if (options.establishConnection) {
      const result = options.establishConnection(targetSystemId, config)
      return result instanceof Promise ? await result : result
    }

    return {
      success: false,
      data: null as any,
      error: 'establishConnection not implemented'
    }
  }

  augmentation.readData = async (
    query: Record<string, unknown>,
    opts?: Record<string, unknown>
  ) => {
    await augmentation.ensureInitialized()

    if (options.readData) {
      const result = options.readData(query, opts)
      return result instanceof Promise ? await result : result
    }

    return {
      success: false,
      data: null,
      error: 'readData not implemented'
    }
  }

  augmentation.writeData = async (
    data: Record<string, unknown>,
    opts?: Record<string, unknown>
  ) => {
    await augmentation.ensureInitialized()

    if (options.writeData) {
      const result = options.writeData(data, opts)
      return result instanceof Promise ? await result : result
    }

    return {
      success: false,
      data: null,
      error: 'writeData not implemented'
    }
  }

  augmentation.monitorStream = async (
    streamId: string,
    callback: (data: unknown) => void
  ) => {
    await augmentation.ensureInitialized()

    if (options.monitorStream) {
      return options.monitorStream(streamId, callback)
    }

    throw new Error('monitorStream not implemented')
  }

  // Auto-register if requested
  if (options.autoRegister) {
    registerAugmentation(augmentation)

    // Auto-initialize if requested
    if (options.autoInitialize) {
      augmentation.initialize().catch((error) => {
        console.error(
          `Failed to initialize augmentation ${augmentation.name}:`,
          error
        )
      })
    }
  }

  return augmentation
}

/**
 * Factory for creating memory augmentations
 */
export function createMemoryAugmentation(
  options: AugmentationOptions & {
    storeData?: (
      key: string,
      data: unknown,
      options?: Record<string, unknown>
    ) => Promise<AugmentationResponse<boolean>> | AugmentationResponse<boolean>
    retrieveData?: (
      key: string,
      options?: Record<string, unknown>
    ) => Promise<AugmentationResponse<unknown>> | AugmentationResponse<unknown>
    updateData?: (
      key: string,
      data: unknown,
      options?: Record<string, unknown>
    ) => Promise<AugmentationResponse<boolean>> | AugmentationResponse<boolean>
    deleteData?: (
      key: string,
      options?: Record<string, unknown>
    ) => Promise<AugmentationResponse<boolean>> | AugmentationResponse<boolean>
    listDataKeys?: (
      pattern?: string,
      options?: Record<string, unknown>
    ) =>
      | Promise<AugmentationResponse<string[]>>
      | AugmentationResponse<string[]>
    search?: (
      query: unknown,
      k?: number,
      options?: Record<string, unknown>
    ) =>
      | Promise<
          AugmentationResponse<
            Array<{ id: string; score: number; data: unknown }>
          >
        >
      | AugmentationResponse<
          Array<{ id: string; score: number; data: unknown }>
        >
  }
): IMemoryAugmentation {
  const augmentation = new BaseAugmentation(options) as unknown as IMemoryAugmentation

  // Implement the memory augmentation methods
  augmentation.storeData = async (
    key: string,
    data: unknown,
    opts?: Record<string, unknown>
  ) => {
    await augmentation.ensureInitialized()

    if (options.storeData) {
      const result = options.storeData(key, data, opts)
      return result instanceof Promise ? await result : result
    }

    return {
      success: false,
      data: false,
      error: 'storeData not implemented'
    }
  }

  augmentation.retrieveData = async (
    key: string,
    opts?: Record<string, unknown>
  ) => {
    await augmentation.ensureInitialized()

    if (options.retrieveData) {
      const result = options.retrieveData(key, opts)
      return result instanceof Promise ? await result : result
    }

    return {
      success: false,
      data: null,
      error: 'retrieveData not implemented'
    }
  }

  augmentation.updateData = async (
    key: string,
    data: unknown,
    opts?: Record<string, unknown>
  ) => {
    await augmentation.ensureInitialized()

    if (options.updateData) {
      const result = options.updateData(key, data, opts)
      return result instanceof Promise ? await result : result
    }

    return {
      success: false,
      data: false,
      error: 'updateData not implemented'
    }
  }

  augmentation.deleteData = async (
    key: string,
    opts?: Record<string, unknown>
  ) => {
    await augmentation.ensureInitialized()

    if (options.deleteData) {
      const result = options.deleteData(key, opts)
      return result instanceof Promise ? await result : result
    }

    return {
      success: false,
      data: false,
      error: 'deleteData not implemented'
    }
  }

  augmentation.listDataKeys = async (
    pattern?: string,
    opts?: Record<string, unknown>
  ) => {
    await augmentation.ensureInitialized()

    if (options.listDataKeys) {
      const result = options.listDataKeys(pattern, opts)
      return result instanceof Promise ? await result : result
    }

    return {
      success: false,
      data: [],
      error: 'listDataKeys not implemented'
    }
  }

  augmentation.search = async (
    query: unknown,
    k?: number,
    opts?: Record<string, unknown>
  ) => {
    await augmentation.ensureInitialized()

    if (options.search) {
      const result = options.search(query, k, opts)
      return result instanceof Promise ? await result : result
    }

    return {
      success: false,
      data: [],
      error: 'search not implemented'
    }
  }

  // Auto-register if requested
  if (options.autoRegister) {
    registerAugmentation(augmentation)

    // Auto-initialize if requested
    if (options.autoInitialize) {
      augmentation.initialize().catch((error) => {
        console.error(
          `Failed to initialize augmentation ${augmentation.name}:`,
          error
        )
      })
    }
  }

  return augmentation
}

/**
 * Factory for creating WebSocket-enabled augmentations
 * This can be combined with other augmentation factories to create WebSocket-enabled versions
 */
export function addWebSocketSupport<T extends IAugmentation>(
  augmentation: T,
  options: {
    connectWebSocket?: (
      url: string,
      protocols?: string | string[]
    ) => Promise<WebSocketConnection>
    sendWebSocketMessage?: (
      connectionId: string,
      data: unknown
    ) => Promise<void>
    onWebSocketMessage?: (
      connectionId: string,
      callback: (data: unknown) => void
    ) => Promise<void>
    offWebSocketMessage?: (
      connectionId: string,
      callback: (data: unknown) => void
    ) => Promise<void>
    closeWebSocket?: (
      connectionId: string,
      code?: number,
      reason?: string
    ) => Promise<void>
  }
): T & IWebSocketSupport {
  const wsAugmentation = augmentation as T & IWebSocketSupport

  // Add WebSocket methods
  wsAugmentation.connectWebSocket = async (
    url: string,
    protocols?: string | string[]
  ) => {
    await (augmentation as any).ensureInitialized?.()

    if (options.connectWebSocket) {
      return options.connectWebSocket(url, protocols)
    }

    throw new Error('connectWebSocket not implemented')
  }

  wsAugmentation.sendWebSocketMessage = async (
    connectionId: string,
    data: unknown
  ) => {
    await (augmentation as any).ensureInitialized?.()

    if (options.sendWebSocketMessage) {
      return options.sendWebSocketMessage(connectionId, data)
    }

    throw new Error('sendWebSocketMessage not implemented')
  }

  wsAugmentation.onWebSocketMessage = async (
    connectionId: string,
    callback: (data: unknown) => void
  ) => {
    await (augmentation as any).ensureInitialized?.()

    if (options.onWebSocketMessage) {
      return options.onWebSocketMessage(connectionId, callback)
    }

    throw new Error('onWebSocketMessage not implemented')
  }

  wsAugmentation.offWebSocketMessage = async (
    connectionId: string,
    callback: (data: unknown) => void
  ) => {
    await (augmentation as any).ensureInitialized?.()

    if (options.offWebSocketMessage) {
      return options.offWebSocketMessage(connectionId, callback)
    }

    throw new Error('offWebSocketMessage not implemented')
  }

  wsAugmentation.closeWebSocket = async (
    connectionId: string,
    code?: number,
    reason?: string
  ) => {
    await (augmentation as any).ensureInitialized?.()

    if (options.closeWebSocket) {
      return options.closeWebSocket(connectionId, code, reason)
    }

    throw new Error('closeWebSocket not implemented')
  }

  return wsAugmentation
}

/**
 * Simplified function to execute an augmentation method with automatic error handling
 * This provides a more concise way to execute augmentation methods compared to the full pipeline
 */
export async function executeAugmentation<T, R>(
  augmentation: IAugmentation,
  method: string,
  ...args: any[]
): Promise<AugmentationResponse<R>> {
  try {
    if (!augmentation.enabled) {
      return {
        success: false,
        data: null as any,
        error: `Augmentation ${augmentation.name} is disabled`
      }
    }

    if (typeof (augmentation as any)[method] !== 'function') {
      return {
        success: false,
        data: null as any,
        error: `Method ${method} not found on augmentation ${augmentation.name}`
      }
    }

    const result = await (augmentation as any)[method](...args)
    return result
  } catch (error) {
    console.error(`Error executing ${method} on ${augmentation.name}:`, error)
    return {
      success: false,
      data: null as any,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Dynamically load augmentations from a module at runtime
 * This allows for lazy-loading augmentations when needed instead of at build time
 */
export async function loadAugmentationModule(
  modulePromise: Promise<any>,
  options: {
    autoRegister?: boolean
    autoInitialize?: boolean
  } = {}
): Promise<IAugmentation[]> {
  try {
    const module = await modulePromise
    const augmentations: IAugmentation[] = []

    // Extract augmentations from the module
    for (const key in module) {
      const exported = module[key]

      // Skip non-objects and null
      if (!exported || typeof exported !== 'object') {
        continue
      }

      // Check if it's an augmentation
      if (
        typeof exported.name === 'string' &&
        typeof exported.initialize === 'function' &&
        typeof exported.shutDown === 'function' &&
        typeof exported.getStatus === 'function'
      ) {
        augmentations.push(exported)

        // Auto-register if requested
        if (options.autoRegister) {
          registerAugmentation(exported)

          // Auto-initialize if requested
          if (options.autoInitialize) {
            exported.initialize().catch((error: Error) => {
              console.error(
                `Failed to initialize augmentation ${exported.name}:`,
                error
              )
            })
          }
        }
      }
    }

    return augmentations
  } catch (error) {
    console.error('Error loading augmentation module:', error)
    return []
  }
}
