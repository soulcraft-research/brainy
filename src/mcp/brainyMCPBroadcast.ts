/**
 * BrainyMCPBroadcast
 * 
 * Enhanced MCP service with real-time WebSocket broadcasting capabilities
 * for multi-agent coordination (Jarvis ↔ Picasso communication)
 * 
 * Features:
 * - WebSocket server for real-time push notifications
 * - Subscription management for multiple Claude instances
 * - Message broadcasting to all connected agents
 * - Works both locally and with cloud deployment
 */

import { WebSocketServer, WebSocket } from 'ws'
import { createServer, IncomingMessage } from 'http'
import { BrainyMCPService } from './brainyMCPService.js'
import { BrainyDataInterface } from '../types/brainyDataInterface.js'
import { MCPServiceOptions } from '../types/mcpTypes.js'
import { v4 as uuidv4 } from '../universal/uuid.js'

interface BroadcastMessage {
  id: string
  from: string
  to?: string | string[]
  type: 'message' | 'notification' | 'sync' | 'heartbeat' | 'identify'
  event?: string
  data: any
  timestamp: number
}

interface ConnectedAgent {
  id: string
  name: string
  role: string
  socket: WebSocket
  lastSeen: number
}

export class BrainyMCPBroadcast extends BrainyMCPService {
  private wsServer?: WebSocketServer
  private httpServer?: any
  private agents: Map<string, ConnectedAgent> = new Map()
  private messageHistory: BroadcastMessage[] = []
  private maxHistorySize = 100
  
  constructor(
    brainyData: BrainyDataInterface,
    options: MCPServiceOptions & { 
      broadcastPort?: number
      cloudUrl?: string 
    } = {}
  ) {
    super(brainyData, options)
  }

  /**
   * Start the WebSocket broadcast server
   * @param port Port to listen on (default: 8765)
   * @param isCloud Whether this is a cloud deployment
   */
  async startBroadcastServer(port = 8765, isCloud = false): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create HTTP server
        this.httpServer = createServer((req, res) => {
          // Health check endpoint
          if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ 
              status: 'healthy',
              agents: Array.from(this.agents.values()).map(a => ({
                id: a.id,
                name: a.name,
                role: a.role,
                connected: true
              })),
              uptime: process.uptime()
            }))
          } else {
            res.writeHead(404)
            res.end('Not found')
          }
        })

        // Create WebSocket server
        this.wsServer = new WebSocketServer({ 
          server: this.httpServer,
          perMessageDeflate: false // Better performance
        })

        this.wsServer.on('connection', (socket, request) => {
          this.handleNewConnection(socket, request)
        })

        // Start listening
        this.httpServer.listen(port, () => {
          console.log(`🧠 Brain Jar Broadcast Server running on ${isCloud ? 'cloud' : 'local'} port ${port}`)
          console.log(`📡 WebSocket: ws://localhost:${port}`)
          console.log(`🔍 Health: http://localhost:${port}/health`)
          resolve()
        })

        // Heartbeat to keep connections alive
        setInterval(() => {
          this.agents.forEach((agent) => {
            if (Date.now() - agent.lastSeen > 30000) {
              // Remove inactive agents
              this.removeAgent(agent.id)
            } else {
              // Send heartbeat
              this.sendToAgent(agent.id, {
                id: uuidv4(),
                from: 'server',
                type: 'heartbeat',
                data: { timestamp: Date.now() },
                timestamp: Date.now()
              })
            }
          })
        }, 15000)

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Handle new WebSocket connection
   */
  private handleNewConnection(socket: WebSocket, request: IncomingMessage) {
    const agentId = uuidv4()
    
    // Send welcome message
    socket.send(JSON.stringify({
      id: uuidv4(),
      from: 'server',
      type: 'notification',
      event: 'welcome',
      data: {
        agentId,
        message: 'Connected to Brain Jar Broadcast Server',
        agents: Array.from(this.agents.values()).map(a => ({
          id: a.id,
          name: a.name,
          role: a.role
        }))
      },
      timestamp: Date.now()
    }))

    // Handle messages from this agent
    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        this.handleAgentMessage(agentId, message)
      } catch (error) {
        console.error('Invalid message from agent:', error)
      }
    })

    // Handle disconnection
    socket.on('close', () => {
      this.removeAgent(agentId)
    })

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Agent ${agentId} error:`, error)
    })

    // Store temporary connection until identified
    this.agents.set(agentId, {
      id: agentId,
      name: 'Unknown',
      role: 'Unknown',
      socket,
      lastSeen: Date.now()
    })
  }

  /**
   * Handle message from an agent
   */
  private handleAgentMessage(agentId: string, message: any) {
    const agent = this.agents.get(agentId)
    if (!agent) return

    // Update last seen
    agent.lastSeen = Date.now()

    // Handle identification
    if (message.type === 'identify') {
      agent.name = message.name || agent.name
      agent.role = message.role || agent.role
      
      // Notify all agents about new member
      this.broadcast({
        id: uuidv4(),
        from: 'server',
        type: 'notification',
        event: 'agent_joined',
        data: {
          agent: {
            id: agent.id,
            name: agent.name,
            role: agent.role
          }
        },
        timestamp: Date.now()
      }, agentId) // Exclude the joining agent

      // Send recent history to new agent
      if (this.messageHistory.length > 0) {
        this.sendToAgent(agentId, {
          id: uuidv4(),
          from: 'server',
          type: 'sync',
          data: {
            history: this.messageHistory.slice(-20) // Last 20 messages
          },
          timestamp: Date.now()
        })
      }

      return
    }

    // Create broadcast message
    const broadcastMsg: BroadcastMessage = {
      id: message.id || uuidv4(),
      from: agent.name,
      to: message.to,
      type: message.type || 'message',
      event: message.event,
      data: message.data,
      timestamp: Date.now()
    }

    // Store in history
    this.addToHistory(broadcastMsg)

    // Broadcast based on recipient
    if (message.to) {
      // Send to specific agent(s)
      const recipients = Array.isArray(message.to) ? message.to : [message.to]
      recipients.forEach((recipientName: string) => {
        const recipient = Array.from(this.agents.values()).find(
          a => a.name === recipientName
        )
        if (recipient) {
          this.sendToAgent(recipient.id, broadcastMsg)
        }
      })
    } else {
      // Broadcast to all agents except sender
      this.broadcast(broadcastMsg, agentId)
    }
  }

  /**
   * Broadcast message to all connected agents
   */
  broadcast(message: BroadcastMessage, excludeId?: string) {
    const messageStr = JSON.stringify(message)
    
    this.agents.forEach((agent) => {
      if (agent.id !== excludeId && agent.socket.readyState === WebSocket.OPEN) {
        agent.socket.send(messageStr)
      }
    })
  }

  /**
   * Send message to specific agent
   */
  private sendToAgent(agentId: string, message: BroadcastMessage) {
    const agent = this.agents.get(agentId)
    if (agent && agent.socket.readyState === WebSocket.OPEN) {
      agent.socket.send(JSON.stringify(message))
    }
  }

  /**
   * Remove agent from connected list
   */
  private removeAgent(agentId: string) {
    const agent = this.agents.get(agentId)
    if (agent) {
      // Notify others about disconnection
      this.broadcast({
        id: uuidv4(),
        from: 'server',
        type: 'notification',
        event: 'agent_left',
        data: {
          agent: {
            id: agent.id,
            name: agent.name,
            role: agent.role
          }
        },
        timestamp: Date.now()
      })

      this.agents.delete(agentId)
    }
  }

  /**
   * Add message to history
   */
  private addToHistory(message: BroadcastMessage) {
    this.messageHistory.push(message)
    
    // Trim history if too large
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistorySize)
    }
  }

  /**
   * Stop the broadcast server
   */
  async stopBroadcastServer(): Promise<void> {
    // Close all agent connections
    this.agents.forEach(agent => {
      agent.socket.close(1000, 'Server shutting down')
    })
    this.agents.clear()

    // Close WebSocket server
    if (this.wsServer) {
      this.wsServer.close()
    }

    // Close HTTP server
    if (this.httpServer) {
      this.httpServer.close()
    }
  }

  /**
   * Get connected agents
   */
  getConnectedAgents(): Array<{ id: string; name: string; role: string }> {
    return Array.from(this.agents.values()).map(a => ({
      id: a.id,
      name: a.name,
      role: a.role
    }))
  }

  /**
   * Get message history
   */
  getMessageHistory(): BroadcastMessage[] {
    return [...this.messageHistory]
  }
}

// Export for both environments
export default BrainyMCPBroadcast