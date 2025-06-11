<div align="center">
<img src="../../brainy.png" alt="Brainy Logo" width="200"/>

# Brainy Augmentations
</div>

This directory contains the augmentation implementations for Brainy. Augmentations are pluggable components that extend Brainy's functionality in various ways.

## Available Augmentations

### Conduit Augmentations

Conduit augmentations provide data synchronization between Brainy instances.

#### WebSocketConduitAugmentation

A conduit augmentation that syncs Brainy instances using WebSockets. This is used for syncing between browsers and servers, or between servers.

```javascript
import { createConduitAugmentation, augmentationPipeline } from '@soulcraft/brainy'

// Create a WebSocket conduit augmentation
const wsConduit = await createConduitAugmentation('websocket', 'my-websocket-sync')

// Register the augmentation with the pipeline
augmentationPipeline.register(wsConduit)

// Connect to another Brainy instance
const connectionResult = await wsConduit.establishConnection(
  'wss://your-websocket-server.com/brainy-sync',
  { protocols: 'brainy-sync' }
)
```

#### WebRTCConduitAugmentation

A conduit augmentation that syncs Brainy instances using WebRTC. This is used for direct peer-to-peer syncing between browsers.

```javascript
import { createConduitAugmentation, augmentationPipeline } from '@soulcraft/brainy'

// Create a WebRTC conduit augmentation
const webrtcConduit = await createConduitAugmentation('webrtc', 'my-webrtc-sync')

// Register the augmentation with the pipeline
augmentationPipeline.register(webrtcConduit)

// Connect to a peer
const connectionResult = await webrtcConduit.establishConnection(
  'peer-id-to-connect-to',
  {
    signalServerUrl: 'wss://your-signal-server.com',
    localPeerId: 'my-peer-id',
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  }
)
```

#### ServerSearchConduitAugmentation

A specialized conduit augmentation that provides functionality for searching a server-hosted Brainy instance and storing results locally. This allows you to:

- Search a server-hosted Brainy instance from a browser
- Store the search results in a local Brainy instance
- Perform further searches against the local instance without needing to query the server again
- Add data to both local and server instances

```javascript
import { 
  ServerSearchConduitAugmentation,
  createServerSearchAugmentations,
  augmentationPipeline
} from '@soulcraft/brainy'

// Using the factory function (recommended)
const { conduit, activation, connection } = await createServerSearchAugmentations(
  'wss://your-brainy-server.com/ws',
  { protocols: 'brainy-sync' }
)

// Register the augmentations with the pipeline
augmentationPipeline.register(conduit)
augmentationPipeline.register(activation)

// Search the server and store results locally
const serverSearchResult = await conduit.searchServer(
  connection.connectionId,
  'your search query',
  5 // limit
)

// Search the local instance
const localSearchResult = await conduit.searchLocal('your search query', 5)

// Perform a combined search (local first, then server if needed)
const combinedSearchResult = await conduit.searchCombined(
  connection.connectionId,
  'your search query',
  5
)

// Add data to both local and server
const addResult = await conduit.addToBoth(
  connection.connectionId,
  'Text to add',
  { /* metadata */ }
)
```

### Activation Augmentations

Activation augmentations dictate how Brainy initiates actions, responses, or data manipulations.

#### ServerSearchActivationAugmentation

An activation augmentation that provides actions for server search functionality. This works in conjunction with the ServerSearchConduitAugmentation to provide a complete solution for browser-server search.

```javascript
import { 
  ServerSearchActivationAugmentation,
  createServerSearchAugmentations,
  augmentationPipeline
} from '@soulcraft/brainy'

// Using the factory function (recommended)
const { conduit, activation, connection } = await createServerSearchAugmentations(
  'wss://your-brainy-server.com/ws',
  { protocols: 'brainy-sync' }
)

// Register the augmentations with the pipeline
augmentationPipeline.register(conduit)
augmentationPipeline.register(activation)

// Use the activation augmentation to search the server
const serverSearchAction = activation.triggerAction('searchServer', {
  connectionId: connection.connectionId,
  query: 'your search query',
  limit: 5
})

if (serverSearchAction.success) {
  // The data property contains a promise that will resolve to the search results
  const serverSearchResult = await serverSearchAction.data
  console.log('Server search results:', serverSearchResult)
}

// Other available actions:
// - 'connectToServer': Connect to a server
// - 'searchLocal': Search the local instance
// - 'searchCombined': Search both local and server
// - 'addToBoth': Add data to both local and server
```

## Using the Augmentation Pipeline

The augmentation pipeline provides a way to execute augmentations based on their type.

```javascript
import { augmentationPipeline } from '@soulcraft/brainy'

// Execute a conduit augmentation
const conduitResults = await augmentationPipeline.executeConduitPipeline(
  'methodName',
  [arg1, arg2, ...],
  { /* options */ }
)

// Execute an activation augmentation
const activationResults = await augmentationPipeline.executeActivationPipeline(
  'methodName',
  [arg1, arg2, ...],
  { /* options */ }
)
```

## Creating Custom Augmentations

To create a custom augmentation, implement one of the augmentation interfaces:

- `ISenseAugmentation`: For processing raw data
- `IConduitAugmentation`: For data synchronization
- `ICognitionAugmentation`: For reasoning and inference
- `IMemoryAugmentation`: For data storage
- `IPerceptionAugmentation`: For data interpretation and visualization
- `IDialogAugmentation`: For natural language processing
- `IActivationAugmentation`: For triggering actions

Example:

```javascript
import { AugmentationType, IActivationAugmentation } from '@soulcraft/brainy'

class MyCustomActivation implements IActivationAugmentation {
  readonly name = 'my-custom-activation'
  readonly description = 'My custom activation augmentation'
  enabled = true

  getType(): AugmentationType {
    return AugmentationType.ACTIVATION
  }

  async initialize(): Promise<void> {
    // Initialization code
  }

  async shutDown(): Promise<void> {
    // Cleanup code
  }

  async getStatus(): Promise<'active' | 'inactive' | 'error'> {
    return 'active'
  }

  triggerAction(actionName: string, parameters?: Record<string, unknown>): AugmentationResponse<unknown> {
    // Implementation
  }

  generateOutput(knowledgeId: string, format: string): AugmentationResponse<string | Record<string, unknown>> {
    // Implementation
  }

  interactExternal(systemId: string, payload: Record<string, unknown>): AugmentationResponse<unknown> {
    // Implementation
  }
}
```

## Examples

For complete examples of using augmentations, see the `examples` directory:

- `conduitAugmentationExample.js`: Demonstrates how to use conduit augmentations
- `serverSearchAugmentationExample.js`: Demonstrates how to use server search augmentations
