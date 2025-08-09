/**
 * BrainyMCPClient
 * 
 * Client for connecting Claude instances to the Brain Jar Broadcast Server
 * Utilizes Brainy for persistent memory and vector search capabilities
 */

import WebSocket from 'ws'
import { BrainyData } from '../brainyData.js'
import { v4 as uuidv4 } from '../universal/uuid.js'

interface ClientOptions {
  name: string // e.g., 'Jarvis' or 'Picasso'
  role: string // e.g., 'Backend Systems' or 'Frontend Design'
  serverUrl?: string // Default: ws://localhost:8765
  autoReconnect?: boolean
  useBrainyMemory?: boolean // Store messages in Brainy for persistence
}

interface Message {
  id: string
  from: string
  to?: string | string[]
  type: 'message' | 'notification' | 'sync' | 'heartbeat' | 'identify'
  event?: string
  data: any
  timestamp: number
}

export class BrainyMCPClient {
  private socket?: WebSocket
  private options: Required<ClientOptions>
  private brainy?: BrainyData
  private messageHandlers: Map<string, (message: Message) => void> = new Map()
  private reconnectTimeout?: NodeJS.Timeout
  private isConnected = false

  constructor(options: ClientOptions) {
    this.options = {
      serverUrl: 'ws://localhost:8765',
      autoReconnect: true,
      useBrainyMemory: true,
      ...options
    }
  }

  /**
   * Initialize Brainy for persistent memory
   */
  private async initBrainy() {
    if (this.options.useBrainyMemory && !this.brainy) {
      this.brainy = new BrainyData({
        storage: {
          requestPersistentStorage: true
        }
      })
      await this.brainy.init()
      console.log(`🧠 Brainy memory initialized for ${this.options.name}`)
    }
  }

  /**
   * Connect to the broadcast server
   */
  async connect(): Promise<void> {
    // Initialize Brainy first
    await this.initBrainy()

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.options.serverUrl)

        this.socket.on('open', () => {
          console.log(`✅ ${this.options.name} connected to Brain Jar Broadcast`)
          this.isConnected = true

          // Identify ourselves
          this.send({
            type: 'identify',
            data: {
              name: this.options.name,
              role: this.options.role
            }
          })

          resolve()
        })

        this.socket.on('message', async (data) => {
          try {
            const message = JSON.parse(data.toString()) as Message
            await this.handleMessage(message)
          } catch (error) {
            console.error('Error parsing message:', error)
          }
        })

        this.socket.on('close', () => {
          console.log(`❌ ${this.options.name} disconnected from Brain Jar`)
          this.isConnected = false

          if (this.options.autoReconnect) {
            this.scheduleReconnect()
          }
        })

        this.socket.on('error', (error) => {
          console.error(`Connection error for ${this.options.name}:`, error)
          reject(error)
        })

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(message: Message) {
    // Store in Brainy for persistent memory
    if (this.brainy && message.type === 'message') {
      try {
        await this.brainy.add({
          text: `${message.from}: ${JSON.stringify(message.data)}`,
          metadata: {
            messageId: message.id,
            from: message.from,
            to: message.to,
            timestamp: message.timestamp,
            type: message.type,
            event: message.event
          }
        })
      } catch (error) {
        console.error('Error storing message in Brainy:', error)
      }
    }

    // Handle sync messages (receive history)
    if (message.type === 'sync' && message.data.history) {
      console.log(`📜 ${this.options.name} received ${message.data.history.length} historical messages`)
      
      // Store history in Brainy
      if (this.brainy) {
        for (const histMsg of message.data.history) {
          await this.brainy.add({
            text: `${histMsg.from}: ${JSON.stringify(histMsg.data)}`,
            metadata: histMsg
          })
        }
      }
    }

    // Call registered handlers
    const handler = this.messageHandlers.get(message.type)
    if (handler) {
      handler(message)
    }

    // Call universal handler
    const universalHandler = this.messageHandlers.get('*')
    if (universalHandler) {
      universalHandler(message)
    }
  }

  /**
   * Send a message
   */
  send(message: Partial<Message>) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error(`${this.options.name} is not connected`)
      return
    }

    const fullMessage: Message = {
      id: message.id || uuidv4(),
      from: this.options.name,
      type: message.type || 'message',
      data: message.data || {},
      timestamp: Date.now(),
      ...message
    }

    this.socket.send(JSON.stringify(fullMessage))
  }

  /**
   * Send a message to specific agent(s)
   */
  sendTo(recipient: string | string[], data: any) {
    this.send({
      to: recipient,
      type: 'message',
      data
    })
  }

  /**
   * Broadcast to all agents
   */
  broadcast(data: any) {
    this.send({
      type: 'message',
      data
    })
  }

  /**
   * Register a message handler
   */
  on(type: string, handler: (message: Message) => void) {
    this.messageHandlers.set(type, handler)
  }

  /**
   * Remove a message handler
   */
  off(type: string) {
    this.messageHandlers.delete(type)
  }

  /**
   * Search historical messages using Brainy's vector search
   */
  async searchMemory(query: string, limit = 10): Promise<any[]> {
    if (!this.brainy) {
      console.warn('Brainy memory not initialized')
      return []
    }

    const results = await this.brainy.search(query, limit)
    return results.map(r => ({
      ...r.metadata,
      relevance: r.score
    }))
  }

  /**
   * Get recent messages from Brainy memory
   */
  async getRecentMessages(limit = 20): Promise<any[]> {
    if (!this.brainy) {
      console.warn('Brainy memory not initialized')
      return []
    }

    // Search for recent activity
    const results = await this.brainy.search('recent messages communication', limit)
    return results
      .map(r => r.metadata)
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    this.reconnectTimeout = setTimeout(() => {
      console.log(`🔄 ${this.options.name} attempting to reconnect...`)
      this.connect().catch(error => {
        console.error('Reconnection failed:', error)
        this.scheduleReconnect()
      })
    }, 5000)
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    if (this.socket) {
      this.socket.close(1000, 'Client disconnecting')
      this.socket = undefined
    }

    this.isConnected = false
  }

  /**
   * Check if connected
   */
  getIsConnected(): boolean {
    return this.isConnected
  }

  /**
   * Get agent info
   */
  getAgentInfo() {
    return {
      name: this.options.name,
      role: this.options.role,
      connected: this.isConnected
    }
  }
}

// Export for both environments
export default BrainyMCPClient