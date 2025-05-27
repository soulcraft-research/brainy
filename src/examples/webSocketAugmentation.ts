/**
 * WebSocket Augmentation Example
 * 
 * This example demonstrates how to create and register a WebSocket-supporting augmentation.
 */

import {
  augmentationPipeline,
  IAugmentation,
  IWebSocketSupport,
  IWebSocketCognitionAugmentation,
  AugmentationResponse,
  BrainyAugmentations
} from '../index.js'

/**
 * Example WebSocket Augmentation
 */
class SimpleWebSocketAugmentation implements IWebSocketSupport {
  readonly name = 'simple-websocket'
  readonly description = 'A simple WebSocket augmentation for demonstration'

  async initialize(): Promise<void> {
    console.log('Initializing SimpleWebSocketAugmentation')
  }

  async shutDown(): Promise<void> {
    console.log('Shutting down SimpleWebSocketAugmentation')
  }

  async getStatus(): Promise<'active' | 'inactive' | 'error'> {
    return 'active'
  }

  async connectWebSocket(url: string, protocols?: string | string[]): Promise<{ 
    connectionId: string; 
    url: string; 
    status: 'connected' | 'disconnected' | 'error' 
  }> {
    console.log(`Connecting to WebSocket at ${url}`)
    return {
      connectionId: 'ws-1',
      url,
      status: 'connected'
    }
  }

  async sendWebSocketMessage(connectionId: string, data: unknown): Promise<void> {
    console.log(`Sending message to WebSocket ${connectionId}:`, data)
  }

  async onWebSocketMessage(connectionId: string, callback: (data: unknown) => void): Promise<void> {
    console.log(`Registering callback for WebSocket ${connectionId}`)
    // In a real implementation, this would set up a listener
  }

  async closeWebSocket(connectionId: string, code?: number, reason?: string): Promise<void> {
    console.log(`Closing WebSocket ${connectionId}`)
  }
}

/**
 * Example Combined WebSocket and Cognition Augmentation
 */
class WebSocketCognitionAugmentation implements IWebSocketCognitionAugmentation {
  readonly name = 'websocket-cognition'
  readonly description = 'A combined WebSocket and Cognition augmentation for demonstration'

  async initialize(): Promise<void> {
    console.log('Initializing WebSocketCognitionAugmentation')
  }

  async shutDown(): Promise<void> {
    console.log('Shutting down WebSocketCognitionAugmentation')
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
    console.log(`WebSocketCognition connecting to WebSocket at ${url}`)
    return {
      connectionId: 'ws-cognition-1',
      url,
      status: 'connected'
    }
  }

  async sendWebSocketMessage(connectionId: string, data: unknown): Promise<void> {
    console.log(`WebSocketCognition sending message to WebSocket ${connectionId}:`, data)
  }

  async onWebSocketMessage(connectionId: string, callback: (data: unknown) => void): Promise<void> {
    console.log(`WebSocketCognition registering callback for WebSocket ${connectionId}`)
  }

  async closeWebSocket(connectionId: string, code?: number, reason?: string): Promise<void> {
    console.log(`WebSocketCognition closing WebSocket ${connectionId}`)
  }

  // Cognition methods
  async reason(
    query: string,
    context?: Record<string, unknown>
  ): Promise<AugmentationResponse<{ inference: string; confidence: number }>> {
    console.log(`WebSocketCognition reasoning about: ${query}`)
    console.log('Context:', context)

    return {
      success: true,
      data: {
        inference: `WebSocket-enabled inference about: ${query}`,
        confidence: 0.85
      }
    }
  }

  async infer(
    dataSubset: Record<string, unknown>
  ): Promise<AugmentationResponse<Record<string, unknown>>> {
    return {
      success: true,
      data: {
        result: `WebSocket-enabled inference from data: ${JSON.stringify(dataSubset)}`
      }
    }
  }

  async executeLogic(
    ruleId: string,
    input: Record<string, unknown>
  ): Promise<AugmentationResponse<boolean>> {
    return {
      success: true,
      data: true
    }
  }
}

/**
 * Main function to demonstrate the WebSocket augmentation
 */
async function main() {
  try {
    console.log('=== WebSocket Augmentation Example ===')

    // Create augmentation instances
    const simpleWebSocket = new SimpleWebSocketAugmentation()
    const webSocketCognition = new WebSocketCognitionAugmentation()

    // Register augmentations with the pipeline
    augmentationPipeline
      .register(simpleWebSocket)
      .register(webSocketCognition)

    // Initialize all registered augmentations
    console.log('\n=== Initializing Augmentations ===')
    await augmentationPipeline.initialize()

    // Get all WebSocket-supporting augmentations
    console.log('\n=== WebSocket Augmentations ===')
    const webSocketAugmentations = augmentationPipeline.getWebSocketAugmentations()
    console.log(`Found ${webSocketAugmentations.length} WebSocket augmentations:`)
    webSocketAugmentations.forEach(aug => {
      console.log(`- ${aug.name}: ${aug.description}`)
    })

    // Use the simple WebSocket augmentation
    console.log('\n=== Using Simple WebSocket Augmentation ===')
    const connection = await simpleWebSocket.connectWebSocket('wss://example.com')
    console.log('Connection established:', connection)
    await simpleWebSocket.sendWebSocketMessage(connection.connectionId, { message: 'Hello, WebSocket!' })

    // Use the combined WebSocket and Cognition augmentation
    console.log('\n=== Using Combined WebSocket-Cognition Augmentation ===')
    const wsConnection = await webSocketCognition.connectWebSocket('wss://example.com/cognition')
    console.log('Connection established:', wsConnection)
    await webSocketCognition.sendWebSocketMessage(wsConnection.connectionId, { message: 'Hello from cognition!' })

    // Execute a cognition method on the combined augmentation
    console.log('\n=== Executing Cognition Method on Combined Augmentation ===')
    const reasoningResult = await webSocketCognition.reason('What is the meaning of life?', { context: 'philosophical' })
    console.log('Reasoning result:', reasoningResult)

    // Use the cognition pipeline with the combined augmentation
    console.log('\n=== Executing Cognition Pipeline ===')
    const pipelineResults = await augmentationPipeline.executeCognitionPipeline(
      'reason',
      ['What is the capital of France?', { additionalContext: 'geography' }]
    )
    console.log('Pipeline results:', pipelineResults)

    // Shut down all registered augmentations
    console.log('\n=== Shutting Down Augmentations ===')
    await augmentationPipeline.shutDown()

    console.log('\n=== Example Complete ===')
  } catch (error) {
    console.error('Error in WebSocket augmentation example:', error)
  }
}

// Run the example
main()
