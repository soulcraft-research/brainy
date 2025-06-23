/**
 * Model Control Protocol (MCP) for Brainy
 * 
 * This module provides a Model Control Protocol (MCP) implementation for Brainy,
 * allowing external models to access Brainy data and use the augmentation pipeline as tools.
 */

// Import and re-export the MCP components
import { BrainyMCPAdapter } from './brainyMCPAdapter.js'
import { MCPAugmentationToolset } from './mcpAugmentationToolset.js'
import { BrainyMCPService } from './brainyMCPService.js'

// Export the MCP components
export { BrainyMCPAdapter }
export { MCPAugmentationToolset }
export { BrainyMCPService }

// Export the MCP types
export * from '../types/mcpTypes.js'
