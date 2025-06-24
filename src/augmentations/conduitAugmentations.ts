import {
  AugmentationType,
  IConduitAugmentation,
  IWebSocketSupport,
  AugmentationResponse,
  WebSocketConnection
} from '../types/augmentations.js'
import { v4 as uuidv4 } from 'uuid'

/**
 * Base class for conduit augmentations that provide data synchronization between Brainy instances
 */
abstract class BaseConduitAugmentation implements IConduitAugmentation {
  readonly name: string
  readonly description: string = 'Base conduit augmentation'
  enabled: boolean = true
  protected isInitialized = false
  protected connections: Map<string, any> = new Map()

  constructor(name: string) {
    this.name = name
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      this.isInitialized = true
    } catch (error) {
      console.error(`Failed to initialize ${this.name}:`, error)
      throw new Error(`Failed to initialize ${this.name}: ${error}`)
    }
  }

  async shutDown(): Promise<void> {
    // Close all connections
    for (const [connectionId, connection] of this.connections.entries()) {
      try {
        if (connection.close) {
          await connection.close()
        }
      } catch (error) {
        console.error(`Failed to close connection ${connectionId}:`, error)
      }
    }

    this.connections.clear()
    this.isInitialized = false
  }

  async getStatus(): Promise<'active' | 'inactive' | 'error'> {
    return this.isInitialized ? 'active' : 'inactive'
  }

  abstract establishConnection(
    targetSystemId: string,
    config: Record<string, unknown>
  ): Promise<AugmentationResponse<WebSocketConnection>>

  abstract readData(
    query: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<unknown>>

  abstract writeData(
    data: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<unknown>>

  abstract monitorStream(
    streamId: string,
    callback: (data: unknown) => void
  ): Promise<void>

  protected async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }
}

/**
 * WebSocket conduit augmentation for syncing Brainy instances using WebSockets
 * 
 * This conduit is for syncing between browsers and servers, or between servers.
 * WebSockets cannot be used for direct browser-to-browser communication without a server in the middle.
 */
export class WebSocketConduitAugmentation extends BaseConduitAugmentation implements IWebSocketSupport {
  readonly description = 'Conduit augmentation that syncs Brainy instances using WebSockets'
  private webSocketConnections: Map<string, WebSocketConnection> = new Map()
  private messageCallbacks: Map<string, Set<(data: unknown) => void>> = new Map()

  constructor(name: string = 'websocket-conduit') {
    super(name)
  }

  getType(): AugmentationType {
    return AugmentationType.CONDUIT
  }

  /**
   * Establishes a connection to another Brainy instance
   * @param targetSystemId The URL or identifier of the target system
   * @param config Configuration options for the connection
   */
  async establishConnection(
    targetSystemId: string,
    config: Record<string, unknown>
  ): Promise<AugmentationResponse<WebSocketConnection>> {
    await this.ensureInitialized()

    try {
      // For WebSocket connections, targetSystemId should be a WebSocket URL
      const url = targetSystemId
      const protocols = config.protocols as string | string[] | undefined

      // Create a WebSocket connection
      const connection = await this.connectWebSocket(url, protocols)

      // Store the connection
      this.connections.set(connection.connectionId, connection)

      return {
        success: true,
        data: connection
      }
    } catch (error) {
      console.error(`Failed to establish connection to ${targetSystemId}:`, error)
      return {
        success: false,
        data: null as any,
        error: `Failed to establish connection: ${error}`
      }
    }
  }

  /**
   * Reads data from a connected Brainy instance
   * @param query Query parameters for reading data
   * @param options Additional options
   */
  async readData(
    query: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<unknown>> {
    await this.ensureInitialized()

    try {
      const connectionId = query.connectionId as string

      if (!connectionId) {
        throw new Error('connectionId is required for reading data')
      }

      const connection = this.webSocketConnections.get(connectionId)

      if (!connection) {
        throw new Error(`Connection ${connectionId} not found`)
      }

      // Create a request message
      const requestMessage = {
        type: 'read',
        query: query.query || {},
        requestId: uuidv4(),
        options
      }

      // Send the request
      await this.sendWebSocketMessage(connectionId, requestMessage)

      // Return a promise that will be resolved when the response is received
      return new Promise((resolve) => {
        const responseHandler = (data: unknown) => {
          // Check if this is the response to our request
          const response = data as any
          if (response && response.type === 'readResponse' && response.requestId === requestMessage.requestId) {
            // Remove the handler
            this.offWebSocketMessage(connectionId, responseHandler)

            // Resolve with the response data
            resolve({
              success: response.success,
              data: response.data,
              error: response.error
            })
          }
        }

        // Register the response handler
        this.onWebSocketMessage(connectionId, responseHandler)

        // Set a timeout to prevent hanging
        setTimeout(() => {
          this.offWebSocketMessage(connectionId, responseHandler)
          resolve({
            success: false,
            data: null,
            error: 'Timeout waiting for read response'
          })
        }, 30000) // 30 second timeout
      })
    } catch (error) {
      console.error(`Failed to read data:`, error)
      return {
        success: false,
        data: null,
        error: `Failed to read data: ${error}`
      }
    }
  }

  /**
   * Writes data to a connected Brainy instance
   * @param data The data to write
   * @param options Additional options
   */
  async writeData(
    data: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<unknown>> {
    await this.ensureInitialized()

    try {
      const connectionId = data.connectionId as string

      if (!connectionId) {
        throw new Error('connectionId is required for writing data')
      }

      const connection = this.webSocketConnections.get(connectionId)

      if (!connection) {
        throw new Error(`Connection ${connectionId} not found`)
      }

      // Create a write message
      const writeMessage = {
        type: 'write',
        data: data.data || {},
        requestId: uuidv4(),
        options
      }

      // Send the write message
      await this.sendWebSocketMessage(connectionId, writeMessage)

      // Return a promise that will be resolved when the response is received
      return new Promise((resolve) => {
        const responseHandler = (data: unknown) => {
          // Check if this is the response to our request
          const response = data as any
          if (response && response.type === 'writeResponse' && response.requestId === writeMessage.requestId) {
            // Remove the handler
            this.offWebSocketMessage(connectionId, responseHandler)

            // Resolve with the response data
            resolve({
              success: response.success,
              data: response.data,
              error: response.error
            })
          }
        }

        // Register the response handler
        this.onWebSocketMessage(connectionId, responseHandler)

        // Set a timeout to prevent hanging
        setTimeout(() => {
          this.offWebSocketMessage(connectionId, responseHandler)
          resolve({
            success: false,
            data: null,
            error: 'Timeout waiting for write response'
          })
        }, 30000) // 30 second timeout
      })
    } catch (error) {
      console.error(`Failed to write data:`, error)
      return {
        success: false,
        data: null,
        error: `Failed to write data: ${error}`
      }
    }
  }

  /**
   * Monitors a data stream from a connected Brainy instance
   * @param streamId The ID of the stream to monitor (usually a connection ID)
   * @param callback Function to call when new data is received
   */
  async monitorStream(
    streamId: string,
    callback: (data: unknown) => void
  ): Promise<void> {
    await this.ensureInitialized()

    try {
      const connection = this.webSocketConnections.get(streamId)

      if (!connection) {
        throw new Error(`Connection ${streamId} not found`)
      }

      // Register the callback for all messages on this connection
      await this.onWebSocketMessage(streamId, callback)

    } catch (error) {
      console.error(`Failed to monitor stream ${streamId}:`, error)
      throw new Error(`Failed to monitor stream: ${error}`)
    }
  }

  /**
   * Establishes a WebSocket connection
   * @param url The WebSocket server URL to connect to
   * @param protocols Optional subprotocols
   */
  async connectWebSocket(
    url: string,
    protocols?: string | string[]
  ): Promise<WebSocketConnection> {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      try {
        // Check if WebSocket is available
        if (typeof WebSocket === 'undefined') {
          throw new Error('WebSocket is not available in this environment')
        }

        // Create a new WebSocket connection
        const ws = new WebSocket(url, protocols)
        const connectionId = uuidv4()

        // Create a connection object
        const connection: WebSocketConnection = {
          connectionId,
          url,
          status: 'disconnected',
          send: async (data) => {
            if (ws.readyState !== WebSocket.OPEN) {
              throw new Error('WebSocket is not open')
            }
            ws.send(data)
          },
          close: async () => {
            ws.close()
          }
        }

        // Set up event handlers
        ws.onopen = () => {
          connection.status = 'connected'
          resolve(connection)
        }

        ws.onerror = (error) => {
          connection.status = 'error'
          console.error(`WebSocket error for ${url}:`, error)
          if (ws.readyState !== WebSocket.OPEN) {
            reject(new Error(`WebSocket connection failed: ${error}`))
          }
        }

        ws.onclose = () => {
          connection.status = 'disconnected'
          // Remove from connections map
          this.webSocketConnections.delete(connectionId)
          // Remove all callbacks
          this.messageCallbacks.delete(connectionId)
        }

        // Create a message handler wrapper that will call all registered callbacks
        const messageHandlerWrapper = (data: unknown) => {
          const callbacks = this.messageCallbacks.get(connectionId)
          if (callbacks) {
            for (const callback of callbacks) {
              try {
                callback(data)
              } catch (error) {
                console.error(`Error in WebSocket message callback:`, error)
              }
            }
          }
        }

        // Store the message handler wrapper
        connection._messageHandlerWrapper = messageHandlerWrapper

        // Set up the message handler
        ws.onmessage = (event) => {
          try {
            // Parse the message if it's a string
            let data = event.data
            if (typeof data === 'string') {
              try {
                data = JSON.parse(data)
              } catch {
                // If parsing fails, use the raw string
              }
            }

            // Call the message handler wrapper
            messageHandlerWrapper(data)
          } catch (error) {
            console.error(`Error handling WebSocket message:`, error)
          }
        }

        // Store the stream message handler
        connection._streamMessageHandler = (event) => ws.onmessage && ws.onmessage(event as any)

        // Store the connection
        this.webSocketConnections.set(connectionId, connection)

        // Initialize the callbacks set
        this.messageCallbacks.set(connectionId, new Set())

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Sends data through an established WebSocket connection
   * @param connectionId The identifier of the established connection
   * @param data The data to send (will be serialized if not a string)
   */
  async sendWebSocketMessage(
    connectionId: string,
    data: unknown
  ): Promise<void> {
    await this.ensureInitialized()

    const connection = this.webSocketConnections.get(connectionId)

    if (!connection) {
      throw new Error(`WebSocket connection ${connectionId} not found`)
    }

    if (!connection.send) {
      throw new Error(`WebSocket connection ${connectionId} does not support sending messages`)
    }

    // Serialize the data if it's not already a string or binary
    let serializedData: string | ArrayBufferLike | Blob | ArrayBufferView

    if (typeof data === 'string' || 
        data instanceof ArrayBuffer || 
        data instanceof Blob || 
        ArrayBuffer.isView(data)) {
      serializedData = data as any
    } else {
      // Convert to JSON string
      serializedData = JSON.stringify(data)
    }

    // Send the data
    await connection.send(serializedData)
  }

  /**
   * Registers a callback for incoming WebSocket messages
   * @param connectionId The identifier of the established connection
   * @param callback The function to call when a message is received
   */
  async onWebSocketMessage(
    connectionId: string,
    callback: (data: unknown) => void
  ): Promise<void> {
    await this.ensureInitialized()

    const connection = this.webSocketConnections.get(connectionId)

    if (!connection) {
      throw new Error(`WebSocket connection ${connectionId} not found`)
    }

    // Get or create the callbacks set for this connection
    let callbacks = this.messageCallbacks.get(connectionId)

    if (!callbacks) {
      callbacks = new Set()
      this.messageCallbacks.set(connectionId, callbacks)
    }

    // Add the callback
    callbacks.add(callback)
  }

  /**
   * Removes a callback for incoming WebSocket messages
   * @param connectionId The identifier of the established connection
   * @param callback The function to remove from the callbacks
   */
  async offWebSocketMessage(
    connectionId: string,
    callback: (data: unknown) => void
  ): Promise<void> {
    await this.ensureInitialized()

    const callbacks = this.messageCallbacks.get(connectionId)

    if (callbacks) {
      callbacks.delete(callback)
    }
  }

  /**
   * Closes an established WebSocket connection
   * @param connectionId The identifier of the established connection
   * @param code Optional close code
   * @param reason Optional close reason
   */
  async closeWebSocket(
    connectionId: string,
    code?: number,
    reason?: string
  ): Promise<void> {
    await this.ensureInitialized()

    const connection = this.webSocketConnections.get(connectionId)

    if (!connection) {
      throw new Error(`WebSocket connection ${connectionId} not found`)
    }

    if (!connection.close) {
      throw new Error(`WebSocket connection ${connectionId} does not support closing`)
    }

    // Close the connection
    await connection.close()

    // Remove from connections map
    this.webSocketConnections.delete(connectionId)

    // Remove all callbacks
    this.messageCallbacks.delete(connectionId)
  }
}

/**
 * WebRTC conduit augmentation for syncing Brainy instances using WebRTC
 * 
 * This conduit is for direct peer-to-peer syncing between browsers.
 * It is the recommended approach for browser-to-browser communication.
 */
export class WebRTCConduitAugmentation extends BaseConduitAugmentation implements IWebSocketSupport {
  readonly description = 'Conduit augmentation that syncs Brainy instances using WebRTC'
  private peerConnections: Map<string, RTCPeerConnection> = new Map()
  private dataChannels: Map<string, RTCDataChannel> = new Map()
  private webSocketConnections: Map<string, WebSocketConnection> = new Map()
  private messageCallbacks: Map<string, Set<(data: unknown) => void>> = new Map()
  private signalServer: WebSocketConnection | null = null

  constructor(name: string = 'webrtc-conduit') {
    super(name)
  }

  getType(): AugmentationType {
    return AugmentationType.CONDUIT
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Check if WebRTC is available
      if (typeof RTCPeerConnection === 'undefined') {
        throw new Error('WebRTC is not available in this environment')
      }

      this.isInitialized = true
    } catch (error) {
      console.error(`Failed to initialize ${this.name}:`, error)
      throw new Error(`Failed to initialize ${this.name}: ${error}`)
    }
  }

  /**
   * Establishes a connection to another Brainy instance using WebRTC
   * @param targetSystemId The peer ID or signal server URL
   * @param config Configuration options for the connection
   */
  async establishConnection(
    targetSystemId: string,
    config: Record<string, unknown>
  ): Promise<AugmentationResponse<WebSocketConnection>> {
    await this.ensureInitialized()

    try {
      // For WebRTC, we need to:
      // 1. Connect to a signaling server (if not already connected)
      // 2. Create a peer connection
      // 3. Create a data channel
      // 4. Exchange ICE candidates and SDP offers/answers

      // Check if we need to connect to a signaling server
      if (!this.signalServer && config.signalServerUrl) {
        // Connect to the signaling server
        this.signalServer = await this.connectWebSocket(config.signalServerUrl as string)

        // Set up message handling for the signaling server
        await this.onWebSocketMessage(this.signalServer.connectionId, async (data) => {
          // Handle signaling messages
          const message = data as any

          if (message.type === 'ice-candidate' && message.targetPeerId === config.localPeerId) {
            // Add ICE candidate to the appropriate peer connection
            const peerConnection = this.peerConnections.get(message.sourcePeerId)
            if (peerConnection) {
              try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate))
              } catch (error) {
                console.error(`Failed to add ICE candidate:`, error)
              }
            }
          } else if (message.type === 'offer' && message.targetPeerId === config.localPeerId) {
            // Handle incoming offer
            await this.handleOffer(message.sourcePeerId, message.offer, config)
          } else if (message.type === 'answer' && message.targetPeerId === config.localPeerId) {
            // Handle incoming answer
            const peerConnection = this.peerConnections.get(message.sourcePeerId)
            if (peerConnection) {
              try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer))
              } catch (error) {
                console.error(`Failed to set remote description:`, error)
              }
            }
          }
        })
      }

      // Create a peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: (config.iceServers as RTCIceServer[]) || [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      })

      // Generate a connection ID
      const connectionId = uuidv4()

      // Store the peer connection
      this.peerConnections.set(targetSystemId, peerConnection)

      // Create a data channel
      const dataChannel = peerConnection.createDataChannel('brainy-sync', {
        ordered: true
      })

      // Set up data channel event handlers
      dataChannel.onopen = () => {
        console.log(`Data channel to ${targetSystemId} opened`)
      }

      dataChannel.onclose = () => {
        console.log(`Data channel to ${targetSystemId} closed`)
        // Clean up
        this.dataChannels.delete(targetSystemId)
        this.peerConnections.delete(targetSystemId)
        this.webSocketConnections.delete(connectionId)
        this.messageCallbacks.delete(connectionId)
      }

      dataChannel.onerror = (error) => {
        console.error(`Data channel error:`, error)
      }

      // Create a message handler wrapper that will call all registered callbacks
      const messageHandlerWrapper = (data: unknown) => {
        const callbacks = this.messageCallbacks.get(connectionId)
        if (callbacks) {
          for (const callback of callbacks) {
            try {
              callback(data)
            } catch (error) {
              console.error(`Error in WebRTC message callback:`, error)
            }
          }
        }
      }

      dataChannel.onmessage = (event) => {
        try {
          // Parse the message if it's a string
          let data = event.data
          if (typeof data === 'string') {
            try {
              data = JSON.parse(data)
            } catch {
              // If parsing fails, use the raw string
            }
          }

          // Call the message handler wrapper
          messageHandlerWrapper(data)
        } catch (error) {
          console.error(`Error handling WebRTC message:`, error)
        }
      }

      // Store the data channel
      this.dataChannels.set(targetSystemId, dataChannel)

      // Set up ICE candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.signalServer) {
          // Send the ICE candidate to the peer via the signaling server
          this.sendWebSocketMessage(this.signalServer.connectionId, {
            type: 'ice-candidate',
            sourcePeerId: config.localPeerId,
            targetPeerId: targetSystemId,
            candidate: event.candidate
          })
        }
      }

      // Create a WebSocket-like connection object for the WebRTC connection
      const connection: WebSocketConnection = {
        connectionId,
        url: `webrtc://${targetSystemId}`,
        status: 'disconnected',
        send: async (data) => {
          const dc = this.dataChannels.get(targetSystemId)
          if (!dc || dc.readyState !== 'open') {
            throw new Error('WebRTC data channel is not open')
          }

          // Send the data
          if (typeof data === 'string') {
            dc.send(data)
          } else if (data instanceof Blob) {
            dc.send(data)
          } else if (data instanceof ArrayBuffer) {
            dc.send(new Uint8Array(data))
          } else if (ArrayBuffer.isView(data)) {
            dc.send(data)
          } else {
            // Convert to JSON string
            dc.send(JSON.stringify(data))
          }
        },
        close: async () => {
          const dc = this.dataChannels.get(targetSystemId)
          if (dc) {
            dc.close()
          }

          const pc = this.peerConnections.get(targetSystemId)
          if (pc) {
            pc.close()
          }

          // Clean up
          this.dataChannels.delete(targetSystemId)
          this.peerConnections.delete(targetSystemId)
          this.webSocketConnections.delete(connectionId)
          this.messageCallbacks.delete(connectionId)
        },
        _messageHandlerWrapper: messageHandlerWrapper
      }

      // Store the connection
      this.webSocketConnections.set(connectionId, connection)

      // Initialize the callbacks set
      this.messageCallbacks.set(connectionId, new Set())

      // Create and send an offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      // Send the offer to the peer via the signaling server
      if (this.signalServer) {
        await this.sendWebSocketMessage(this.signalServer.connectionId, {
          type: 'offer',
          sourcePeerId: config.localPeerId,
          targetPeerId: targetSystemId,
          offer
        })
      }

      // Return the connection
      return {
        success: true,
        data: connection
      }
    } catch (error) {
      console.error(`Failed to establish WebRTC connection to ${targetSystemId}:`, error)
      return {
        success: false,
        data: null as any,
        error: `Failed to establish WebRTC connection: ${error}`
      }
    }
  }

  /**
   * Handles an incoming WebRTC offer
   * @param peerId The ID of the peer sending the offer
   * @param offer The SDP offer
   * @param config Configuration options
   */
  private async handleOffer(
    peerId: string,
    offer: RTCSessionDescriptionInit,
    config: Record<string, unknown>
  ): Promise<void> {
    try {
      // Create a peer connection if it doesn't exist
      let peerConnection = this.peerConnections.get(peerId)

      if (!peerConnection) {
        peerConnection = new RTCPeerConnection({
          iceServers: (config.iceServers as RTCIceServer[]) || [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        })

        // Store the peer connection
        this.peerConnections.set(peerId, peerConnection)

        // Set up ICE candidate handling
        peerConnection.onicecandidate = (event) => {
          if (event.candidate && this.signalServer) {
            // Send the ICE candidate to the peer via the signaling server
            this.sendWebSocketMessage(this.signalServer.connectionId, {
              type: 'ice-candidate',
              sourcePeerId: config.localPeerId,
              targetPeerId: peerId,
              candidate: event.candidate
            })
          }
        }

        // Handle data channel creation by the remote peer
        peerConnection.ondatachannel = (event) => {
          const dataChannel = event.channel

          // Generate a connection ID
          const connectionId = uuidv4()

          // Store the data channel
          this.dataChannels.set(peerId, dataChannel)

          // Set up data channel event handlers
          dataChannel.onopen = () => {
            console.log(`Data channel from ${peerId} opened`)
          }

          dataChannel.onclose = () => {
            console.log(`Data channel from ${peerId} closed`)
            // Clean up
            this.dataChannels.delete(peerId)
            this.peerConnections.delete(peerId)
            this.webSocketConnections.delete(connectionId)
            this.messageCallbacks.delete(connectionId)
          }

          dataChannel.onerror = (error) => {
            console.error(`Data channel error:`, error)
          }

          // Create a message handler wrapper that will call all registered callbacks
          const messageHandlerWrapper = (data: unknown) => {
            const callbacks = this.messageCallbacks.get(connectionId)
            if (callbacks) {
              for (const callback of callbacks) {
                try {
                  callback(data)
                } catch (error) {
                  console.error(`Error in WebRTC message callback:`, error)
                }
              }
            }
          }

          dataChannel.onmessage = (event) => {
            try {
              // Parse the message if it's a string
              let data = event.data
              if (typeof data === 'string') {
                try {
                  data = JSON.parse(data)
                } catch {
                  // If parsing fails, use the raw string
                }
              }

              // Call the message handler wrapper
              messageHandlerWrapper(data)
            } catch (error) {
              console.error(`Error handling WebRTC message:`, error)
            }
          }

          // Create a WebSocket-like connection object for the WebRTC connection
          const connection: WebSocketConnection = {
            connectionId,
            url: `webrtc://${peerId}`,
            status: 'disconnected',
            send: async (data) => {
              if (dataChannel.readyState !== 'open') {
                throw new Error('WebRTC data channel is not open')
              }

              // Send the data
              if (typeof data === 'string') {
                dataChannel.send(data)
              } else if (data instanceof Blob) {
                dataChannel.send(data)
              } else if (data instanceof ArrayBuffer) {
                dataChannel.send(new Uint8Array(data))
              } else if (ArrayBuffer.isView(data)) {
                dataChannel.send(data)
              } else {
                // Convert to JSON string
                dataChannel.send(JSON.stringify(data))
              }
            },
            close: async () => {
              dataChannel.close()

              const pc = this.peerConnections.get(peerId)
              if (pc) {
                pc.close()
              }

              // Clean up
              this.dataChannels.delete(peerId)
              this.peerConnections.delete(peerId)
              this.webSocketConnections.delete(connectionId)
              this.messageCallbacks.delete(connectionId)
            },
            _messageHandlerWrapper: messageHandlerWrapper
          }

          // Store the connection
          this.webSocketConnections.set(connectionId, connection)

          // Initialize the callbacks set
          this.messageCallbacks.set(connectionId, new Set())
        }
      }

      // Set the remote description (the offer)
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))

      // Create an answer
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      // Send the answer to the peer via the signaling server
      if (this.signalServer) {
        await this.sendWebSocketMessage(this.signalServer.connectionId, {
          type: 'answer',
          sourcePeerId: config.localPeerId,
          targetPeerId: peerId,
          answer
        })
      }
    } catch (error) {
      console.error(`Failed to handle WebRTC offer:`, error)
      throw new Error(`Failed to handle WebRTC offer: ${error}`)
    }
  }

  /**
   * Reads data from a connected Brainy instance
   * @param query Query parameters for reading data
   * @param options Additional options
   */
  async readData(
    query: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<unknown>> {
    await this.ensureInitialized()

    try {
      const connectionId = query.connectionId as string

      if (!connectionId) {
        throw new Error('connectionId is required for reading data')
      }

      const connection = this.webSocketConnections.get(connectionId)

      if (!connection) {
        throw new Error(`Connection ${connectionId} not found`)
      }

      // Create a request message
      const requestMessage = {
        type: 'read',
        query: query.query || {},
        requestId: uuidv4(),
        options
      }

      // Send the request
      await this.sendWebSocketMessage(connectionId, requestMessage)

      // Return a promise that will be resolved when the response is received
      return new Promise((resolve) => {
        const responseHandler = (data: unknown) => {
          // Check if this is the response to our request
          const response = data as any
          if (response && response.type === 'readResponse' && response.requestId === requestMessage.requestId) {
            // Remove the handler
            this.offWebSocketMessage(connectionId, responseHandler)

            // Resolve with the response data
            resolve({
              success: response.success,
              data: response.data,
              error: response.error
            })
          }
        }

        // Register the response handler
        this.onWebSocketMessage(connectionId, responseHandler)

        // Set a timeout to prevent hanging
        setTimeout(() => {
          this.offWebSocketMessage(connectionId, responseHandler)
          resolve({
            success: false,
            data: null,
            error: 'Timeout waiting for read response'
          })
        }, 30000) // 30 second timeout
      })
    } catch (error) {
      console.error(`Failed to read data:`, error)
      return {
        success: false,
        data: null,
        error: `Failed to read data: ${error}`
      }
    }
  }

  /**
   * Writes data to a connected Brainy instance
   * @param data The data to write
   * @param options Additional options
   */
  async writeData(
    data: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<AugmentationResponse<unknown>> {
    await this.ensureInitialized()

    try {
      const connectionId = data.connectionId as string

      if (!connectionId) {
        throw new Error('connectionId is required for writing data')
      }

      const connection = this.webSocketConnections.get(connectionId)

      if (!connection) {
        throw new Error(`Connection ${connectionId} not found`)
      }

      // Create a write message
      const writeMessage = {
        type: 'write',
        data: data.data || {},
        requestId: uuidv4(),
        options
      }

      // Send the write message
      await this.sendWebSocketMessage(connectionId, writeMessage)

      // Return a promise that will be resolved when the response is received
      return new Promise((resolve) => {
        const responseHandler = (data: unknown) => {
          // Check if this is the response to our request
          const response = data as any
          if (response && response.type === 'writeResponse' && response.requestId === writeMessage.requestId) {
            // Remove the handler
            this.offWebSocketMessage(connectionId, responseHandler)

            // Resolve with the response data
            resolve({
              success: response.success,
              data: response.data,
              error: response.error
            })
          }
        }

        // Register the response handler
        this.onWebSocketMessage(connectionId, responseHandler)

        // Set a timeout to prevent hanging
        setTimeout(() => {
          this.offWebSocketMessage(connectionId, responseHandler)
          resolve({
            success: false,
            data: null,
            error: 'Timeout waiting for write response'
          })
        }, 30000) // 30 second timeout
      })
    } catch (error) {
      console.error(`Failed to write data:`, error)
      return {
        success: false,
        data: null,
        error: `Failed to write data: ${error}`
      }
    }
  }

  /**
   * Monitors a data stream from a connected Brainy instance
   * @param streamId The ID of the stream to monitor (usually a connection ID)
   * @param callback Function to call when new data is received
   */
  async monitorStream(
    streamId: string,
    callback: (data: unknown) => void
  ): Promise<void> {
    await this.ensureInitialized()

    try {
      const connection = this.webSocketConnections.get(streamId)

      if (!connection) {
        throw new Error(`Connection ${streamId} not found`)
      }

      // Register the callback for all messages on this connection
      await this.onWebSocketMessage(streamId, callback)

    } catch (error) {
      console.error(`Failed to monitor stream ${streamId}:`, error)
      throw new Error(`Failed to monitor stream: ${error}`)
    }
  }

  /**
   * Establishes a WebSocket connection (used for signaling in WebRTC)
   * @param url The WebSocket server URL to connect to
   * @param protocols Optional subprotocols
   */
  async connectWebSocket(
    url: string,
    protocols?: string | string[]
  ): Promise<WebSocketConnection> {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      try {
        // Check if WebSocket is available
        if (typeof WebSocket === 'undefined') {
          throw new Error('WebSocket is not available in this environment')
        }

        // Create a new WebSocket connection
        const ws = new WebSocket(url, protocols)
        const connectionId = uuidv4()

        // Create a connection object
        const connection: WebSocketConnection = {
          connectionId,
          url,
          status: 'disconnected',
          send: async (data) => {
            if (ws.readyState !== WebSocket.OPEN) {
              throw new Error('WebSocket is not open')
            }
            ws.send(data)
          },
          close: async () => {
            ws.close()
          }
        }

        // Set up event handlers
        ws.onopen = () => {
          connection.status = 'connected'
          resolve(connection)
        }

        ws.onerror = (error) => {
          connection.status = 'error'
          console.error(`WebSocket error for ${url}:`, error)
          if (ws.readyState !== WebSocket.OPEN) {
            reject(new Error(`WebSocket connection failed: ${error}`))
          }
        }

        ws.onclose = () => {
          connection.status = 'disconnected'
          // Remove from connections map
          this.webSocketConnections.delete(connectionId)
          // Remove all callbacks
          this.messageCallbacks.delete(connectionId)
        }

        // Create a message handler wrapper that will call all registered callbacks
        const messageHandlerWrapper = (data: unknown) => {
          const callbacks = this.messageCallbacks.get(connectionId)
          if (callbacks) {
            for (const callback of callbacks) {
              try {
                callback(data)
              } catch (error) {
                console.error(`Error in WebSocket message callback:`, error)
              }
            }
          }
        }

        // Store the message handler wrapper
        connection._messageHandlerWrapper = messageHandlerWrapper

        // Set up the message handler
        ws.onmessage = (event) => {
          try {
            // Parse the message if it's a string
            let data = event.data
            if (typeof data === 'string') {
              try {
                data = JSON.parse(data)
              } catch {
                // If parsing fails, use the raw string
              }
            }

            // Call the message handler wrapper
            messageHandlerWrapper(data)
          } catch (error) {
            console.error(`Error handling WebSocket message:`, error)
          }
        }

        // Store the stream message handler
        connection._streamMessageHandler = (event) => ws.onmessage && ws.onmessage(event as any)

        // Store the connection
        this.webSocketConnections.set(connectionId, connection)

        // Initialize the callbacks set
        this.messageCallbacks.set(connectionId, new Set())

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Sends data through an established WebSocket or WebRTC connection
   * @param connectionId The identifier of the established connection
   * @param data The data to send (will be serialized if not a string)
   */
  async sendWebSocketMessage(
    connectionId: string,
    data: unknown
  ): Promise<void> {
    await this.ensureInitialized()

    const connection = this.webSocketConnections.get(connectionId)

    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`)
    }

    if (!connection.send) {
      throw new Error(`Connection ${connectionId} does not support sending messages`)
    }

    // Serialize the data if it's not already a string or binary
    let serializedData: string | ArrayBufferLike | Blob | ArrayBufferView

    if (typeof data === 'string' || 
        data instanceof ArrayBuffer || 
        data instanceof Blob || 
        ArrayBuffer.isView(data)) {
      serializedData = data as any
    } else {
      // Convert to JSON string
      serializedData = JSON.stringify(data)
    }

    // Send the data
    await connection.send(serializedData)
  }

  /**
   * Registers a callback for incoming WebSocket or WebRTC messages
   * @param connectionId The identifier of the established connection
   * @param callback The function to call when a message is received
   */
  async onWebSocketMessage(
    connectionId: string,
    callback: (data: unknown) => void
  ): Promise<void> {
    await this.ensureInitialized()

    const connection = this.webSocketConnections.get(connectionId)

    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`)
    }

    // Get or create the callbacks set for this connection
    let callbacks = this.messageCallbacks.get(connectionId)

    if (!callbacks) {
      callbacks = new Set()
      this.messageCallbacks.set(connectionId, callbacks)
    }

    // Add the callback
    callbacks.add(callback)
  }

  /**
   * Removes a callback for incoming WebSocket or WebRTC messages
   * @param connectionId The identifier of the established connection
   * @param callback The function to remove from the callbacks
   */
  async offWebSocketMessage(
    connectionId: string,
    callback: (data: unknown) => void
  ): Promise<void> {
    await this.ensureInitialized()

    const callbacks = this.messageCallbacks.get(connectionId)

    if (callbacks) {
      callbacks.delete(callback)
    }
  }

  /**
   * Closes an established WebSocket or WebRTC connection
   * @param connectionId The identifier of the established connection
   * @param code Optional close code
   * @param reason Optional close reason
   */
  async closeWebSocket(
    connectionId: string,
    code?: number,
    reason?: string
  ): Promise<void> {
    await this.ensureInitialized()

    const connection = this.webSocketConnections.get(connectionId)

    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`)
    }

    if (!connection.close) {
      throw new Error(`Connection ${connectionId} does not support closing`)
    }

    // Close the connection
    await connection.close()

    // Remove from connections map
    this.webSocketConnections.delete(connectionId)

    // Remove all callbacks
    this.messageCallbacks.delete(connectionId)
  }
}

/**
 * Factory function to create the appropriate conduit augmentation based on the type
 */
export async function createConduitAugmentation(
  type: 'websocket' | 'webrtc',
  name?: string,
  options: Record<string, unknown> = {}
): Promise<IConduitAugmentation & IWebSocketSupport> {
  switch (type) {
    case 'websocket':
      const wsAugmentation = new WebSocketConduitAugmentation(name || 'websocket-conduit')
      await wsAugmentation.initialize()
      return wsAugmentation
    case 'webrtc':
      const webrtcAugmentation = new WebRTCConduitAugmentation(name || 'webrtc-conduit')
      await webrtcAugmentation.initialize()
      return webrtcAugmentation
    default:
      throw new Error(`Unknown conduit augmentation type: ${type}`)
  }
}
