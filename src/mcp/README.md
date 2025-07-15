# Model Control Protocol (MCP) for Brainy

This document provides information about the Model Control Protocol (MCP) implementation in Brainy, which allows external models to access Brainy data and use the augmentation pipeline as tools.

## Components

The MCP implementation consists of three main components:

1. **BrainyMCPAdapter**: Provides access to Brainy data through MCP
2. **MCPAugmentationToolset**: Exposes the augmentation pipeline as tools
3. **BrainyMCPService**: Integrates the adapter and toolset, providing WebSocket and REST server implementations for external model access

## Environment Compatibility

### BrainyMCPAdapter

The `BrainyMCPAdapter` has no environment-specific dependencies and can run in any environment where Brainy itself runs, including:

- Browser environments
- Node.js environments
- Server environments

### MCPAugmentationToolset

The `MCPAugmentationToolset` also has no environment-specific dependencies and can run in any environment where Brainy itself runs, including:

- Browser environments
- Node.js environments
- Server environments

### BrainyMCPService

The `BrainyMCPService` has been refactored to separate the core functionality from the Node.js-specific server functionality:

1. **Core Functionality**: The core request handling functionality (`handleMCPRequest`) can run in any environment where Brainy itself runs. This is what remains in the main Brainy package.

2. **Server Functionality**: The WebSocket and REST server functionality is not included in the main Brainy package to keep the browser bundle lightweight and avoid Node.js-specific dependencies. In browser or other environments, you can use the core functionality through the `handleMCPRequest` method.

## Usage

### In Any Environment (Browser, Node.js, Server)

```typescript
import { BrainyData, BrainyMCPAdapter, MCPAugmentationToolset } from '@soulcraft/brainy'

// Create a BrainyData instance
const brainyData = new BrainyData()
await brainyData.init()

// Create an MCP adapter
const adapter = new BrainyMCPAdapter(brainyData)

// Create a toolset
const toolset = new MCPAugmentationToolset()

// Use the adapter to access Brainy data
const response = await adapter.handleRequest({
  type: 'data_access',
  operation: 'search',
  requestId: adapter.generateRequestId(),
  version: '1.0.0',
  parameters: {
    query: 'example query',
    k: 5
  }
})

// Use the toolset to execute augmentation pipeline tools
const toolResponse = await toolset.handleRequest({
  type: 'tool_execution',
  toolName: 'brainy_memory_storeData',
  requestId: toolset.generateRequestId(),
  version: '1.0.0',
  parameters: {
    args: ['key1', { some: 'data' }]
  }
})
```


### In Browser Environment (Core Functionality Only)

```typescript
import { BrainyData, BrainyMCPService } from '@soulcraft/brainy'

// Create a BrainyData instance
const brainyData = new BrainyData()
await brainyData.init()

// Create an MCP service (server functionality will be disabled in browser)
const mcpService = new BrainyMCPService(brainyData)

// Use the core functionality
const response = await mcpService.handleMCPRequest({
  type: 'data_access',
  operation: 'search',
  requestId: mcpService.generateRequestId(),
  version: '1.0.0',
  parameters: {
    query: 'example query',
    k: 5
  }
})
```
