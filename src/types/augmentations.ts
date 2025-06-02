/** Common types for the augmentation system */

/**
 * Enum representing all types of augmentations available in the Brainy system.
 */
export enum AugmentationType {
  SENSE = 'sense',
  CONDUIT = 'conduit',
  COGNITION = 'cognition',
  MEMORY = 'memory',
  PERCEPTION = 'perception',
  DIALOG = 'dialog',
  ACTIVATION = 'activation',
  WEBSOCKET = 'webSocket'
}

export type WebSocketConnection = {
  connectionId: string
  url: string
  status: 'connected' | 'disconnected' | 'error'
}

type DataCallback<T> = (data: T) => void
export type AugmentationResponse<T> = {
  success: boolean
  data: T
  error?: string
}

/**
 * Base interface for all Brainy augmentations.
 * All augmentations must implement these core properties.
 */
export interface IAugmentation {
  /** A unique identifier for the augmentation (e.g., "my-reasoner-v1") */
  readonly name: string
  /** A human-readable description of the augmentation's purpose */
  readonly description: string
  /** Whether this augmentation is enabled */
  enabled: boolean

  /**
   * Initializes the augmentation. This method is called when Brainy starts up.
   * @returns A Promise that resolves when initialization is complete
   */
  initialize(): Promise<void>

  shutDown(): Promise<void>

  getStatus(): Promise<'active' | 'inactive' | 'error'>
}

/**
 * Interface for WebSocket support.
 * Augmentations that implement this interface can communicate via WebSockets.
 */
export interface IWebSocketSupport extends IAugmentation {
  /**
   * Establishes a WebSocket connection.
   * @param url The WebSocket server URL to connect to
   * @param protocols Optional subprotocols
   * @returns A Promise resolving to a connection handle or status
   */
  connectWebSocket(url: string, protocols?: string | string[]): Promise<WebSocketConnection>

  /**
   * Sends data through an established WebSocket connection.
   * @param connectionId The identifier of the established connection
   * @param data The data to send (will be serialized if not a string)
   */
  sendWebSocketMessage(connectionId: string, data: unknown): Promise<void>

  /**
   * Registers a callback for incoming WebSocket messages.
   * @param connectionId The identifier of the established connection
   * @param callback The function to call when a message is received
   */
  onWebSocketMessage(connectionId: string, callback: DataCallback<unknown>): Promise<void>

  /**
   * Closes an established WebSocket connection.
   * @param connectionId The identifier of the established connection
   * @param code Optional close code
   * @param reason Optional close reason
   */
  closeWebSocket(connectionId: string, code?: number, reason?: string): Promise<void>
}

export namespace BrainyAugmentations {
  /**
   * Interface for Senses augmentations.
   * These augmentations ingest and process raw, unstructured data into nouns and verbs.
   */
  export interface ISenseAugmentation extends IAugmentation {
    /**
     * Processes raw input data into structured nouns and verbs.
     * @param rawData The raw, unstructured data (e.g., text, image buffer, audio stream)
     * @param dataType The type of raw data (e.g., 'text', 'image', 'audio')
     */
    processRawData(rawData: Buffer | string, dataType: string): AugmentationResponse<{
      nouns: string[]
      verbs: string[]
    }>

    /**
     * Registers a listener for real-time data feeds.
     * @param feedUrl The URL or identifier of the real-time feed
     * @param callback A function to call with processed data
     */
    listenToFeed(
      feedUrl: string,
      callback: DataCallback<{ nouns: string[]; verbs: string[] }>
    ): Promise<void>
  }

  /**
   * Interface for Conduits augmentations.
   * These augmentations establish and manage high-bandwidth, dedicated channels for structured, programmatic two-way data exchange.
   */
  export interface IConduitAugmentation extends IAugmentation {
    /**
     * Establishes a connection for programmatic data exchange.
     * @param targetSystemId The identifier of the external system to connect to
     * @param config Configuration details for the connection (e.g., API keys, endpoints)
     */
    establishConnection(
      targetSystemId: string,
      config: Record<string, unknown>
    ): AugmentationResponse<WebSocketConnection>

    /**
     * Reads structured data directly from Brainy's knowledge graph.
     * @param query A structured query (e.g., graph query language, object path)
     * @param options Optional query options (e.g., depth, filters)
     */
    readData(
      query: Record<string, unknown>,
      options?: Record<string, unknown>
    ): AugmentationResponse<unknown>

    /**
     * Writes or updates structured data directly into Brainy's knowledge graph.
     * @param data The structured data to write/update
     * @param options Optional write options (e.g., merge, overwrite)
     */
    writeData(
      data: Record<string, unknown>,
      options?: Record<string, unknown>
    ): AugmentationResponse<unknown>

    /**
     * Monitors a specific data stream or event within Brainy for external systems.
     * @param streamId The identifier of the data stream or event
     * @param callback A function to call when new data/events occur
     */
    monitorStream(streamId: string, callback: DataCallback<unknown>): Promise<void>
  }

  /**
   * Interface for Cognitions augmentations.
   * These augmentations enable advanced reasoning, inference, and logical operations.
   */
  export interface ICognitionAugmentation extends IAugmentation {
    /**
     * Performs a reasoning operation based on current knowledge.
     * @param query The specific reasoning task or question
     * @param context Optional additional context for the reasoning
     */
    reason(query: string, context?: Record<string, unknown>): AugmentationResponse<{
      inference: string
      confidence: number
    }>

    /**
     * Infers relationships or new facts from existing data.
     * @param dataSubset A subset of data to infer from
     */
    infer(dataSubset: Record<string, unknown>): AugmentationResponse<Record<string, unknown>>

    /**
     * Executes a logical operation or rule set.
     * @param ruleId The identifier of the rule or logic to apply
     * @param input Data to apply the logic to
     */
    executeLogic(ruleId: string, input: Record<string, unknown>): AugmentationResponse<boolean>
  }

  /**
   * Interface for Memory augmentations.
   * These augmentations provide storage capabilities for data in different formats (e.g., fileSystem, in-memory, or firestore).
   */
  export interface IMemoryAugmentation extends IAugmentation {
    /**
     * Stores data in the memory system.
     * @param key The unique identifier for the data
     * @param data The data to store
     * @param options Optional storage options (e.g., expiration, format)
     */
    storeData(
      key: string,
      data: unknown,
      options?: Record<string, unknown>
    ): Promise<AugmentationResponse<boolean>>

    /**
     * Retrieves data from the memory system.
     * @param key The unique identifier for the data
     * @param options Optional retrieval options (e.g., format, version)
     */
    retrieveData(
      key: string,
      options?: Record<string, unknown>
    ): Promise<AugmentationResponse<unknown>>

    /**
     * Updates existing data in the memory system.
     * @param key The unique identifier for the data
     * @param data The updated data
     * @param options Optional update options (e.g., merge, overwrite)
     */
    updateData(
      key: string,
      data: unknown,
      options?: Record<string, unknown>
    ): Promise<AugmentationResponse<boolean>>

    /**
     * Deletes data from the memory system.
     * @param key The unique identifier for the data
     * @param options Optional deletion options
     */
    deleteData(
      key: string,
      options?: Record<string, unknown>
    ): Promise<AugmentationResponse<boolean>>

    /**
     * Lists available data keys in the memory system.
     * @param pattern Optional pattern to filter keys (e.g., prefix, regex)
     * @param options Optional listing options (e.g., limit, offset)
     */
    listDataKeys(
      pattern?: string,
      options?: Record<string, unknown>
    ): Promise<AugmentationResponse<string[]>>

    /**
     * Searches for data in the memory system using vector similarity.
     * @param query The query vector or data to search for
     * @param k Number of results to return
     * @param options Optional search options
     */
    search(
      query: unknown,
      k?: number,
      options?: Record<string, unknown>
    ): Promise<AugmentationResponse<Array<{
      id: string;
      score: number;
      data: unknown;
    }>>>
  }

  /**
   * Interface for Perceptions augmentations.
   * These augmentations interpret, contextualize, and visualize identified nouns and verbs.
   */
  export interface IPerceptionAugmentation extends IAugmentation {
    /**
     * Interprets and contextualizes processed nouns and verbs.
     * @param nouns The list of identified nouns
     * @param verbs The list of identified verbs
     * @param context Optional additional context for interpretation
     */
    interpret(
      nouns: string[],
      verbs: string[],
      context?: Record<string, unknown>
    ): AugmentationResponse<Record<string, unknown>>

    /**
     * Organizes and filters information.
     * @param data The data to organize (e.g., interpreted perceptions)
     * @param criteria Optional criteria for filtering/prioritization
     */
    organize(
      data: Record<string, unknown>,
      criteria?: Record<string, unknown>
    ): AugmentationResponse<Record<string, unknown>>

    /**
     * Generates a visualization based on the provided data.
     * @param data The data to visualize (e.g., interpreted patterns)
     * @param visualizationType The desired type of visualization (e.g., 'graph', 'chart')
     */
    generateVisualization(
      data: Record<string, unknown>,
      visualizationType: string
    ): AugmentationResponse<string | Buffer | Record<string, unknown>>
  }

  /**
   * Interface for Dialogs augmentations.
   * These augmentations facilitate natural language understanding and generation for conversational interaction.
   */
  export interface IDialogAugmentation extends IAugmentation {
    /**
     * Processes a user's natural language input (query).
     * @param naturalLanguageQuery The raw text query from the user
     * @param sessionId An optional session ID for conversational context
     */
    processUserInput(naturalLanguageQuery: string, sessionId?: string): AugmentationResponse<{
      intent: string
      nouns: string[]
      verbs: string[]
      context: Record<string, unknown>
    }>

    /**
     * Generates a natural language response based on Brainy's knowledge and interpreted input.
     * @param interpretedInput The output from `processUserInput` or similar
     * @param knowledgeContext Relevant knowledge retrieved from Brainy
     * @param sessionId An optional session ID for conversational context
     */
    generateResponse(
      interpretedInput: Record<string, unknown>,
      knowledgeContext: Record<string, unknown>,
      sessionId?: string
    ): AugmentationResponse<string>

    /**
     * Manages and updates conversational context.
     * @param sessionId The session ID
     * @param contextUpdate The data to update the context with
     */
    manageContext(sessionId: string, contextUpdate: Record<string, unknown>): Promise<void>
  }

  /**
   * Interface for Activations augmentations.
   * These augmentations dictate how Brainy initiates actions, responses, or data manipulations.
   */
  export interface IActivationAugmentation extends IAugmentation {
    /**
     * Triggers an action based on a processed command or internal state.
     * @param actionName The name of the action to trigger
     * @param parameters Optional parameters for the action
     */
    triggerAction(
      actionName: string,
      parameters?: Record<string, unknown>
    ): AugmentationResponse<unknown>

    /**
     * Generates an expressive output or response from Brainy.
     * @param knowledgeId The identifier of the knowledge to express
     * @param format The desired output format (e.g., 'text', 'json')
     */
    generateOutput(knowledgeId: string, format: string): AugmentationResponse<string | Record<string, unknown>>

    /**
     * Interacts with an external system or API.
     * @param systemId The identifier of the external system
     * @param payload The data to send to the external system
     */
    interactExternal(systemId: string, payload: Record<string, unknown>): AugmentationResponse<unknown>
  }
}

/** Direct exports of augmentation interfaces for easier imports */
export interface ISenseAugmentation extends BrainyAugmentations.ISenseAugmentation {
}

export interface IConduitAugmentation extends BrainyAugmentations.IConduitAugmentation {
}

export interface ICognitionAugmentation extends BrainyAugmentations.ICognitionAugmentation {
}

export interface IMemoryAugmentation extends BrainyAugmentations.IMemoryAugmentation {
}

export interface IPerceptionAugmentation extends BrainyAugmentations.IPerceptionAugmentation {
}

export interface IDialogAugmentation extends BrainyAugmentations.IDialogAugmentation {
}

export interface IActivationAugmentation extends BrainyAugmentations.IActivationAugmentation {
}

/** WebSocket-enabled augmentation interfaces */
export type IWebSocketSenseAugmentation = BrainyAugmentations.ISenseAugmentation & IWebSocketSupport
export type IWebSocketConduitAugmentation = BrainyAugmentations.IConduitAugmentation & IWebSocketSupport
export type IWebSocketCognitionAugmentation = BrainyAugmentations.ICognitionAugmentation & IWebSocketSupport
export type IWebSocketMemoryAugmentation = BrainyAugmentations.IMemoryAugmentation & IWebSocketSupport
export type IWebSocketPerceptionAugmentation = BrainyAugmentations.IPerceptionAugmentation & IWebSocketSupport
export type IWebSocketDialogAugmentation = BrainyAugmentations.IDialogAugmentation & IWebSocketSupport
export type IWebSocketActivationAugmentation = BrainyAugmentations.IActivationAugmentation & IWebSocketSupport
