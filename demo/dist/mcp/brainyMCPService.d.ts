/**
 * BrainyMCPService
 *
 * This class provides a unified service for accessing Brainy data and augmentations
 * through the Model Control Protocol (MCP). It integrates the BrainyMCPAdapter and
 * MCPAugmentationToolset classes and provides WebSocket and REST server implementations
 * for external model access.
 */
import { BrainyDataInterface } from '../types/brainyDataInterface.js';
import { MCPRequest, MCPResponse, MCPServiceOptions } from '../types/mcpTypes.js';
export declare class BrainyMCPService {
    private dataAdapter;
    private toolset;
    private options;
    private authTokens;
    private rateLimits;
    /**
     * Creates a new BrainyMCPService
     * @param brainyData The BrainyData instance to wrap
     * @param options Configuration options for the service
     */
    constructor(brainyData: BrainyDataInterface, options?: MCPServiceOptions);
    /**
     * Handles an MCP request
     * @param request The MCP request
     * @returns An MCP response
     */
    handleRequest(request: MCPRequest): Promise<MCPResponse>;
    /**
     * Handles a system info request
     * @param request The MCP request
     * @returns An MCP response
     */
    private handleSystemInfoRequest;
    /**
     * Handles an authentication request
     * @param request The MCP request
     * @returns An MCP response
     */
    private handleAuthenticationRequest;
    /**
     * Checks if a request is valid
     * @param request The request to check
     * @returns Whether the request is valid
     */
    private isValidRequest;
    /**
     * Checks if a request is authenticated
     * @param request The request to check
     * @returns Whether the request is authenticated
     */
    private isAuthenticated;
    /**
     * Checks if a token is valid
     * @param token The token to check
     * @returns Whether the token is valid
     */
    private isValidToken;
    /**
     * Generates an authentication token
     * @param userId The user ID to associate with the token
     * @returns The generated token
     */
    private generateAuthToken;
    /**
     * Checks if a client has exceeded the rate limit
     * @param clientId The client ID to check
     * @returns Whether the client is within the rate limit
     */
    private checkRateLimit;
    /**
     * Creates a success response
     * @param requestId The request ID
     * @param data The response data
     * @returns An MCP response
     */
    private createSuccessResponse;
    /**
     * Creates an error response
     * @param requestId The request ID
     * @param code The error code
     * @param message The error message
     * @param details Optional error details
     * @returns An MCP response
     */
    private createErrorResponse;
    /**
     * Creates a new request ID
     * @returns A new UUID
     */
    generateRequestId(): string;
    /**
     * Handles an MCP request directly (for in-process models)
     * @param request The MCP request
     * @returns An MCP response
     */
    handleMCPRequest(request: MCPRequest): Promise<MCPResponse>;
}
//# sourceMappingURL=brainyMCPService.d.ts.map