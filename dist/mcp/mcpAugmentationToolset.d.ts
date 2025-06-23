/**
 * MCPAugmentationToolset
 *
 * This class exposes the Brainy augmentation pipeline as tools through the Model Control Protocol (MCP).
 * It provides methods for getting available tools and executing tools.
 */
import { MCPResponse, MCPToolExecutionRequest, MCPTool } from '../types/mcpTypes.js';
export declare class MCPAugmentationToolset {
    /**
     * Creates a new MCPAugmentationToolset
     */
    constructor();
    /**
     * Handles an MCP tool execution request
     * @param request The MCP request
     * @returns An MCP response
     */
    handleRequest(request: MCPToolExecutionRequest): Promise<MCPResponse>;
    /**
     * Gets all available tools
     * @returns An array of MCP tools
     */
    getAvailableTools(): Promise<MCPTool[]>;
    /**
     * Creates a tool definition
     * @param type The augmentation type
     * @param augmentationName The augmentation name
     * @param method The method name
     * @returns An MCP tool definition
     */
    private createToolDefinition;
    /**
     * Executes the appropriate pipeline based on the augmentation type
     * @param type The augmentation type
     * @param method The method to execute
     * @param parameters The parameters for the method
     * @returns The result of the pipeline execution
     */
    private executePipeline;
    /**
     * Checks if an augmentation type is valid
     * @param type The augmentation type to check
     * @returns Whether the augmentation type is valid
     */
    private isValidAugmentationType;
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
//# sourceMappingURL=mcpAugmentationToolset.d.ts.map