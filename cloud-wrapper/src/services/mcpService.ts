import { WebSocketServer } from 'ws'
import express from 'express'
import cors from 'cors'
import { BrainyData, BrainyMCPService, MCPRequestType } from '@soulcraft/brainy'
import { v4 as uuidv4 } from 'uuid'

/**
 * Initialize the MCP service with WebSocket and REST API servers
 */
export function initializeMCPService(
  brainy: BrainyData,
  options: {
    wsPort?: number
    restPort?: number
    enableAuth?: boolean
    apiKeys?: string[]
    rateLimit?: {
      windowMs: number
      maxRequests: number
    }
    cors?: any
  }
) {
  // Create the MCP service
  const mcpService = new BrainyMCPService(brainy, options)

  // Start WebSocket server if port is provided
  if (options.wsPort) {
    startWebSocketServer(mcpService, options.wsPort)
  }

  // Start REST server if port is provided
  if (options.restPort) {
    startRESTServer(mcpService, options.restPort, options.cors)
  }

  return mcpService
}

/**
 * Start a WebSocket server for the MCP service
 */
function startWebSocketServer(mcpService: BrainyMCPService, port: number) {
  const wss = new WebSocketServer({ port })

  wss.on('connection', (ws: any) => {
    ws.on('message', async (message: string) => {
      try {
        const request = JSON.parse(message)

        // Handle the request using the MCP service
        const response = await mcpService.handleMCPRequest(request)

        // Send the response
        ws.send(JSON.stringify(response))
      } catch (error) {
        // Send error response
        ws.send(
          JSON.stringify({
            success: false,
            requestId: uuidv4(),
            error: {
              code: 'INTERNAL_ERROR',
              message: error instanceof Error ? error.message : String(error)
            }
          })
        )
      }
    })
  })

  console.log(`MCP WebSocket server started on port ${port}`)

  return wss
}

/**
 * Start a REST server for the MCP service
 */
function startRESTServer(
  mcpService: BrainyMCPService,
  port: number,
  corsOptions?: any
) {
  const app = express()

  // Parse JSON request bodies
  app.use(express.json())

  // Enable CORS if configured
  if (corsOptions) {
    app.use(cors(corsOptions))
  }

  // MCP endpoints
  app.post('/mcp/data', async (req: any, res: any) => {
    try {
      const response = await mcpService.handleMCPRequest({
        ...req.body,
        type: 'DATA_ACCESS'
      })

      res.json(response)
    } catch (error) {
      res.status(500).json({
        success: false,
        requestId: uuidv4(),
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : String(error)
        }
      })
    }
  })

  app.post('/mcp/tools', async (req: any, res: any) => {
    try {
      const response = await mcpService.handleMCPRequest({
        ...req.body,
        type: 'TOOL_EXECUTION'
      })

      res.json(response)
    } catch (error) {
      res.status(500).json({
        success: false,
        requestId: uuidv4(),
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : String(error)
        }
      })
    }
  })

  app.post('/mcp/system', async (req: any, res: any) => {
    try {
      const response = await mcpService.handleMCPRequest({
        ...req.body,
        type: 'SYSTEM_INFO'
      })

      res.json(response)
    } catch (error) {
      res.status(500).json({
        success: false,
        requestId: uuidv4(),
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : String(error)
        }
      })
    }
  })

  app.post('/mcp/auth', async (req: any, res: any) => {
    try {
      const response = await mcpService.handleMCPRequest({
        ...req.body,
        type: 'AUTHENTICATION'
      })

      res.json(response)
    } catch (error) {
      res.status(500).json({
        success: false,
        requestId: uuidv4(),
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : String(error)
        }
      })
    }
  })

  // Get available tools
  app.get('/mcp/tools', async (req: any, res: any) => {
    try {
      const response = await mcpService.handleMCPRequest({
        type: MCPRequestType.SYSTEM_INFO,
        requestId: uuidv4(),
        version: '1.0'
      })

      res.json(response)
    } catch (error) {
      res.status(500).json({
        success: false,
        requestId: uuidv4(),
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : String(error)
        }
      })
    }
  })

  // Start the server
  const server = app.listen(port, () => {
    console.log(`MCP REST API server started on port ${port}`)
  })

  return server
}
