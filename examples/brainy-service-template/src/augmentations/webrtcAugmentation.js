import { WebSocketServer } from 'ws'
import { logger } from '../utils/logger.js'

/**
 * WebRTC Augmentation - Peer-to-peer communication using Brainy's native augmentation system
 * Enables direct browser-to-browser or peer-to-peer Brainy database connections
 */
export class WebRTCAugmentation {
  constructor(options = {}) {
    this.type = 'WEBRTC'
    this.priority = 1 // Highest priority for peer-to-peer
    this.options = {
      port: options.port || 3002,
      enableDataChannels: options.enableDataChannels !== false,
      enablePeerDiscovery: options.enablePeerDiscovery !== false,
      maxPeers: options.maxPeers || 10,
      iceServers: options.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      ...options
    }
    
    this.signalingServer = null
    this.peers = new Map()
    this.db = null
    this.isNode = typeof process !== 'undefined'
  }

  async augment(brainyData, context) {
    this.db = brainyData
    
    try {
      // Create signaling server for WebRTC peer discovery
      await this.createSignalingServer()
      
      logger.info('WebRTC augmentation initialized', {
        port: this.options.port,
        features: {
          dataChannels: this.options.enableDataChannels,
          peerDiscovery: this.options.enablePeerDiscovery,
          maxPeers: this.options.maxPeers
        }
      })

    } catch (error) {
      logger.error('Failed to initialize WebRTC augmentation:', error)
      throw error
    }
  }

  async createSignalingServer() {
    // Create WebSocket server for WebRTC signaling
    this.signalingServer = new WebSocketServer({
      port: this.options.port,
      perMessageDeflate: true
    })

    this.signalingServer.on('connection', (ws, request) => {
      this.handleSignalingConnection(ws, request)
    })

    logger.debug('WebRTC signaling server started', { port: this.options.port })
  }

  handleSignalingConnection(ws, request) {
    const peerId = this.generatePeerId()
    ws.peerId = peerId
    
    logger.debug('WebRTC signaling client connected', { 
      peerId, 
      ip: request.socket.remoteAddress 
    })

    // Send peer ID and available peers
    this.send(ws, {
      type: 'init',
      peerId,
      peers: Array.from(this.peers.keys()),
      capabilities: {
        dataChannels: this.options.enableDataChannels,
        peerDiscovery: this.options.enablePeerDiscovery,
        commands: ['offer', 'answer', 'candidate', 'brainy-query', 'brainy-add', 'brainy-search']
      }
    })

    this.peers.set(peerId, ws)

    ws.on('message', (data) => {
      this.handleSignalingMessage(ws, data)
    })

    ws.on('close', () => {
      this.peers.delete(peerId)
      this.broadcastPeerList()
      logger.debug('WebRTC peer disconnected', { peerId, totalPeers: this.peers.size })
    })

    ws.on('error', (error) => {
      logger.warn('WebRTC signaling error:', { peerId, error: error.message })
    })

    // Broadcast updated peer list
    this.broadcastPeerList()
  }

  async handleSignalingMessage(ws, data) {
    try {
      const message = JSON.parse(data.toString())
      const { type, targetPeer, payload } = message

      switch (type) {\n        case 'offer':\n        case 'answer':\n        case 'candidate':\n          // Forward WebRTC signaling messages to target peer\n          if (targetPeer && this.peers.has(targetPeer)) {\n            const targetWs = this.peers.get(targetPeer)\n            this.send(targetWs, {\n              type,\n              sourcePeer: ws.peerId,\n              payload\n            })\n          }\n          break\n\n        case 'brainy-query':\n          // Handle direct Brainy queries over WebRTC data channel simulation\n          const result = await this.handleBrainyQuery(payload)\n          this.send(ws, {\n            type: 'brainy-response',\n            payload: result\n          })\n          break\n\n        case 'peer-discovery':\n          // Send current peer list\n          this.send(ws, {\n            type: 'peer-list',\n            peers: Array.from(this.peers.keys()).filter(id => id !== ws.peerId)\n          })\n          break\n\n        case 'broadcast-data':\n          // Broadcast data to all connected peers\n          this.broadcastData(payload, ws.peerId)\n          break\n\n        default:\n          logger.warn('Unknown WebRTC signaling message type:', type)\n      }\n\n    } catch (error) {\n      logger.warn('WebRTC signaling message error:', error)\n      this.send(ws, {\n        type: 'error',\n        payload: {\n          message: error.message,\n          code: 'SIGNALING_ERROR'\n        }\n      })\n    }\n  }\n\n  async handleBrainyQuery(payload) {\n    const { operation, params } = payload\n    \n    try {\n      let result\n      \n      switch (operation) {\n        case 'search':\n          const { query, limit = 10, threshold = 0.7, options = {} } = params\n          if (!query) throw new Error('Query is required')\n          result = await this.db.search(query, limit, { threshold, ...options })\n          break\n          \n        case 'add':\n          const { data, metadata = {}, addOptions = {} } = params\n          if (!data) throw new Error('Data is required')\n          \n          const enhancedMetadata = {\n            ...metadata,\n            source: 'webrtc',\n            timestamp: new Date().toISOString()\n          }\n          \n          result = {\n            id: await this.db.add(data, enhancedMetadata, addOptions),\n            data,\n            metadata: enhancedMetadata\n          }\n          break\n          \n        case 'get':\n          const { id } = params\n          if (!id) throw new Error('ID is required')\n          result = await this.db.get(id)\n          if (!result) throw new Error(`Entity with ID ${id} not found`)\n          break\n          \n        case 'addVerb':\n          const { sourceId, targetId, verbType, weight, verbMetadata = {}, verbOptions = {} } = params\n          if (!sourceId || !targetId || !verbType) {\n            throw new Error('sourceId, targetId, and verbType are required')\n          }\n          \n          const enhancedVerbMetadata = {\n            ...verbMetadata,\n            source: 'webrtc',\n            timestamp: new Date().toISOString()\n          }\n          \n          result = {\n            id: await this.db.addVerb(sourceId, targetId, verbType, {\n              weight,\n              metadata: enhancedVerbMetadata,\n              ...verbOptions\n            }),\n            sourceId,\n            targetId,\n            verbType,\n            weight,\n            metadata: enhancedVerbMetadata\n          }\n          break\n          \n        default:\n          throw new Error(`Unknown operation: ${operation}`)\n      }\n      \n      return {\n        success: true,\n        data: result,\n        timestamp: new Date().toISOString()\n      }\n      \n    } catch (error) {\n      return {\n        success: false,\n        error: {\n          message: error.message,\n          code: error.code || 'QUERY_ERROR'\n        },\n        timestamp: new Date().toISOString()\n      }\n    }\n  }\n\n  broadcastPeerList() {\n    if (!this.options.enablePeerDiscovery) return\n    \n    const peerList = Array.from(this.peers.keys())\n    \n    this.peers.forEach((ws, peerId) => {\n      this.send(ws, {\n        type: 'peer-list-update',\n        peers: peerList.filter(id => id !== peerId),\n        totalPeers: peerList.length - 1\n      })\n    })\n  }\n\n  broadcastData(data, excludePeer = null) {\n    const message = {\n      type: 'peer-broadcast',\n      data,\n      timestamp: new Date().toISOString()\n    }\n    \n    this.peers.forEach((ws, peerId) => {\n      if (peerId !== excludePeer) {\n        this.send(ws, message)\n      }\n    })\n  }\n\n  send(ws, message) {\n    if (ws.readyState === 1) { // WebSocket.OPEN\n      ws.send(JSON.stringify(message))\n    }\n  }\n\n  generatePeerId() {\n    return `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`\n  }\n\n  // Client-side helper methods (for browser environments)\n  generateClientCode() {\n    return `\n    class BrainyWebRTCClient {\n      constructor(signalingUrl) {\n        this.signalingUrl = signalingUrl\n        this.ws = null\n        this.peerId = null\n        this.peers = new Map()\n        this.dataChannels = new Map()\n      }\n      \n      async connect() {\n        return new Promise((resolve, reject) => {\n          this.ws = new WebSocket(this.signalingUrl)\n          \n          this.ws.onopen = () => {\n            console.log('Connected to Brainy WebRTC signaling server')\n          }\n          \n          this.ws.onmessage = (event) => {\n            const message = JSON.parse(event.data)\n            this.handleSignalingMessage(message)\n            if (message.type === 'init') {\n              this.peerId = message.peerId\n              resolve(message)\n            }\n          }\n          \n          this.ws.onerror = reject\n        })\n      }\n      \n      async connectToPeer(targetPeerId) {\n        const pc = new RTCPeerConnection({\n          iceServers: ${JSON.stringify(this.options.iceServers)}\n        })\n        \n        // Create data channel for Brainy operations\n        const dataChannel = pc.createDataChannel('brainy', {\n          ordered: true\n        })\n        \n        this.setupDataChannel(dataChannel, targetPeerId)\n        this.setupPeerConnection(pc, targetPeerId)\n        \n        // Create and send offer\n        const offer = await pc.createOffer()\n        await pc.setLocalDescription(offer)\n        \n        this.send({\n          type: 'offer',\n          targetPeer: targetPeerId,\n          payload: offer\n        })\n        \n        this.peers.set(targetPeerId, pc)\n        return pc\n      }\n      \n      async search(query, limit = 10, threshold = 0.7) {\n        return this.sendBrainyQuery({\n          operation: 'search',\n          params: { query, limit, threshold }\n        })\n      }\n      \n      async add(data, metadata = {}) {\n        return this.sendBrainyQuery({\n          operation: 'add',\n          params: { data, metadata }\n        })\n      }\n      \n      sendBrainyQuery(payload) {\n        return new Promise((resolve, reject) => {\n          const id = Date.now()\n          const timeoutId = setTimeout(() => {\n            reject(new Error('Query timeout'))\n          }, 10000)\n          \n          const handler = (event) => {\n            const message = JSON.parse(event.data)\n            if (message.type === 'brainy-response') {\n              clearTimeout(timeoutId)\n              this.ws.removeEventListener('message', handler)\n              resolve(message.payload)\n            }\n          }\n          \n          this.ws.addEventListener('message', handler)\n          this.send({\n            type: 'brainy-query',\n            id,\n            payload\n          })\n        })\n      }\n      \n      send(message) {\n        if (this.ws && this.ws.readyState === WebSocket.OPEN) {\n          this.ws.send(JSON.stringify(message))\n        }\n      }\n      \n      // ... additional WebRTC peer connection handling methods\n    }\n    \n    // Usage:\n    // const client = new BrainyWebRTCClient('ws://localhost:${this.options.port}')\n    // await client.connect()\n    // const results = await client.search('machine learning')\n    `\n  }\n\n  async cleanup() {\n    if (this.signalingServer) {\n      this.signalingServer.close()\n    }\n    \n    // Close all peer connections\n    this.peers.forEach((ws) => {\n      ws.close()\n    })\n    this.peers.clear()\n    \n    logger.info('WebRTC augmentation cleaned up')\n  }\n}