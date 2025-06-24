/**
 * BrainyMCPAdapter
 *
 * This class provides an adapter for accessing Brainy data through the Model Control Protocol (MCP).
 * It wraps a BrainyData instance and exposes methods for getting vectors, searching similar items,
 * and getting relationships.
 */
import { BrainyDataInterface } from '../types/brainyDataInterface.js';
import { MCPResponse, MCPDataAccessRequest } from '../types/mcpTypes.js';
export declare class BrainyMCPAdapter {
    private brainyData;
    /**
     * Creates a new BrainyMCPAdapter
     * @param brainyData The BrainyData instance to wrap
     */
    constructor(brainyData: BrainyDataInterface);
    /**
     * Handles an MCP data access request
     * @param request The MCP request
     * @returns An MCP response
     */
    handleRequest(request: MCPDataAccessRequest): Promise<MCPResponse>;
    /**
     * Handles a get request
     * @param request The MCP request
     * @returns An MCP response
     */
    private handleGetRequest;
    /**
     * Handles a search request
     * @param request The MCP request
     * @returns An MCP response
     */
    private handleSearchRequest;
    /**
     * Handles an add request
     * @param request The MCP request
     * @returns An MCP response
     */
    private handleAddRequest;
    /**
     * Handles a getRelationships request
     * @param request The MCP request
     * @returns An MCP response
     */
    private handleGetRelationshipsRequest;
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
}
//# sourceMappingURL=brainyMCPAdapter.d.ts.map