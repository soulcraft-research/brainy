import { WebSocket, WebSocketServer } from 'ws'
import { logger } from '../utils/logger.js'

/**
 * WebSocket Augmentation - Real-time communication using Brainy's native augmentation system
 * Handles real-time queries, updates, and bidirectional communication
 */
export class WebSocketAugmentation {
  constructor(options = {}) {
    this.type = 'WEBSOCKET'
    this.priority = 2
    this.options = {
      port: options.port || 3001,
      enableRealtime: options.enableRealtime !== false,
      enableBroadcast: options.enableBroadcast !== false,
      heartbeatInterval: options.heartbeatInterval || 30000,
      ...options
    }
    
    this.server = null
    this.clients = new Set()
    this.db = null
    this.heartbeatTimer = null
  }

  async augment(brainyData, context) {
    this.db = brainyData
    
    try {
      // Create WebSocket server
      this.server = new WebSocketServer({
        port: this.options.port,
        perMessageDeflate: true
      })

      this.server.on('connection', (ws, request) => {
        this.handleConnection(ws, request)
      })

      // Start heartbeat for connection management
      if (this.options.heartbeatInterval > 0) {
        this.startHeartbeat()
      }

      logger.info('WebSocket augmentation initialized', {
        port: this.options.port,
        features: {
          realtime: this.options.enableRealtime,
          broadcast: this.options.enableBroadcast
        }
      })

      // Hook into Brainy events if real-time is enabled
      if (this.options.enableRealtime) {
        this.setupRealtimeHooks()
      }

    } catch (error) {
      logger.error('Failed to initialize WebSocket augmentation:', error)
      throw error
    }
  }

  handleConnection(ws, request) {
    const clientId = this.generateClientId()
    ws.clientId = clientId
    this.clients.add(ws)

    logger.debug('WebSocket client connected', { 
      clientId, 
      ip: request.socket.remoteAddress,
      totalClients: this.clients.size 
    })

    // Send welcome message
    this.send(ws, {
      type: 'welcome',
      clientId,
      capabilities: {
        realtime: this.options.enableRealtime,
        broadcast: this.options.enableBroadcast,
        commands: ['search', 'add', 'addVerb', 'get', 'subscribe', 'unsubscribe']
      }
    })

    ws.on('message', (data) => {
      this.handleMessage(ws, data)
    })

    ws.on('close', () => {
      this.clients.delete(ws)
      logger.debug('WebSocket client disconnected', { 
        clientId, 
        totalClients: this.clients.size 
      })
    })

    ws.on('error', (error) => {
      logger.warn('WebSocket client error:', { clientId, error: error.message })
    })

    // Keep connection alive
    ws.isAlive = true
    ws.on('pong', () => {
      ws.isAlive = true
    })
  }

  async handleMessage(ws, data) {
    try {
      const message = JSON.parse(data.toString())
      const { id, type, payload } = message

      let result
      
      switch (type) {
        case 'search':
          result = await this.handleSearch(payload)
          break
          
        case 'add':
          result = await this.handleAdd(payload)
          break
          
        case 'addVerb':
          result = await this.handleAddVerb(payload)
          break
          
        case 'get':
          result = await this.handleGet(payload)
          break
          
        case 'subscribe':
          result = await this.handleSubscribe(ws, payload)
          break
          
        case 'unsubscribe':
          result = await this.handleUnsubscribe(ws, payload)
          break
          
        case 'ping':
          result = { pong: Date.now() }
          break
          
        default:\n          throw new Error(`Unknown message type: ${type}`)
      }

      // Send response
      this.send(ws, {\n        id,\n        type: 'response',\n        payload: result\n      })

    } catch (error) {\n      logger.warn('WebSocket message handling error:', error)\n      this.send(ws, {\n        id: message?.id,\n        type: 'error',\n        payload: {\n          message: error.message,\n          code: error.code || 'UNKNOWN_ERROR'\n        }\n      })\n    }\n  }

  async handleSearch(payload) {\n    const { query, limit = 10, threshold = 0.7, options = {} } = payload\n    \n    if (!query) {\n      throw new Error('Query is required for search')\n    }\n\n    const results = await this.db.search(query, limit, { threshold, ...options })\n    \n    return {\n      query,\n      results,\n      count: results.length,\n      timestamp: new Date().toISOString()\n    }\n  }

  async handleAdd(payload) {\n    const { data, metadata = {}, options = {} } = payload\n    \n    if (!data) {\n      throw new Error('Data is required for add operation')\n    }\n\n    const enhancedMetadata = {\n      ...metadata,\n      source: 'websocket',\n      timestamp: new Date().toISOString()\n    }\n\n    const id = await this.db.add(data, enhancedMetadata, options)\n    \n    const result = {\n      id,\n      data,\n      metadata: enhancedMetadata\n    }\n\n    // Broadcast to subscribers if enabled\n    if (this.options.enableBroadcast) {\n      this.broadcast({\n        type: 'entityAdded',\n        payload: result\n      })\n    }\n\n    return result\n  }

  async handleAddVerb(payload) {\n    const { sourceId, targetId, verbType, weight, metadata = {}, options = {} } = payload\n    \n    if (!sourceId || !targetId || !verbType) {\n      throw new Error('sourceId, targetId, and verbType are required')\n    }\n\n    const enhancedMetadata = {\n      ...metadata,\n      source: 'websocket',\n      timestamp: new Date().toISOString()\n    }\n\n    const verbId = await this.db.addVerb(sourceId, targetId, verbType, {\n      weight,\n      metadata: enhancedMetadata,\n      ...options\n    })\n    \n    const result = {\n      id: verbId,\n      sourceId,\n      targetId,\n      verbType,\n      weight,\n      metadata: enhancedMetadata\n    }\n\n    // Broadcast to subscribers if enabled\n    if (this.options.enableBroadcast) {\n      this.broadcast({\n        type: 'verbAdded',\n        payload: result\n      })\n    }\n\n    return result\n  }

  async handleGet(payload) {\n    const { id } = payload\n    \n    if (!id) {\n      throw new Error('ID is required for get operation')\n    }\n\n    const entity = await this.db.get(id)\n    \n    if (!entity) {\n      throw new Error(`Entity with ID ${id} not found`)\n    }\n\n    return entity\n  }

  async handleSubscribe(ws, payload) {\n    const { events = ['entityAdded', 'verbAdded'] } = payload\n    \n    if (!ws.subscriptions) {\n      ws.subscriptions = new Set()\n    }\n    \n    events.forEach(event => ws.subscriptions.add(event))\n    \n    return {\n      subscribed: Array.from(ws.subscriptions),\n      message: 'Successfully subscribed to events'\n    }\n  }

  async handleUnsubscribe(ws, payload) {\n    const { events = [] } = payload\n    \n    if (!ws.subscriptions) {\n      return { message: 'No active subscriptions' }\n    }\n    \n    if (events.length === 0) {\n      // Unsubscribe from all\n      ws.subscriptions.clear()\n    } else {\n      events.forEach(event => ws.subscriptions.delete(event))\n    }\n    \n    return {\n      subscribed: Array.from(ws.subscriptions),\n      message: 'Successfully unsubscribed from events'\n    }\n  }

  setupRealtimeHooks() {\n    // Hook into Brainy's internal events for real-time updates\n    // This would integrate with Brainy's event system once available\n    logger.debug('Real-time hooks configured for WebSocket augmentation')\n  }\n\n  broadcast(message, filter = null) {\n    if (!this.options.enableBroadcast) return\n    \n    const data = JSON.stringify(message)\n    \n    this.clients.forEach(client => {\n      if (client.readyState === WebSocket.OPEN) {\n        // Check if client is subscribed to this event type\n        if (client.subscriptions && client.subscriptions.has(message.type)) {\n          // Apply filter if provided\n          if (!filter || filter(client)) {\n            client.send(data)\n          }\n        }\n      }\n    })\n  }\n\n  send(ws, message) {\n    if (ws.readyState === WebSocket.OPEN) {\n      ws.send(JSON.stringify(message))\n    }\n  }\n\n  startHeartbeat() {\n    this.heartbeatTimer = setInterval(() => {\n      this.clients.forEach(ws => {\n        if (!ws.isAlive) {\n          ws.terminate()\n          return\n        }\n        \n        ws.isAlive = false\n        ws.ping()\n      })\n    }, this.options.heartbeatInterval)\n  }\n\n  generateClientId() {\n    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`\n  }\n\n  async cleanup() {\n    if (this.heartbeatTimer) {\n      clearInterval(this.heartbeatTimer)\n    }\n    \n    if (this.server) {\n      this.server.close()\n    }\n    \n    // Close all client connections\n    this.clients.forEach(client => {\n      client.close()\n    })\n    this.clients.clear()\n    \n    logger.info('WebSocket augmentation cleaned up')\n  }\n}