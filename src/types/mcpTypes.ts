/**
 * Model Control Protocol (MCP) Types
 * 
 * This file defines the types and interfaces for the Model Control Protocol (MCP)
 * implementation in Brainy. MCP allows external models to access Brainy data and
 * use the augmentation pipeline as tools.
 */

/**
 * MCP version information
 */
export const MCP_VERSION = '1.0.0'

/**
 * MCP request types
 */
export enum MCPRequestType {
  DATA_ACCESS = 'data_access',
  TOOL_EXECUTION = 'tool_execution',
  SYSTEM_INFO = 'system_info',
  AUTHENTICATION = 'authentication'
}

/**
 * Base interface for all MCP requests
 */
export interface MCPRequest {
  /** The type of request */
  type: MCPRequestType
  /** Request ID for tracking and correlation */
  requestId: string
  /** API version */
  version: string
  /** Authentication token (if required) */
  authToken?: string
}

/**
 * Interface for data access requests
 */
export interface MCPDataAccessRequest extends MCPRequest {
  type: MCPRequestType.DATA_ACCESS
  /** The data access operation to perform */
  operation: 'get' | 'search' | 'add' | 'getRelationships'
  /** Parameters for the operation */
  parameters: Record<string, any>
}

/**
 * Interface for tool execution requests
 */
export interface MCPToolExecutionRequest extends MCPRequest {
  type: MCPRequestType.TOOL_EXECUTION
  /** The name of the tool to execute */
  toolName: string
  /** Parameters for the tool */
  parameters: Record<string, any>
}

/**
 * Interface for system info requests
 */
export interface MCPSystemInfoRequest extends MCPRequest {
  type: MCPRequestType.SYSTEM_INFO
  /** The type of information to retrieve */
  infoType: 'status' | 'availableTools' | 'version'
}

/**
 * Interface for authentication requests
 */
export interface MCPAuthenticationRequest extends MCPRequest {
  type: MCPRequestType.AUTHENTICATION
  /** The authentication credentials */
  credentials: {
    apiKey?: string
    username?: string
    password?: string
  }
}

/**
 * Base interface for all MCP responses
 */
export interface MCPResponse {
  /** Whether the request was successful */
  success: boolean
  /** The request ID from the original request */
  requestId: string
  /** API version */
  version: string
  /** Response data (if successful) */
  data?: any
  /** Error information (if unsuccessful) */
  error?: {
    code: string
    message: string
    details?: any
  }
}

/**
 * Interface for MCP tool definitions
 */
export interface MCPTool {
  /** The name of the tool */
  name: string
  /** A description of what the tool does */
  description: string
  /** The parameters the tool accepts */
  parameters: {
    type: 'object'
    properties: Record<string, {
      type: string
      description: string
      enum?: string[]
      required?: boolean
    }>
    required: string[]
  }
}

/**
 * Configuration options for MCP services
 */
export interface MCPServiceOptions {
  /** Port for the WebSocket server */
  wsPort?: number
  /** Port for the REST server */
  restPort?: number
  /** Whether to enable authentication */
  enableAuth?: boolean
  /** API keys for authentication */
  apiKeys?: string[]
  /** Rate limiting configuration */
  rateLimit?: {
    /** Maximum number of requests per window */
    maxRequests: number
    /** Time window in milliseconds */
    windowMs: number
  }
  /** CORS configuration for REST API */
  cors?: {
    /** Allowed origins */
    origin: string | string[]
    /** Whether to allow credentials */
    credentials: boolean
  }
}
