/**
 * Memory Augmentation Example
 * 
 * This example demonstrates how to create and register memory augmentations
 * for storing data in different formats (e.g., fileSystem, in memory, or firestore).
 */

import {
  augmentationPipeline,
  IAugmentation,
  IWebSocketSupport,
  IWebSocketMemoryAugmentation,
  AugmentationResponse,
  BrainyAugmentations,
  ExecutionMode
} from '../index.js'

/**
 * Example In-Memory Augmentation
 * 
 * This augmentation stores data in memory using a JavaScript Map.
 */
class InMemoryAugmentation implements BrainyAugmentations.IMemoryAugmentation {
  readonly name = 'in-memory-storage'
  readonly description = 'A simple in-memory storage augmentation'
  
  private storage: Map<string, unknown> = new Map()

  async initialize(): Promise<void> {
    console.log('Initializing InMemoryAugmentation')
  }

  async shutDown(): Promise<void> {
    console.log('Shutting down InMemoryAugmentation')
    this.storage.clear()
  }

  async getStatus(): Promise<'active' | 'inactive' | 'error'> {
    return 'active'
  }

  async storeData(
    key: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    console.log(`Storing data with key: ${key}`)
    try {
      this.storage.set(key, data)
      return {
        success: true,
        data: true
      }
    } catch (error) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async retrieveData(
    key: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<unknown>> {
    console.log(`Retrieving data with key: ${key}`)
    try {
      if (!this.storage.has(key)) {
        return {
          success: false,
          data: null,
          error: `Key not found: ${key}`
        }
      }
      
      return {
        success: true,
        data: this.storage.get(key)
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async updateData(
    key: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    console.log(`Updating data with key: ${key}`)
    try {
      if (!this.storage.has(key)) {
        return {
          success: false,
          data: false,
          error: `Key not found: ${key}`
        }
      }
      
      this.storage.set(key, data)
      return {
        success: true,
        data: true
      }
    } catch (error) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async deleteData(
    key: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    console.log(`Deleting data with key: ${key}`)
    try {
      if (!this.storage.has(key)) {
        return {
          success: false,
          data: false,
          error: `Key not found: ${key}`
        }
      }
      
      this.storage.delete(key)
      return {
        success: true,
        data: true
      }
    } catch (error) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async listDataKeys(
    pattern?: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<string[]>> {
    console.log(`Listing data keys with pattern: ${pattern || 'all'}`)
    try {
      const keys = Array.from(this.storage.keys())
      
      // Filter keys by pattern if provided
      const filteredKeys = pattern 
        ? keys.filter(key => key.includes(pattern))
        : keys
      
      return {
        success: true,
        data: filteredKeys
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

/**
 * Example File System Memory Augmentation
 * 
 * This augmentation simulates storing data in the file system.
 */
class FileSystemMemoryAugmentation implements BrainyAugmentations.IMemoryAugmentation {
  readonly name = 'file-system-storage'
  readonly description = 'A file system storage augmentation'
  
  private storage: Map<string, unknown> = new Map()

  async initialize(): Promise<void> {
    console.log('Initializing FileSystemMemoryAugmentation')
    console.log('Simulating file system initialization...')
  }

  async shutDown(): Promise<void> {
    console.log('Shutting down FileSystemMemoryAugmentation')
    console.log('Simulating file system cleanup...')
    this.storage.clear()
  }

  async getStatus(): Promise<'active' | 'inactive' | 'error'> {
    return 'active'
  }

  async storeData(
    key: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    console.log(`Storing data in file system with key: ${key}`)
    try {
      // Simulate file system operations
      console.log(`Writing to file: ${key}.json`)
      this.storage.set(key, data)
      return {
        success: true,
        data: true
      }
    } catch (error) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async retrieveData(
    key: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<unknown>> {
    console.log(`Retrieving data from file system with key: ${key}`)
    try {
      if (!this.storage.has(key)) {
        return {
          success: false,
          data: null,
          error: `File not found: ${key}.json`
        }
      }
      
      // Simulate file system operations
      console.log(`Reading from file: ${key}.json`)
      return {
        success: true,
        data: this.storage.get(key)
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async updateData(
    key: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    console.log(`Updating data in file system with key: ${key}`)
    try {
      if (!this.storage.has(key)) {
        return {
          success: false,
          data: false,
          error: `File not found: ${key}.json`
        }
      }
      
      // Simulate file system operations
      console.log(`Updating file: ${key}.json`)
      this.storage.set(key, data)
      return {
        success: true,
        data: true
      }
    } catch (error) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async deleteData(
    key: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    console.log(`Deleting data from file system with key: ${key}`)
    try {
      if (!this.storage.has(key)) {
        return {
          success: false,
          data: false,
          error: `File not found: ${key}.json`
        }
      }
      
      // Simulate file system operations
      console.log(`Deleting file: ${key}.json`)
      this.storage.delete(key)
      return {
        success: true,
        data: true
      }
    } catch (error) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async listDataKeys(
    pattern?: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<string[]>> {
    console.log(`Listing data keys from file system with pattern: ${pattern || 'all'}`)
    try {
      // Simulate file system operations
      console.log('Reading directory contents...')
      const keys = Array.from(this.storage.keys())
      
      // Filter keys by pattern if provided
      const filteredKeys = pattern 
        ? keys.filter(key => key.includes(pattern))
        : keys
      
      return {
        success: true,
        data: filteredKeys
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

/**
 * Example Combined WebSocket and Memory Augmentation
 * 
 * This augmentation implements both WebSocket and Memory interfaces.
 */
class WebSocketMemoryAugmentation implements IWebSocketMemoryAugmentation {
  readonly name = 'websocket-memory-storage'
  readonly description = 'A combined WebSocket and Memory storage augmentation'
  
  private storage: Map<string, unknown> = new Map()
  private connections: Map<string, { url: string, status: 'connected' | 'disconnected' | 'error' }> = new Map()

  async initialize(): Promise<void> {
    console.log('Initializing WebSocketMemoryAugmentation')
  }

  async shutDown(): Promise<void> {
    console.log('Shutting down WebSocketMemoryAugmentation')
    this.storage.clear()
    this.connections.clear()
  }

  async getStatus(): Promise<'active' | 'inactive' | 'error'> {
    return 'active'
  }

  // WebSocket methods
  async connectWebSocket(url: string, protocols?: string | string[]): Promise<{ 
    connectionId: string; 
    url: string; 
    status: 'connected' | 'disconnected' | 'error' 
  }> {
    console.log(`WebSocketMemory connecting to WebSocket at ${url}`)
    const connectionId = `ws-memory-${Date.now()}`
    this.connections.set(connectionId, { url, status: 'connected' })
    return {
      connectionId,
      url,
      status: 'connected'
    }
  }

  async sendWebSocketMessage(connectionId: string, data: unknown): Promise<void> {
    console.log(`WebSocketMemory sending message to WebSocket ${connectionId}:`, data)
    if (!this.connections.has(connectionId)) {
      throw new Error(`Connection not found: ${connectionId}`)
    }
  }

  async onWebSocketMessage(connectionId: string, callback: (data: unknown) => void): Promise<void> {
    console.log(`WebSocketMemory registering callback for WebSocket ${connectionId}`)
    if (!this.connections.has(connectionId)) {
      throw new Error(`Connection not found: ${connectionId}`)
    }
  }

  async closeWebSocket(connectionId: string, code?: number, reason?: string): Promise<void> {
    console.log(`WebSocketMemory closing WebSocket ${connectionId}`)
    if (!this.connections.has(connectionId)) {
      throw new Error(`Connection not found: ${connectionId}`)
    }
    this.connections.delete(connectionId)
  }

  // Memory methods
  async storeData(
    key: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    console.log(`WebSocketMemory storing data with key: ${key}`)
    try {
      this.storage.set(key, data)
      
      // If a WebSocket connection is specified in options, send the data through it
      const connectionId = options?.connectionId as string
      if (connectionId && this.connections.has(connectionId)) {
        await this.sendWebSocketMessage(connectionId, { 
          action: 'store', 
          key, 
          data 
        })
      }
      
      return {
        success: true,
        data: true
      }
    } catch (error) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async retrieveData(
    key: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<unknown>> {
    console.log(`WebSocketMemory retrieving data with key: ${key}`)
    try {
      if (!this.storage.has(key)) {
        return {
          success: false,
          data: null,
          error: `Key not found: ${key}`
        }
      }
      
      const data = this.storage.get(key)
      
      // If a WebSocket connection is specified in options, send the request through it
      const connectionId = options?.connectionId as string
      if (connectionId && this.connections.has(connectionId)) {
        await this.sendWebSocketMessage(connectionId, { 
          action: 'retrieve', 
          key 
        })
      }
      
      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async updateData(
    key: string,
    data: unknown,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    console.log(`WebSocketMemory updating data with key: ${key}`)
    try {
      if (!this.storage.has(key)) {
        return {
          success: false,
          data: false,
          error: `Key not found: ${key}`
        }
      }
      
      this.storage.set(key, data)
      
      // If a WebSocket connection is specified in options, send the update through it
      const connectionId = options?.connectionId as string
      if (connectionId && this.connections.has(connectionId)) {
        await this.sendWebSocketMessage(connectionId, { 
          action: 'update', 
          key, 
          data 
        })
      }
      
      return {
        success: true,
        data: true
      }
    } catch (error) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async deleteData(
    key: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    console.log(`WebSocketMemory deleting data with key: ${key}`)
    try {
      if (!this.storage.has(key)) {
        return {
          success: false,
          data: false,
          error: `Key not found: ${key}`
        }
      }
      
      this.storage.delete(key)
      
      // If a WebSocket connection is specified in options, send the delete request through it
      const connectionId = options?.connectionId as string
      if (connectionId && this.connections.has(connectionId)) {
        await this.sendWebSocketMessage(connectionId, { 
          action: 'delete', 
          key 
        })
      }
      
      return {
        success: true,
        data: true
      }
    } catch (error) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  async listDataKeys(
    pattern?: string,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<string[]>> {
    console.log(`WebSocketMemory listing data keys with pattern: ${pattern || 'all'}`)
    try {
      const keys = Array.from(this.storage.keys())
      
      // Filter keys by pattern if provided
      const filteredKeys = pattern 
        ? keys.filter(key => key.includes(pattern))
        : keys
      
      // If a WebSocket connection is specified in options, send the list request through it
      const connectionId = options?.connectionId as string
      if (connectionId && this.connections.has(connectionId)) {
        await this.sendWebSocketMessage(connectionId, { 
          action: 'list', 
          pattern 
        })
      }
      
      return {
        success: true,
        data: filteredKeys
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

/**
 * Main function to demonstrate the memory augmentation
 */
async function main() {
  try {
    console.log('=== Memory Augmentation Example ===')

    // Create augmentation instances
    const inMemoryStorage = new InMemoryAugmentation()
    const fileSystemStorage = new FileSystemMemoryAugmentation()
    const webSocketMemory = new WebSocketMemoryAugmentation()

    // Register augmentations with the pipeline
    augmentationPipeline
      .register(inMemoryStorage)
      .register(fileSystemStorage)
      .register(webSocketMemory)

    // Initialize all registered augmentations
    console.log('\n=== Initializing Augmentations ===')
    await augmentationPipeline.initialize()

    // Store data in all memory augmentations
    console.log('\n=== Storing Data ===')
    const storeResults = await augmentationPipeline.executeMemoryPipeline(
      'storeData',
      ['user123', { name: 'John Doe', email: 'john@example.com' }]
    )

    console.log('\nStore Results:')
    storeResults.forEach((result, index) => {
      console.log(`Result ${index + 1}:`)
      console.log(`  Success: ${result.success}`)
      if (!result.success) {
        console.log(`  Error: ${result.error}`)
      }
    })

    // Retrieve data from all memory augmentations
    console.log('\n=== Retrieving Data ===')
    const retrieveResults = await augmentationPipeline.executeMemoryPipeline(
      'retrieveData',
      ['user123']
    )

    console.log('\nRetrieve Results:')
    retrieveResults.forEach((result, index) => {
      console.log(`Result ${index + 1}:`)
      console.log(`  Success: ${result.success}`)
      if (result.success) {
        console.log(`  Data: ${JSON.stringify(result.data)}`)
      } else {
        console.log(`  Error: ${result.error}`)
      }
    })

    // Update data in all memory augmentations
    console.log('\n=== Updating Data ===')
    const updateResults = await augmentationPipeline.executeMemoryPipeline(
      'updateData',
      ['user123', { name: 'John Doe', email: 'john.updated@example.com' }]
    )

    console.log('\nUpdate Results:')
    updateResults.forEach((result, index) => {
      console.log(`Result ${index + 1}:`)
      console.log(`  Success: ${result.success}`)
      if (!result.success) {
        console.log(`  Error: ${result.error}`)
      }
    })

    // Retrieve updated data from all memory augmentations
    console.log('\n=== Retrieving Updated Data ===')
    const retrieveUpdatedResults = await augmentationPipeline.executeMemoryPipeline(
      'retrieveData',
      ['user123']
    )

    console.log('\nRetrieve Updated Results:')
    retrieveUpdatedResults.forEach((result, index) => {
      console.log(`Result ${index + 1}:`)
      console.log(`  Success: ${result.success}`)
      if (result.success) {
        console.log(`  Data: ${JSON.stringify(result.data)}`)
      } else {
        console.log(`  Error: ${result.error}`)
      }
    })

    // Store additional data
    console.log('\n=== Storing Additional Data ===')
    await augmentationPipeline.executeMemoryPipeline(
      'storeData',
      ['user456', { name: 'Jane Smith', email: 'jane@example.com' }]
    )

    // List all keys
    console.log('\n=== Listing All Keys ===')
    const listResults = await augmentationPipeline.executeMemoryPipeline(
      'listDataKeys',
      []
    )

    console.log('\nList Results:')
    listResults.forEach((result, index) => {
      console.log(`Result ${index + 1}:`)
      console.log(`  Success: ${result.success}`)
      if (result.success) {
        console.log(`  Keys: ${result.data.join(', ')}`)
      } else {
        console.log(`  Error: ${result.error}`)
      }
    })

    // Use the WebSocket-Memory augmentation directly
    console.log('\n=== Using WebSocket-Memory Augmentation ===')
    const connection = await webSocketMemory.connectWebSocket('wss://example.com/storage')
    console.log('Connection established:', connection)

    // Store data through WebSocket
    console.log('\n=== Storing Data Through WebSocket ===')
    const wsStoreResult = await webSocketMemory.storeData(
      'wsUser123',
      { name: 'WebSocket User', email: 'ws@example.com' },
      { connectionId: connection.connectionId }
    )
    console.log('WebSocket Store Result:', wsStoreResult)

    // Retrieve data through WebSocket
    console.log('\n=== Retrieving Data Through WebSocket ===')
    const wsRetrieveResult = await webSocketMemory.retrieveData(
      'wsUser123',
      { connectionId: connection.connectionId }
    )
    console.log('WebSocket Retrieve Result:', wsRetrieveResult)

    // Delete data from all memory augmentations
    console.log('\n=== Deleting Data ===')
    const deleteResults = await augmentationPipeline.executeMemoryPipeline(
      'deleteData',
      ['user123']
    )

    console.log('\nDelete Results:')
    deleteResults.forEach((result, index) => {
      console.log(`Result ${index + 1}:`)
      console.log(`  Success: ${result.success}`)
      if (!result.success) {
        console.log(`  Error: ${result.error}`)
      }
    })

    // Shut down all registered augmentations
    console.log('\n=== Shutting Down Augmentations ===')
    await augmentationPipeline.shutDown()

    console.log('\n=== Example Complete ===')
  } catch (error) {
    console.error('Error in memory augmentation example:', error)
  }
}

// Run the example
main()
