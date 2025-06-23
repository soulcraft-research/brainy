/**
 * BrainyMCPService
 *
 * This class provides a unified service for accessing Brainy data and augmentations
 * through the Model Control Protocol (MCP). It integrates the BrainyMCPAdapter and
 * MCPAugmentationToolset classes and provides WebSocket and REST server implementations
 * for external model access.
 */

import { v4 as uuidv4 } from 'uuid'
import { BrainyDataInterface } from '../types/brainyDataInterface.js'
import {
  MCPRequest,
  MCPResponse,
  MCPDataAccessRequest,
  MCPToolExecutionRequest,
  MCPSystemInfoRequest,
  MCPAuthenticationRequest,
  MCPRequestType,
  MCPServiceOptions,
  MCP_VERSION,
  MCPTool
} from '../types/mcpTypes.js'
import { BrainyMCPAdapter } from './brainyMCPAdapter.js'
import { MCPAugmentationToolset } from './mcpAugmentationToolset.js'
import { isBrowser, isNode } from '../utils/environment.js'

export class BrainyMCPService {
  private dataAdapter: BrainyMCPAdapter
  private toolset: MCPAugmentationToolset
  private options: MCPServiceOptions
  private authTokens: Map<string, { userId: string; expires: number }>
  private rateLimits: Map<string, { count: number; resetTime: number }>

  /**
   * Creates a new BrainyMCPService
   * @param brainyData The BrainyData instance to wrap
   * @param options Configuration options for the service
   */
  constructor(
    brainyData: BrainyDataInterface,
    options: MCPServiceOptions = {}
  ) {
    this.dataAdapter = new BrainyMCPAdapter(brainyData)
    this.toolset = new MCPAugmentationToolset()
    this.options = options
    this.authTokens = new Map()
    this.rateLimits = new Map()
  }

  /**
   * Handles an MCP request
   * @param request The MCP request
   * @returns An MCP response
   */
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.type) {
        case MCPRequestType.DATA_ACCESS:
          return await this.dataAdapter.handleRequest(
            request as MCPDataAccessRequest
          )

        case MCPRequestType.TOOL_EXECUTION:
          return await this.toolset.handleRequest(
            request as MCPToolExecutionRequest
          )

        case MCPRequestType.SYSTEM_INFO:
          return await this.handleSystemInfoRequest(
            request as MCPSystemInfoRequest
          )

        case MCPRequestType.AUTHENTICATION:
          return await this.handleAuthenticationRequest(
            request as MCPAuthenticationRequest
          )

        default:
          return this.createErrorResponse(
            request.requestId,
            'UNSUPPORTED_REQUEST_TYPE',
            `Request type ${request.type} is not supported`
          )
      }
    } catch (error) {
      return this.createErrorResponse(
        request.requestId,
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  /**
   * Handles a system info request
   * @param request The MCP request
   * @returns An MCP response
   */
  private async handleSystemInfoRequest(
    request: MCPSystemInfoRequest
  ): Promise<MCPResponse> {
    try {
      switch (request.infoType) {
        case 'status':
          return this.createSuccessResponse(request.requestId, {
            status: 'active',
            version: MCP_VERSION,
            environment: isBrowser() ? 'browser' : isNode() ? 'node' : 'unknown'
          })

        case 'availableTools':
          const tools: MCPTool[] = await this.toolset.getAvailableTools()
          return this.createSuccessResponse(request.requestId, tools)

        case 'version':
          return this.createSuccessResponse(request.requestId, {
            version: MCP_VERSION
          })

        default:
          return this.createErrorResponse(
            request.requestId,
            'UNSUPPORTED_INFO_TYPE',
            `Info type ${request.infoType} is not supported`
          )
      }
    } catch (error) {
      return this.createErrorResponse(
        request.requestId,
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  /**
   * Handles an authentication request
   * @param request The MCP request
   * @returns An MCP response
   */
  private async handleAuthenticationRequest(
    request: MCPAuthenticationRequest
  ): Promise<MCPResponse> {
    try {
      if (!this.options.enableAuth) {
        return this.createSuccessResponse(request.requestId, {
          authenticated: true,
          message: 'Authentication is not enabled'
        })
      }

      const { credentials } = request

      // Check API key authentication
      if (
        credentials.apiKey &&
        this.options.apiKeys?.includes(credentials.apiKey)
      ) {
        const token = this.generateAuthToken('api-user')
        return this.createSuccessResponse(request.requestId, {
          authenticated: true,
          token
        })
      }

      // Check username/password authentication
      // This is a placeholder - in a real implementation, you would check against a database
      if (
        credentials.username === 'admin' &&
        credentials.password === 'password'
      ) {
        const token = this.generateAuthToken(credentials.username)
        return this.createSuccessResponse(request.requestId, {
          authenticated: true,
          token
        })
      }

      return this.createErrorResponse(
        request.requestId,
        'INVALID_CREDENTIALS',
        'Invalid credentials'
      )
    } catch (error) {
      return this.createErrorResponse(
        request.requestId,
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  /**
   * Checks if a request is valid
   * @param request The request to check
   * @returns Whether the request is valid
   */
  private isValidRequest(request: any): boolean {
    return (
      request &&
      typeof request === 'object' &&
      request.type &&
      request.requestId &&
      request.version
    )
  }

  /**
   * Checks if a request is authenticated
   * @param request The request to check
   * @returns Whether the request is authenticated
   */
  private isAuthenticated(request: MCPRequest): boolean {
    if (!this.options.enableAuth) {
      return true
    }

    return request.authToken ? this.isValidToken(request.authToken) : false
  }

  /**
   * Checks if a token is valid
   * @param token The token to check
   * @returns Whether the token is valid
   */
  private isValidToken(token: string): boolean {
    const tokenInfo = this.authTokens.get(token)
    if (!tokenInfo) {
      return false
    }

    if (tokenInfo.expires < Date.now()) {
      this.authTokens.delete(token)
      return false
    }

    return true
  }

  /**
   * Generates an authentication token
   * @param userId The user ID to associate with the token
   * @returns The generated token
   */
  private generateAuthToken(userId: string): string {
    const token = uuidv4()
    const expires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    this.authTokens.set(token, { userId, expires })

    return token
  }

  /**
   * Checks if a client has exceeded the rate limit
   * @param clientId The client ID to check
   * @returns Whether the client is within the rate limit
   */
  private checkRateLimit(clientId: string): boolean {
    if (!this.options.rateLimit) {
      return true
    }

    const now = Date.now()
    const limit = this.rateLimits.get(clientId)

    if (!limit) {
      this.rateLimits.set(clientId, {
        count: 1,
        resetTime: now + this.options.rateLimit.windowMs
      })
      return true
    }

    if (limit.resetTime < now) {
      limit.count = 1
      limit.resetTime = now + this.options.rateLimit.windowMs
      return true
    }

    if (limit.count >= this.options.rateLimit.maxRequests) {
      return false
    }

    limit.count++
    return true
  }

  /**
   * Creates a success response
   * @param requestId The request ID
   * @param data The response data
   * @returns An MCP response
   */
  private createSuccessResponse(requestId: string, data: any): MCPResponse {
    return {
      success: true,
      requestId,
      version: MCP_VERSION,
      data
    }
  }

  /**
   * Creates an error response
   * @param requestId The request ID
   * @param code The error code
   * @param message The error message
   * @param details Optional error details
   * @returns An MCP response
   */
  private createErrorResponse(
    requestId: string,
    code: string,
    message: string,
    details?: any
  ): MCPResponse {
    return {
      success: false,
      requestId,
      version: MCP_VERSION,
      error: {
        code,
        message,
        details
      }
    }
  }

  /**
   * Creates a new request ID
   * @returns A new UUID
   */
  generateRequestId(): string {
    return uuidv4()
  }

  /**
   * Handles an MCP request directly (for in-process models)
   * @param request The MCP request
   * @returns An MCP response
   */
  async handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
    return await this.handleRequest(request)
  }
}
