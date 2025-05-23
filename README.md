# Soulcraft Brainy

A vector database that runs in a browser or Node.js and utilizes Origin Private File System (OPFS) for storage, with HNSW (Hierarchical Navigable Small World) for efficient vector indexing.

## Features

- **Cross-platform**: Works in both browsers and Node.js
- **Persistent storage**: Uses Origin Private File System (OPFS) in browsers, with fallback to in-memory storage
- **Efficient vector search**: Implements HNSW (Hierarchical Navigable Small World) algorithm for fast approximate nearest neighbor search
- **Automatic embedding**: Converts text and other data to vectors using embedding models
- **TensorFlow.js integration**: Uses Universal Sentence Encoder for high-quality text embeddings
- **Metadata support**: Store and retrieve metadata alongside vectors
- **TypeScript support**: Fully typed API with generics for metadata types
- **Multiple distance functions**: Supports cosine, Euclidean, Manhattan, and dot product distance metrics
- **Augmentation system**: Extensible architecture for adding specialized capabilities
- **Graph data model**: Structured representation of entities and relationships

## Installation

```bash
npm install brainy
```

## Usage

### Basic Example

```typescript
import {BrainyData} from 'brainy';

// Create a new vector database
const db = new BrainyData();
await db.init();

// Add vectors with metadata
const catId = await db.add([0.2, 0.3, 0.4, 0.1], {type: 'mammal', name: 'cat'});
const dogId = await db.add([0.3, 0.2, 0.4, 0.2], {type: 'mammal', name: 'dog'});
const fishId = await db.add([0.1, 0.1, 0.8, 0.2], {type: 'fish', name: 'fish'});

// Add text directly - it will be automatically embedded
const lionDescId = await db.add("Lions are large cats with a golden mane", {type: 'mammal', name: 'lion'});
const tigerDescId = await db.add("Tigers are large cats with striped fur", {type: 'mammal', name: 'tiger'});

// Search for similar vectors
const results = await db.search([0.2, 0.3, 0.4, 0.1], 2);
console.log(results);
// [
//   { id: 'cat-id', score: 0, vector: [0.2, 0.3, 0.4, 0.1], metadata: { type: 'mammal', name: 'cat' } },
//   { id: 'dog-id', score: 0.1, vector: [0.3, 0.2, 0.4, 0.2], metadata: { type: 'mammal', name: 'dog' } }
// ]

// Search with text directly - it will be automatically embedded
const catResults = await db.search("cat", 2);
console.log(catResults);
// Results will include vectors similar to the embedding of "cat"

// Get a vector by ID
const cat = await db.get(catId);
console.log(cat);
// { id: 'cat-id', vector: [0.2, 0.3, 0.4, 0.1], metadata: { type: 'mammal', name: 'cat' } }

// Update metadata
await db.updateMetadata(catId, {type: 'mammal', name: 'cat', color: 'orange'});

// Delete a vector
await db.delete(fishId);

// Clear the database
await db.clear();
```

### Configuration Options

```typescript
import {
  BrainyData, 
  euclideanDistance, 
  UniversalSentenceEncoder, 
  createEmbeddingFunction
} from 'brainy';

// Configure the vector database
const db = new BrainyData({
    // HNSW index configuration
    hnsw: {
        M: 16,              // Max number of connections per node
        efConstruction: 200, // Size of dynamic candidate list during construction
        efSearch: 50,       // Size of dynamic candidate list during search
        ml: 16              // Max level
    },

    // Distance function to use (default is cosineDistance)
    distanceFunction: euclideanDistance,

    // Custom embedding function (optional)
    // By default, it uses the Universal Sentence Encoder for high-quality text embeddings
    // You can use the SimpleEmbedding for a basic character-based embedding:
    // embeddingFunction: createEmbeddingFunction(new SimpleEmbedding()),

    // Or create your own custom embedding function:
    // embeddingFunction: async (data) => {
    //   // Convert data to a vector
    //   return [0.1, 0.2, 0.3, 0.4]; // Return a vector
    // },

    // Custom storage adapter (optional)
    // By default, it uses OPFS in browsers, FileSystemStorage in Node.js,
    // or falls back to in-memory storage if neither is available
    // storageAdapter: myCustomStorageAdapter

    // You can also explicitly use the FileSystemStorage with a custom directory:
    // import { FileSystemStorage } from 'brainy/storage/fileSystemStorage';
    // storageAdapter: new FileSystemStorage('/custom/path')
});
```

## Contributing and Publishing

Soulcraft Brainy is an open source project released under the MIT license. Contributions are welcome!

### Contributing to the Project

To contribute to the project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests to ensure everything works:
   ```bash
   npm test
   ```
5. Submit a pull request

### Publishing a New Version

To publish a new version to npm:

1. Update the version in package.json following semantic versioning
2. Build the package:
   ```bash
   npm run build
   ```
3. Publish the package:
   ```bash
   npm publish
   ```

### Installing the Package

To install the package in your project:

```bash
npm install brainy
```

### Requirements

- Node.js >= 18.0.0

## Augmentation System

Brainy includes a powerful augmentation system that allows extending its capabilities through specialized modules. Each augmentation implements a specific interface and provides additional functionality.

### Base Augmentation Interface

All augmentations implement the `IAugmentation` interface:

```typescript
interface IAugmentation {
  readonly name: string;          // Unique identifier for the augmentation
  readonly description: string;   // Human-readable description
  initialize(): Promise<void>;    // Called when Brainy starts up
  shutDown(): Promise<void>;      // Called when shutting down
  getStatus(): Promise<'active' | 'inactive' | 'error'>;  // Current status
}
```

### WebSocket Support

Augmentations can optionally implement WebSocket support:

```typescript
interface IWebSocketSupport {
  connectWebSocket(url: string, protocols?: string | string[]): Promise<WebSocketConnection>;
  sendWebSocketMessage(connectionId: string, data: unknown): Promise<void>;
  onWebSocketMessage(connectionId: string, callback: DataCallback<unknown>): Promise<void>;
  closeWebSocket(connectionId: string, code?: number, reason?: string): Promise<void>;
}
```

### Specialized Augmentation Types

Brainy supports several specialized augmentation types:

#### Cognition Augmentations

For reasoning, inference, and logical operations:

```typescript
interface ICognitionAugmentation extends IAugmentation {
  reason(query: string, context?: Record<string, unknown>): AugmentationResponse<{
    inference: string;
    confidence: number;
  }>;
  infer(dataSubset: Record<string, unknown>): AugmentationResponse<Record<string, unknown>>;
  executeLogic(ruleId: string, input: Record<string, unknown>): AugmentationResponse<boolean>;
}
```

#### Sense Augmentations

For processing raw, unstructured data:

```typescript
interface ISenseAugmentation extends IAugmentation {
  processRawData(rawData: Buffer | string, dataType: string): AugmentationResponse<{
    nouns: string[];
    verbs: string[];
  }>;
  listenToFeed(
    feedUrl: string,
    callback: DataCallback<{ nouns: string[]; verbs: string[] }>
  ): Promise<void>;
}
```

#### Perception Augmentations

For interpreting and contextualizing data:

```typescript
interface IPerceptionAugmentation extends IAugmentation {
  interpret(
    nouns: string[],
    verbs: string[],
    context?: Record<string, unknown>
  ): AugmentationResponse<Record<string, unknown>>;
  organize(
    data: Record<string, unknown>,
    criteria?: Record<string, unknown>
  ): AugmentationResponse<Record<string, unknown>>;
  generateVisualization(
    data: Record<string, unknown>,
    visualizationType: string
  ): AugmentationResponse<string | Buffer | Record<string, unknown>>;
}
```

#### Activation Augmentations

For triggering actions and generating outputs:

```typescript
interface IActivationAugmentation extends IAugmentation {
  triggerAction(
    actionName: string,
    parameters?: Record<string, unknown>
  ): AugmentationResponse<unknown>;
  generateOutput(knowledgeId: string, format: string): AugmentationResponse<string | Record<string, unknown>>;
  interactExternal(systemId: string, payload: Record<string, unknown>): AugmentationResponse<unknown>;
}
```

#### Dialog Augmentations

For natural language understanding and generation:

```typescript
interface IDialogAugmentation extends IAugmentation {
  processUserInput(naturalLanguageQuery: string, sessionId?: string): AugmentationResponse<{
    intent: string;
    nouns: string[];
    verbs: string[];
    context: Record<string, unknown>;
  }>;
  generateResponse(
    interpretedInput: Record<string, unknown>,
    knowledgeContext: Record<string, unknown>,
    sessionId?: string
  ): AugmentationResponse<string>;
  manageContext(sessionId: string, contextUpdate: Record<string, unknown>): Promise<void>;
}
```

#### Conduit Augmentations

For establishing data exchange channels:

```typescript
interface IConduitAugmentation extends IAugmentation {
  establishConnection(
    targetSystemId: string,
    config: Record<string, unknown>
  ): AugmentationResponse<WebSocketConnection>;
  readData(
    query: Record<string, unknown>,
    options?: Record<string, unknown>
  ): AugmentationResponse<unknown>;
  writeData(
    data: Record<string, unknown>,
    options?: Record<string, unknown>
  ): AugmentationResponse<unknown>;
  monitorStream(streamId: string, callback: DataCallback<unknown>): Promise<void>;
}
```

## Graph Data Model

Brainy uses a graph-based data model to represent entities and relationships. This model consists of nouns (nodes) and verbs (edges).

### Common Types

#### Timestamp

Used for tracking creation and update times:

```typescript
interface Timestamp {
  seconds: number;
  nanoseconds: number;
}
```

#### CreatorMetadata

Tracks which augmentation and model created an element:

```typescript
interface CreatorMetadata {
  augmentation: string;    // Name of the augmentation that created this element
  version: string;         // Version of the augmentation
  model: string;           // Model identifier used in creation
  modelVersion: string;    // Version of the model
}
```

### Graph Elements

#### GraphNoun

Base interface for nodes (entities) in the graph:

```typescript
interface GraphNoun {
  id: string;                      // Unique identifier for the noun
  createdBy: CreatorMetadata;      // Information about what created this noun
  noun: NounType;                  // Type classification of the noun
  createdAt: Timestamp;            // When the noun was created
  updatedAt: Timestamp;            // When the noun was last updated
  data?: Record<string, unknown>;  // Additional flexible data storage
  embedding?: number[];            // Vector representation of the noun
}
```

#### GraphVerb

Base interface for edges (relationships) in the graph:

```typescript
interface GraphVerb {
  id: string;                      // Unique identifier for the verb
  source: string;                  // ID of the source noun
  target: string;                  // ID of the target noun
  label?: string;                  // Optional descriptive label
  verb: VerbType;                  // Type of relationship
  createdAt: Timestamp;            // When the verb was created
  updatedAt: Timestamp;            // When the verb was last updated
  data?: Record<string, unknown>;  // Additional flexible data storage
  embedding?: number[];            // Vector representation of the relationship
  confidence?: number;             // Confidence score (0-1)
  weight?: number;                 // Strength/importance of the relationship
}
```

### Noun Types

Brainy supports the following noun types:

- **Person**: Represents a person entity
- **Place**: Represents a physical location
- **Thing**: Represents a physical or virtual object
- **Event**: Represents an event or occurrence
- **Concept**: Represents an abstract concept or idea
- **Content**: Represents content (text, media, etc.)

### Verb Types

Brainy supports the following verb types:

- **AttributedTo**: Indicates attribution or authorship
- **Controls**: Indicates control or ownership
- **Created**: Indicates creation or authorship
- **Earned**: Indicates achievement or acquisition
- **Owns**: Indicates ownership

## Examples

The repository includes several examples to help you get started:

### Modern UI Demo

A complete web application that demonstrates all the features of Soulcraft Brainy with a modern user interface:

- Initialize the database with different distance functions
- Configure HNSW parameters
- Add sample vectors and custom vectors with metadata
- Search for similar vectors
- Get, update, and delete vectors
- View database size and clear the database

To run the Modern UI Demo:

1. Clone the repository
2. Build the project with `npm run build`
3. Open `examples/demo.html` in a browser

### Node.js Examples

The repository also includes TypeScript examples for Node.js:

- `src/examples/basicUsage.ts`: Demonstrates basic vector operations
- `src/examples/customStorage.ts`: Shows how to use a custom storage adapter

## How It Works

### HNSW Indexing

The Hierarchical Navigable Small World (HNSW) algorithm is used for efficient approximate nearest neighbor search. It creates a multi-layered graph structure that allows for logarithmic-time search complexity.

Key features of the HNSW implementation:

- Hierarchical graph structure for efficient navigation
- Configurable parameters for tuning performance vs. accuracy
- Support for different distance metrics

### Origin Private File System (OPFS) Storage

In browser environments, the database uses the Origin Private File System (OPFS) API for persistent storage. This provides:

- Fast, local storage that persists between sessions
- Isolation from other origins for security
- Efficient file operations

In Node.js environments, the database uses a file system-based storage adapter that stores data in JSON files. This provides:

- Persistent storage between application restarts
- Efficient file operations using Node.js fs module
- Configurable storage location

In environments where neither OPFS nor Node.js file system is available, the database automatically falls back to in-memory storage.

## API Reference

### BrainyData

The main class for interacting with the vector database.

#### Constructor

```typescript
constructor(config?: BrainyDataConfig)
```

#### Methods

- `init(): Promise<void>` - Initialize the database
- `add(vectorOrData: Vector | any, metadata?: T, options?: { forceEmbed?: boolean }): Promise<string>` - Add a vector or data to the database
- `addBatch(items: Array<{ vectorOrData: Vector | any, metadata?: T }>, options?: { forceEmbed?: boolean }): Promise<string[]>` - Add multiple vectors or data items
- `search(queryVectorOrData: Vector | any, k?: number, options?: { forceEmbed?: boolean }): Promise<SearchResult<T>[]>` - Search for similar vectors
- `get(id: string): Promise<VectorDocument<T> | null>` - Get a vector by ID
- `delete(id: string): Promise<boolean>` - Delete a vector
- `updateMetadata(id: string, metadata: T): Promise<boolean>` - Update metadata
- `clear(): Promise<void>` - Clear the database
- `size(): number` - Get the number of vectors in the database

### Distance Functions

- `euclideanDistance(a: Vector, b: Vector): number` - Euclidean (L2) distance
- `cosineDistance(a: Vector, b: Vector): number` - Cosine distance
- `manhattanDistance(a: Vector, b: Vector): number` - Manhattan (L1) distance
- `dotProductDistance(a: Vector, b: Vector): number` - Dot product distance

### Embedding Models

- `SimpleEmbedding` - A simple character-based embedding model for text
- `UniversalSentenceEncoder` - TensorFlow Universal Sentence Encoder for high-quality text embeddings

### Embedding Functions

- `createEmbeddingFunction(model: EmbeddingModel): EmbeddingFunction` - Create an embedding function from an embedding model
- `defaultEmbeddingFunction` - Default embedding function using UniversalSentenceEncoder

## Browser Compatibility

The Soulcraft Brainy database works in all modern browsers that support the Origin Private File System API:

- Chrome 86+
- Edge 86+
- Opera 72+
- Chrome for Android 86+

For browsers without OPFS support, the database will automatically fall back to in-memory storage.

## License

MIT
