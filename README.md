# Soulcraft Brainy

A vector database that runs in a browser or Node.js and utilizes Origin Private File System (OPFS) for storage, with HNSW (Hierarchical Navigable Small World) for efficient vector indexing.

## Features

- **Cross-platform**: Works in both browsers and Node.js
- **Persistent storage**: Uses Origin Private File System (OPFS) in browsers, with fallback to in-memory storage
- **Efficient vector search**: Implements HNSW (Hierarchical Navigable Small World) algorithm for fast approximate nearest neighbor search
- **Automatic embedding**: Converts text and other data to vectors using embedding models
- **TensorFlow.js integration**: Uses Universal Sentence Encoder for high-quality text embeddings (TensorFlow.js is included as a dependency)
- **Metadata support**: Store and retrieve metadata alongside vectors
- **TypeScript support**: Fully typed API with generics for metadata types
- **Multiple distance functions**: Supports cosine, Euclidean, Manhattan, and dot product distance metrics
- **Augmentation system**: Extensible architecture for adding specialized capabilities
- **Memory augmentation**: Store and retrieve data in different formats (fileSystem, in-memory, firestore)
- **Graph data model**: Structured representation of entities and relationships

## Installation

```bash
npm install @soulcraft/brainy
```

## Usage

### Basic Example

```typescript
import {BrainyData} from '@soulcraft/brainy';

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

// Use the dedicated text search method for simpler code
const lionResults = await db.searchText("lion", 2);
console.log(lionResults);
// Results will include vectors similar to the embedding of "lion"

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

### Using the Embedding Function

You can directly use the same embedding function that the database uses internally:

```typescript
import {BrainyData} from '@soulcraft/brainy';

// Create a new vector database
const db = new BrainyData();
await db.init();

// Embed a single text string
const catVector = await db.embed("cat");
console.log(catVector);
// [0.123, 0.456, 0.789, ...] - Vector representation of "cat"

// Embed multiple texts at once
const animalVectors = await db.embed(["cat", "dog", "fish"]);
console.log(animalVectors);
// [0.123, 0.456, 0.789, ...] - Vector representation of the first item in the array
```

### Using Embedding Functions

By default, Brainy uses the TensorFlow Universal Sentence Encoder for high-quality text embeddings. The TensorFlow.js dependencies are automatically included when you install the package, so you don't need to install them separately.

You can use the default embedding function directly:

```typescript
import {
  defaultEmbeddingFunction,
  createTensorFlowEmbeddingFunction,
  createSimpleEmbeddingFunction,
  UniversalSentenceEncoder,
  createEmbeddingFunction
} from '@soulcraft/brainy';

// Option 1: Use the default embedding function (TensorFlow Universal Sentence Encoder)
const vector1 = await defaultEmbeddingFunction("Some text to embed");
console.log(vector1);
// [0.123, 0.456, 0.789, ...] - High-quality vector representation using TensorFlow

// Option 2: Explicitly create a TensorFlow-based embedding function
const tfEmbedFunction = createTensorFlowEmbeddingFunction();
const vector2 = await tfEmbedFunction("Some text to embed");
console.log(vector2);
// [0.123, 0.456, 0.789, ...] - High-quality vector representation using TensorFlow

// Option 3: Use the simple character-based embedding (faster but less accurate)
const simpleEmbedFunction = createSimpleEmbeddingFunction();
const vector3 = await simpleEmbedFunction("Some text to embed");
console.log(vector3);
// [0.123, 0.456, 0.789, ...] - Basic vector representation using character frequencies

// Option 4: Create the model and embedding function manually
const useModel = new UniversalSentenceEncoder();
await useModel.init();

// Create an embedding function from the model
const embedFunction = createEmbeddingFunction(useModel);

// Embed text using the function
const vector4 = await embedFunction("Some text to embed");
console.log(vector4);
// [0.123, 0.456, 0.789, ...] - High-quality vector representation using TensorFlow

// Don't forget to dispose of the model when done
await useModel.dispose();
```

You can also configure BrainyData to use a different embedding function if needed:

```typescript
import { BrainyData, createSimpleEmbeddingFunction } from '@soulcraft/brainy';

// Create a new vector database with the simple embedding function
// (only if you prefer speed over accuracy)
const db = new BrainyData({
  embeddingFunction: createSimpleEmbeddingFunction()
});
await db.init();
```

### Configuration Options

```typescript
import {
  BrainyData, 
  euclideanDistance, 
  UniversalSentenceEncoder, 
  createEmbeddingFunction
} from '@soulcraft/brainy';

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
    // import { FileSystemStorage } from '@soulcraft/brainy/storage/fileSystemStorage';
    // storageAdapter: new FileSystemStorage('/custom/path')
});
```

## Publishing and Using as a Private NPM Package

Soulcraft Brainy is configured as a private NPM package with restricted access. This section provides information on how to publish and use it within your organization.

### Versioning

This project uses semantic versioning (SemVer):

- **Major version** (`x.0.0`): Breaking changes that may require updates to dependent code
- **Minor version** (`0.x.0`): New features that don't break existing functionality
- **Patch version** (`0.0.x`): Bug fixes and other minor changes

The package includes scripts for manual version bumping:

```bash
# Increment patch version (0.0.x)
npm run version:patch

# Increment minor version (0.x.0)
npm run version:minor

# Increment major version (x.0.0)
npm run version:major
```

These commands will update the version in package.json and create a git tag for the new version.

### Publishing the Package

To publish updates to the package:

1. Ensure you have the appropriate npm credentials and access to the @soulcraft organization
2. Update the version using one of the version scripts:
   ```bash
   npm run version:patch  # For bug fixes and minor changes
   npm run version:minor  # For new features
   npm run version:major  # For breaking changes
   ```
3. Use the deploy script to build and publish the package:
   ```bash
   npm run deploy
   ```

Alternatively, you can run the steps separately:
1. Build the package:
   ```bash
   npm run build
   ```
2. Publish the package:
   ```bash
   npm publish
   ```

Note that the package has the following configuration in package.json:
```json
"private": false,
"publishConfig": {
  "access": "restricted"
}
```

This ensures that the package is only accessible to users with appropriate permissions within the @soulcraft organization. The `"access": "restricted"` setting limits access to the package to members of the @soulcraft organization, while `"private": false` allows the package to be published to npm.

### Installing the Private Package

To install the package in another project:

1. Ensure you have access to the @soulcraft organization on npm
2. Add the package to your project:
   ```bash
   npm install @soulcraft/brainy
   ```

3. If you're using a private npm registry, you may need to configure npm to use your organization's registry:
   ```bash
   npm config set @soulcraft:registry https://your-private-registry.com/
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

#### Memory Augmentations

For storing data in different formats (e.g., fileSystem, in-memory, or firestore):

```typescript
interface IMemoryAugmentation extends IAugmentation {
  storeData(
    key: string,
    data: unknown,
    options?: Record<string, unknown>
  ): AugmentationResponse<boolean>;
  retrieveData(
    key: string,
    options?: Record<string, unknown>
  ): AugmentationResponse<unknown>;
  updateData(
    key: string,
    data: unknown,
    options?: Record<string, unknown>
  ): AugmentationResponse<boolean>;
  deleteData(
    key: string,
    options?: Record<string, unknown>
  ): AugmentationResponse<boolean>;
  listDataKeys(
    pattern?: string,
    options?: Record<string, unknown>
  ): AugmentationResponse<string[]>;
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

### Augmentation Types

Brainy provides an enum that lists all types of augmentations available in the system:

```typescript
enum AugmentationType {
  SENSE = 'sense',
  CONDUIT = 'conduit',
  COGNITION = 'cognition',
  MEMORY = 'memory',
  PERCEPTION = 'perception',
  DIALOG = 'dialog',
  ACTIVATION = 'activation',
  WEBSOCKET = 'webSocket'
}
```

This enum can be used by consumers of the library to identify the different types of augmentations.

### Augmentation Event Pipeline

Brainy provides an event pipeline that allows registering and executing multiple augmentations of each type. The pipeline supports different execution modes and provides a flexible way to manage augmentations.

#### Using the Pipeline

```typescript
import { augmentationPipeline, ExecutionMode, AugmentationType } from '@soulcraft/brainy';

// Register augmentations
augmentationPipeline.register(mySenseAugmentation);
augmentationPipeline.register(myConduitAugmentation);
augmentationPipeline.register(myCognitionAugmentation);

// Initialize all registered augmentations
await augmentationPipeline.initialize();

// Get all registered augmentations
const allAugmentations = augmentationPipeline.getAllAugmentations();
console.log(`Total augmentations: ${allAugmentations.length}`);

// Get all augmentations of a specific type
const senseAugmentations = augmentationPipeline.getAugmentationsByType(AugmentationType.SENSE);
console.log(`Sense augmentations: ${senseAugmentations.length}`);

// Get all available augmentation types
const availableTypes = augmentationPipeline.getAvailableAugmentationTypes();
console.log(`Available augmentation types: ${availableTypes.join(', ')}`);

// Execute a sense pipeline
const processingResults = await augmentationPipeline.executeSensePipeline(
  'processRawData',
  ['Some raw text data', 'text'],
  { mode: ExecutionMode.SEQUENTIAL, stopOnError: true }
);

// Execute a conduit pipeline
const connectionResults = await augmentationPipeline.executeConduitPipeline(
  'establishConnection',
  ['external-system', { apiKey: 'your-api-key' }]
);

// Execute a cognition pipeline
const reasoningResults = await augmentationPipeline.executeCognitionPipeline(
  'reason',
  ['What is the capital of France?', { additionalContext: 'geography' }],
  { mode: ExecutionMode.PARALLEL }
);

// Execute a memory pipeline
const storeResults = await augmentationPipeline.executeMemoryPipeline(
  'storeData',
  ['user123', { name: 'John Doe', email: 'john@example.com' }]
);

const retrieveResults = await augmentationPipeline.executeMemoryPipeline(
  'retrieveData',
  ['user123']
);

// Shut down all registered augmentations
await augmentationPipeline.shutDown();
```

#### Execution Modes

The pipeline supports several execution modes:

- `ExecutionMode.SEQUENTIAL`: Execute augmentations one after another (default)
- `ExecutionMode.PARALLEL`: Execute all augmentations simultaneously
- `ExecutionMode.FIRST_SUCCESS`: Execute augmentations until one succeeds
- `ExecutionMode.FIRST_RESULT`: Execute augmentations until one returns a result

#### Pipeline Options

You can configure the pipeline execution with options:

```typescript
interface PipelineOptions {
  mode?: ExecutionMode;     // Execution mode (default: SEQUENTIAL)
  timeout?: number;         // Timeout in milliseconds (default: 30000)
  stopOnError?: boolean;    // Whether to stop on error (default: false)
}
```

#### Creating a Custom Pipeline

You can create a custom pipeline instance if needed:

```typescript
import { AugmentationPipeline } from '@soulcraft/brainy';

const myPipeline = new AugmentationPipeline();
myPipeline.register(myCustomAugmentation);
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
- `src/examples/augmentationPipeline.ts`: Demonstrates the augmentation pipeline
- `src/examples/webSocketAugmentation.ts`: Shows how to create WebSocket-supporting augmentations
- `src/examples/memoryAugmentation.ts`: Demonstrates memory augmentations for different storage formats

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
- `searchText(query: string, k?: number): Promise<SearchResult<T>[]>` - Search for similar documents using a text query
- `get(id: string): Promise<VectorDocument<T> | null>` - Get a vector by ID
- `delete(id: string): Promise<boolean>` - Delete a vector
- `updateMetadata(id: string, metadata: T): Promise<boolean>` - Update metadata
- `clear(): Promise<void>` - Clear the database
- `size(): number` - Get the number of vectors in the database
- `embed(data: string | string[]): Promise<Vector>` - Embed text or data into a vector using the same embedding function used by this instance

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
- `createTensorFlowEmbeddingFunction(): EmbeddingFunction` - Create an embedding function using TensorFlow's Universal Sentence Encoder
- `createSimpleEmbeddingFunction(): EmbeddingFunction` - Create a simple character-based embedding function (faster but less accurate)
- `defaultEmbeddingFunction` - Default embedding function using TensorFlow's Universal Sentence Encoder for high-quality embeddings

## Browser Compatibility

The Soulcraft Brainy database works in all modern browsers that support the Origin Private File System API:

- Chrome 86+
- Edge 86+
- Opera 72+
- Chrome for Android 86+

For browsers without OPFS support, the database will automatically fall back to in-memory storage.

## License

MIT
