/**
 * Server Search Augmentations
 *
 * This file implements conduit and activation augmentations for browser-server search functionality.
 * It allows Brainy to search a server-hosted instance and store results locally.
 */

import {
  AugmentationType,
  IConduitAugmentation,
  IActivationAugmentation,
  IWebSocketSupport,
  AugmentationResponse,
  WebSocketConnection
} from '../types/augmentations.js'
import { WebSocketConduitAugmentation } from './conduitAugmentations.js'
import { v4 as uuidv4 } from '../universal/uuid.js'
import { BrainyDataInterface } from '../types/brainyDataInterface.js'

/**
 * ServerSearchConduitAugmentation
 *
 * A specialized conduit augmentation that provides functionality for searching
 * a server-hosted Brainy instance and storing results locally.
 */
export class ServerSearchConduitAugmentation extends WebSocketConduitAugmentation {
  private localDb: BrainyDataInterface | null = null

  constructor(name: string = 'server-search-conduit') {
    super(name)
    // this.description = 'Conduit augmentation for server-hosted Brainy search'
  }

  /**
   * Initialize the augmentation
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Initialize the base conduit
      await super.initialize()

      // Local DB must be set before initialization
      if (!this.localDb) {
        throw new Error(
          'Local database not set. Call setLocalDb before initializing.'
        )
      }

      this.isInitialized = true
    } catch (error) {
      console.error(`Failed to initialize ${this.name}:`, error)
      throw new Error(`Failed to initialize ${this.name}: ${error}`)
    }
  }

  /**
   * Set the local Brainy instance
   * @param db The Brainy instance to use for local storage
   */
  setLocalDb(db: BrainyDataInterface): void {
    this.localDb = db
  }

  /**
   * Get the local Brainy instance
   * @returns The local Brainy instance
   */
  getLocalDb(): BrainyDataInterface | null {
    return this.localDb
  }

  /**
   * Search the server-hosted Brainy instance and store results locally
   * @param connectionId The ID of the established connection
   * @param query The search query
   * @param limit Maximum number of results to return
   * @returns Search results
   */
  async searchServer(
    connectionId: string,
    query: string,
    limit: number = 10
  ): Promise<AugmentationResponse<unknown>> {
    await this.ensureInitialized()

    try {
      // Create a search request
      const readResult = await this.readData({
        connectionId,
        query: {
          type: 'search',
          query,
          limit
        }
      })

      if (readResult.success && readResult.data) {
        const searchResults = readResult.data as any[]

        // Store the results in the local Brainy instance
        if (this.localDb) {
          for (const result of searchResults) {
            // Check if the noun already exists in the local database
            const existingNoun = await this.localDb.get(result.id)

            if (!existingNoun) {
              // Add the noun to the local database
              await this.localDb.add(result.vector, result.metadata)
            }
          }
        }

        return {
          success: true,
          data: searchResults
        }
      } else {
        return {
          success: false,
          data: null,
          error: readResult.error || 'Unknown error searching server'
        }
      }
    } catch (error) {
      console.error('Error searching server:', error)
      return {
        success: false,
        data: null,
        error: `Error searching server: ${error}`
      }
    }
  }

  /**
   * Search the local Brainy instance
   * @param query The search query
   * @param limit Maximum number of results to return
   * @returns Search results
   */
  async searchLocal(
    query: string,
    limit: number = 10
  ): Promise<AugmentationResponse<unknown>> {
    await this.ensureInitialized()

    try {
      if (!this.localDb) {
        return {
          success: false,
          data: null,
          error: 'Local database not initialized'
        }
      }

      const results = await this.localDb.searchText(query, limit)

      return {
        success: true,
        data: results
      }
    } catch (error) {
      console.error('Error searching local database:', error)
      return {
        success: false,
        data: null,
        error: `Error searching local database: ${error}`
      }
    }
  }

  /**
   * Search both server and local instances, combine results, and store server results locally
   * @param connectionId The ID of the established connection
   * @param query The search query
   * @param limit Maximum number of results to return
   * @returns Combined search results
   */
  async searchCombined(
    connectionId: string,
    query: string,
    limit: number = 10
  ): Promise<AugmentationResponse<unknown>> {
    await this.ensureInitialized()

    try {
      // Search local first
      const localSearchResult = await this.searchLocal(query, limit)

      if (!localSearchResult.success) {
        return localSearchResult
      }

      const localResults = localSearchResult.data as any[]

      // If we have enough local results, return them
      if (localResults.length >= limit) {
        return localSearchResult
      }

      // Otherwise, search server for additional results
      const serverSearchResult = await this.searchServer(
        connectionId,
        query,
        limit - localResults.length
      )

      if (!serverSearchResult.success) {
        // If server search fails, return local results
        return localSearchResult
      }

      const serverResults = serverSearchResult.data as any[]

      // Combine results, removing duplicates
      const combinedResults = [...localResults]
      const localIds = new Set(localResults.map((r) => r.id))

      for (const result of serverResults) {
        if (!localIds.has(result.id)) {
          combinedResults.push(result)
        }
      }

      return {
        success: true,
        data: combinedResults
      }
    } catch (error) {
      console.error('Error performing combined search:', error)
      return {
        success: false,
        data: null,
        error: `Error performing combined search: ${error}`
      }
    }
  }

  /**
   * Add data to both local and server instances
   * @param connectionId The ID of the established connection
   * @param data Text or vector to add
   * @param metadata Metadata for the data
   * @returns ID of the added data
   */
  async addToBoth(
    connectionId: string,
    data: string | any[],
    metadata: any = {}
  ): Promise<AugmentationResponse<string>> {
    await this.ensureInitialized()

    try {
      if (!this.localDb) {
        return {
          success: false,
          data: '',
          error: 'Local database not initialized'
        }
      }

      // Add to local first
      const id = await this.localDb.add(data, metadata)

      // Get the vector and metadata
      const noun = (await this.localDb.get(
        id
      )) as import('../coreTypes.js').VectorDocument<unknown>

      if (!noun) {
        return {
          success: false,
          data: '',
          error: 'Failed to retrieve newly created noun'
        }
      }

      // Add to server
      const writeResult = await this.writeData({
        connectionId,
        data: {
          type: 'addNoun',
          vector: noun.vector,
          metadata: noun.metadata
        }
      })

      if (!writeResult.success) {
        return {
          success: true,
          data: id,
          error: `Added locally but failed to add to server: ${writeResult.error}`
        }
      }

      return {
        success: true,
        data: id
      }
    } catch (error) {
      console.error('Error adding data to both:', error)
      return {
        success: false,
        data: '',
        error: `Error adding data to both: ${error}`
      }
    }
  }
}

/**
 * ServerSearchActivationAugmentation
 *
 * An activation augmentation that provides actions for server search functionality.
 */
export class ServerSearchActivationAugmentation
  implements IActivationAugmentation
{
  readonly name: string
  readonly description: string
  enabled: boolean = true
  private isInitialized = false
  private conduitAugmentation: ServerSearchConduitAugmentation | null = null
  private connections: Map<string, WebSocketConnection> = new Map()

  constructor(name: string = 'server-search-activation') {
    this.name = name
    this.description = 'Activation augmentation for server-hosted Brainy search'
  }

  getType(): AugmentationType {
    return AugmentationType.ACTIVATION
  }

  /**
   * Initialize the augmentation
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    this.isInitialized = true
  }

  /**
   * Shut down the augmentation
   */
  async shutDown(): Promise<void> {
    this.isInitialized = false
  }

  /**
   * Get the status of the augmentation
   */
  async getStatus(): Promise<'active' | 'inactive' | 'error'> {
    return this.isInitialized ? 'active' : 'inactive'
  }

  /**
   * Set the conduit augmentation to use for server search
   * @param conduit The ServerSearchConduitAugmentation to use
   */
  setConduitAugmentation(conduit: ServerSearchConduitAugmentation): void {
    this.conduitAugmentation = conduit
  }

  /**
   * Store a connection for later use
   * @param connectionId The ID to use for the connection
   * @param connection The WebSocket connection
   */
  storeConnection(connectionId: string, connection: WebSocketConnection): void {
    this.connections.set(connectionId, connection)
  }

  /**
   * Get a stored connection
   * @param connectionId The ID of the connection to retrieve
   * @returns The WebSocket connection
   */
  getConnection(connectionId: string): WebSocketConnection | undefined {
    return this.connections.get(connectionId)
  }

  /**
   * Trigger an action based on a processed command or internal state
   * @param actionName The name of the action to trigger
   * @param parameters Optional parameters for the action
   */
  triggerAction(
    actionName: string,
    parameters?: Record<string, unknown>
  ): AugmentationResponse<unknown> {
    if (!this.conduitAugmentation) {
      return {
        success: false,
        data: null,
        error: 'Conduit augmentation not set'
      }
    }

    // Handle different actions
    switch (actionName) {
      case 'connectToServer':
        return this.handleConnectToServer(parameters || {})
      case 'searchServer':
        return this.handleSearchServer(parameters || {})
      case 'searchLocal':
        return this.handleSearchLocal(parameters || {})
      case 'searchCombined':
        return this.handleSearchCombined(parameters || {})
      case 'addToBoth':
        return this.handleAddToBoth(parameters || {})
      default:
        return {
          success: false,
          data: null,
          error: `Unknown action: ${actionName}`
        }
    }
  }

  /**
   * Handle the connectToServer action
   * @param parameters Action parameters
   */
  private handleConnectToServer(
    parameters: Record<string, unknown>
  ): AugmentationResponse<unknown> {
    const serverUrl = parameters.serverUrl as string
    const protocols = parameters.protocols as string | string[] | undefined

    if (!serverUrl) {
      return {
        success: false,
        data: null,
        error: 'serverUrl parameter is required'
      }
    }

    // Return a promise that will be resolved when the connection is established
    return {
      success: true,
      data: this.conduitAugmentation!.establishConnection(serverUrl, {
        protocols
      })
    }
  }

  /**
   * Handle the searchServer action
   * @param parameters Action parameters
   */
  private handleSearchServer(
    parameters: Record<string, unknown>
  ): AugmentationResponse<unknown> {
    const connectionId = parameters.connectionId as string
    const query = parameters.query as string
    const limit = (parameters.limit as number) || 10

    if (!connectionId) {
      return {
        success: false,
        data: null,
        error: 'connectionId parameter is required'
      }
    }

    if (!query) {
      return {
        success: false,
        data: null,
        error: 'query parameter is required'
      }
    }

    // Return a promise that will be resolved when the search is complete
    return {
      success: true,
      data: this.conduitAugmentation!.searchServer(connectionId, query, limit)
    }
  }

  /**
   * Handle the searchLocal action
   * @param parameters Action parameters
   */
  private handleSearchLocal(
    parameters: Record<string, unknown>
  ): AugmentationResponse<unknown> {
    const query = parameters.query as string
    const limit = (parameters.limit as number) || 10

    if (!query) {
      return {
        success: false,
        data: null,
        error: 'query parameter is required'
      }
    }

    // Return a promise that will be resolved when the search is complete
    return {
      success: true,
      data: this.conduitAugmentation!.searchLocal(query, limit)
    }
  }

  /**
   * Handle the searchCombined action
   * @param parameters Action parameters
   */
  private handleSearchCombined(
    parameters: Record<string, unknown>
  ): AugmentationResponse<unknown> {
    const connectionId = parameters.connectionId as string
    const query = parameters.query as string
    const limit = (parameters.limit as number) || 10

    if (!connectionId) {
      return {
        success: false,
        data: null,
        error: 'connectionId parameter is required'
      }
    }

    if (!query) {
      return {
        success: false,
        data: null,
        error: 'query parameter is required'
      }
    }

    // Return a promise that will be resolved when the search is complete
    return {
      success: true,
      data: this.conduitAugmentation!.searchCombined(connectionId, query, limit)
    }
  }

  /**
   * Handle the addToBoth action
   * @param parameters Action parameters
   */
  private handleAddToBoth(
    parameters: Record<string, unknown>
  ): AugmentationResponse<unknown> {
    const connectionId = parameters.connectionId as string
    const data = parameters.data
    const metadata = parameters.metadata || {}

    if (!connectionId) {
      return {
        success: false,
        data: null,
        error: 'connectionId parameter is required'
      }
    }

    if (!data) {
      return {
        success: false,
        data: null,
        error: 'data parameter is required'
      }
    }

    // Return a promise that will be resolved when the add is complete
    return {
      success: true,
      data: this.conduitAugmentation!.addToBoth(
        connectionId,
        data as any,
        metadata as any
      )
    }
  }

  /**
   * Generates an expressive output or response from Brainy
   * @param knowledgeId The identifier of the knowledge to express
   * @param format The desired output format (e.g., 'text', 'json')
   */
  generateOutput(
    knowledgeId: string,
    format: string
  ): AugmentationResponse<string | Record<string, unknown>> {
    // This method is not used for server search functionality
    return {
      success: false,
      data: '',
      error:
        'generateOutput is not implemented for ServerSearchActivationAugmentation'
    }
  }

  /**
   * Interacts with an external system or API
   * @param systemId The identifier of the external system
   * @param payload The data to send to the external system
   */
  interactExternal(
    systemId: string,
    payload: Record<string, unknown>
  ): AugmentationResponse<unknown> {
    // This method is not used for server search functionality
    return {
      success: false,
      data: null,
      error:
        'interactExternal is not implemented for ServerSearchActivationAugmentation'
    }
  }
}

/**
 * Factory function to create server search augmentations
 * @param serverUrl The URL of the server to connect to
 * @param options Additional options
 * @returns An object containing the created augmentations
 */
export async function createServerSearchAugmentations(
  serverUrl: string,
  options: {
    conduitName?: string
    activationName?: string
    protocols?: string | string[]
    localDb?: BrainyDataInterface
  } = {}
): Promise<{
  conduit: ServerSearchConduitAugmentation
  activation: ServerSearchActivationAugmentation
  connection: WebSocketConnection
}> {
  // Create the conduit augmentation
  const conduit = new ServerSearchConduitAugmentation(options.conduitName)
  await conduit.initialize()

  // Set the local database if provided
  if (options.localDb) {
    conduit.setLocalDb(options.localDb)
  }

  // Create the activation augmentation
  const activation = new ServerSearchActivationAugmentation(
    options.activationName
  )
  await activation.initialize()

  // Link the augmentations
  activation.setConduitAugmentation(conduit)

  // Connect to the server
  const connectionResult = await conduit.establishConnection(serverUrl, {
    protocols: options.protocols
  })

  if (!connectionResult.success || !connectionResult.data) {
    throw new Error(`Failed to connect to server: ${connectionResult.error}`)
  }

  const connection = connectionResult.data

  // Store the connection in the activation augmentation
  activation.storeConnection(connection.connectionId, connection)

  return {
    conduit,
    activation,
    connection
  }
}
