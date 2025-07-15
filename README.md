<div align="center">
<img src="./brainy.png" alt="Brainy Logo" width="200"/>
<br/><br/>

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24.4.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![npm](https://img.shields.io/badge/npm-v0.11.0-blue.svg)](https://www.npmjs.com/package/@soulcraft/brainy)

[//]: # ([![Cartographer]&#40;https://img.shields.io/badge/Cartographer-Official%20Standard-brightgreen&#41;]&#40;https://github.com/sodal-project/cartographer&#41;)

**A powerful graph & vector data platform for AI applications across any environment**

</div>

## ✨ Overview

Brainy combines the power of vector search with graph relationships in a lightweight, cross-platform database. Whether
you're building AI applications, recommendation systems, or knowledge graphs, Brainy provides the tools you need to
store, connect, and retrieve your data intelligently.

What makes Brainy special? It intelligently adapts to your environment! Brainy automatically detects your platform,
adjusts its storage strategy, and optimizes performance based on your usage patterns. The more you use it, the smarter
it gets - learning from your data to provide increasingly relevant results and connections.

### 🚀 Key Features

- **Run Everywhere** - Works in browsers, Node.js, serverless functions, and containers
- **Vector Search** - Find semantically similar content using embeddings
- **Graph Relationships** - Connect data with meaningful relationships
- **Streaming Pipeline** - Process data in real-time as it flows through the system
- **Extensible Augmentations** - Customize and extend functionality with pluggable components
- **Built-in Conduits** - Sync and scale across instances with WebSocket and WebRTC
- **TensorFlow Integration** - Use TensorFlow.js for high-quality embeddings
- **Adaptive Intelligence** - Automatically optimizes for your environment and usage patterns
- **Persistent Storage** - Data persists across sessions and scales to any size
- **TypeScript Support** - Fully typed API with generics
- **CLI Tools** - Powerful command-line interface for data management
- **Model Control Protocol (MCP)** - Allow external AI models to access Brainy data and use augmentation pipeline as
  tools

## 🚀 Live Demo

**[Try the live demo](https://soulcraft-research.github.io/brainy/demo/index.html)** - Check out the interactive demo on
GitHub Pages that showcases Brainy's main features.

## 📊 What Can You Build?

- **Semantic Search Engines** - Find content based on meaning, not just keywords
- **Recommendation Systems** - Suggest similar items based on vector similarity
- **Knowledge Graphs** - Build connected data structures with relationships
- **AI Applications** - Store and retrieve embeddings for machine learning models
- **AI-Enhanced Applications** - Build applications that leverage vector embeddings for intelligent data processing
- **Data Organization Tools** - Automatically categorize and connect related information
- **Adaptive Experiences** - Create applications that learn and evolve with your users
- **Model-Integrated Systems** - Connect external AI models to Brainy data and tools using MCP

## 🔧 Installation

```bash
npm install @soulcraft/brainy
```

TensorFlow.js packages are included as required dependencies and will be automatically installed. If you encounter
dependency conflicts, you may need to use the `--legacy-peer-deps` flag:

```bash
npm install @soulcraft/brainy --legacy-peer-deps
```

## 🏁 Quick Start

Brainy uses a unified build that automatically adapts to your environment (Node.js, browser, or serverless):

```typescript
import { BrainyData, NounType, VerbType } from '@soulcraft/brainy'

// Create and initialize the database
const db = new BrainyData()
await db.init()

// Add data (automatically converted to vectors)
const catId = await db.add("Cats are independent pets", {
  noun: NounType.Thing,
  category: 'animal'
})

const dogId = await db.add("Dogs are loyal companions", {
  noun: NounType.Thing,
  category: 'animal'
})

// Search for similar items
const results = await db.searchText("feline pets", 2)
console.log(results)

// Add a relationship between items
await db.addVerb(catId, dogId, {
  verb: VerbType.RelatedTo,
  description: 'Both are common household pets'
})
```

### Import Options

```typescript
// Standard import - automatically adapts to any environment
import { BrainyData } from '@soulcraft/brainy'

// Minified version for production
import { BrainyData } from '@soulcraft/brainy/min'

// CLI functionality (only imported when needed)
import '@soulcraft/brainy/cli'
```

> **Note**: The CLI functionality (4MB) is not included in the standard import, reducing the bundle size for browser and
> Node.js applications. The CLI is only built and loaded when explicitly imported or when using the command-line
> interface.

### Browser Usage

```html

<script type="module">
  // Use local files instead of CDN
  import { BrainyData } from './dist/unified.js'

  // Or minified version
  // import { BrainyData } from './dist/unified.min.js'

  const db = new BrainyData()
  await db.init()
  // ...
</script>
```

Modern bundlers like Webpack, Rollup, and Vite will automatically use the unified build which adapts to any environment.

## 🧩 How It Works

Brainy combines four key technologies to create its adaptive intelligence:

1. **Vector Embeddings** - Converts data (text, images, etc.) into numerical vectors that capture semantic meaning
2. **HNSW Algorithm** - Enables fast similarity search through a hierarchical graph structure
3. **Adaptive Environment Detection** - Automatically senses your platform and optimizes accordingly:
    - Detects browser, Node.js, and serverless environments
    - Adjusts performance parameters based on available resources
    - Learns from query patterns to optimize future searches
    - Tunes itself for your specific use cases
4. **Intelligent Storage Selection** - Uses the best available storage option for your environment:
    - Browser: Origin Private File System (OPFS)
    - Node.js: File system
    - Server: S3-compatible storage (optional)
    - Serverless: In-memory storage with optional cloud persistence
    - Fallback: In-memory storage
    - Automatically migrates between storage types as needed

## 🚀 The Brainy Pipeline

Brainy's data processing pipeline transforms raw data into searchable, connected knowledge that gets smarter over time:

```
Raw Data → Embedding → Vector Storage → Graph Connections → Adaptive Learning → Query & Retrieval
```

Each time data flows through this pipeline, Brainy learns more about your usage patterns and environment, making future
operations faster and more relevant.

### Pipeline Stages

1. **Data Ingestion**
    - Raw text or pre-computed vectors enter the pipeline
    - Data is validated and prepared for processing

2. **Embedding Generation**
    - Text is transformed into numerical vectors using embedding models
    - Uses TensorFlow Universal Sentence Encoder for high-quality text embeddings
    - Custom embedding functions can be plugged in for specialized domains

3. **Vector Indexing**
    - Vectors are indexed using the HNSW algorithm
    - Hierarchical structure enables fast similarity search
    - Configurable parameters for precision vs. performance tradeoffs

4. **Graph Construction**
    - Nouns (entities) become nodes in the knowledge graph
    - Verbs (relationships) connect related entities
    - Typed relationships add semantic meaning to connections

5. **Adaptive Learning**
    - Analyzes usage patterns to optimize future operations
    - Tunes performance parameters based on your environment
    - Adjusts search strategies based on query history
    - Becomes more efficient and relevant the more you use it

6. **Intelligent Storage**
    - Data is saved using the optimal storage for your environment
    - Automatic selection between OPFS, filesystem, S3, or memory
    - Migrates between storage types as your application's needs evolve
    - Scales from tiny datasets to massive data collections
    - Configurable storage adapters for custom persistence needs

### Augmentation Types

Brainy uses a powerful augmentation system to extend functionality. Augmentations are processed in the following order:

1. **SENSE**
    - Ingests and processes raw, unstructured data into nouns and verbs
    - Handles text, images, audio streams, and other input formats
    - Example: Converting raw text into structured entities

2. **MEMORY**
    - Provides storage capabilities for data in different formats
    - Manages persistence across sessions
    - Example: Storing vectors in OPFS or filesystem

3. **COGNITION**
    - Enables advanced reasoning, inference, and logical operations
    - Analyzes relationships between entities
    - Examples:
        - Inferring new connections between existing data
        - Deriving insights from graph relationships

4. **CONDUIT**
    - Establishes channels for structured data exchange
    - Connects with external systems and syncs between Brainy instances
    - Two built-in iConduit augmentations for scaling out and syncing:
        - **WebSocket iConduit** - Syncs data between browsers and servers
        - **WebRTC iConduit** - Direct peer-to-peer syncing between browsers
    - Examples:
        - Integrating with third-party APIs
        - Syncing Brainy instances between browsers using WebSockets
        - Peer-to-peer syncing between browsers using WebRTC

5. **ACTIVATION**
    - Initiates actions, responses, or data manipulations
    - Triggers events based on data changes
    - Example: Sending notifications when new data is processed

6. **PERCEPTION**
    - Interprets, contextualizes, and visualizes identified nouns and verbs
    - Creates meaningful representations of data
    - Example: Generating visualizations of graph relationships

7. **DIALOG**
    - Facilitates natural language understanding and generation
    - Enables conversational interactions
    - Example: Processing user queries and generating responses

8. **WEBSOCKET**
    - Enables real-time communication via WebSockets
    - Can be combined with other augmentation types
    - Example: Streaming data processing in real-time

### Streaming Data Support

Brainy's pipeline is designed to handle streaming data efficiently:

1. **WebSocket Integration**
    - Built-in support for WebSocket connections
    - Process data as it arrives without blocking
    - Example: `setupWebSocketPipeline(url, dataType, options)`

2. **Asynchronous Processing**
    - Non-blocking architecture for real-time data handling
    - Parallel processing of incoming streams
    - Example: `createWebSocketHandler(connection, dataType, options)`

3. **Event-Based Architecture**
    - Augmentations can listen to data feeds and streams
    - Real-time updates propagate through the pipeline
    - Example: `listenToFeed(feedUrl, callback)`

4. **Threaded Execution**
    - Comprehensive multi-threading for high-performance operations
    - Parallel processing for batch operations, vector calculations, and embedding generation
    - Configurable execution modes (SEQUENTIAL, PARALLEL, THREADED)
    - Automatic thread management based on environment capabilities
    - Example: `executeTypedPipeline(augmentations, method, args, { mode: ExecutionMode.THREADED })`

### Running the Pipeline

The pipeline runs automatically when you:

```typescript
// Add data (runs embedding → indexing → storage)
const id = await db.add("Your text data here", { metadata })

// Search (runs embedding → similarity search)
const results = await db.searchText("Your query here", 5)

// Connect entities (runs graph construction → storage)
await db.addVerb(sourceId, targetId, { verb: VerbType.RelatedTo })
```

Using the CLI:

```bash
# Add data through the CLI pipeline
brainy add "Your text data here" '{"noun":"Thing"}'

# Search through the CLI pipeline
brainy search "Your query here" --limit 5

# Connect entities through the CLI
brainy addVerb <sourceId> <targetId> RelatedTo
```

### Extending the Pipeline

Brainy's pipeline is designed for extensibility at every stage:

1. **Custom Embedding**
   ```typescript
   // Create your own embedding function
   const myEmbedder = async (text) => {
     // Your custom embedding logic here
     return [0.1, 0.2, 0.3, ...] // Return a vector
   }

   // Use it in Brainy
   const db = new BrainyData({
     embeddingFunction: myEmbedder
   })
   ```

2. **Custom Distance Functions**
   ```typescript
   // Define your own distance function
   const myDistance = (a, b) => {
     // Your custom distance calculation
     return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0))
   }

   // Use it in Brainy
   const db = new BrainyData({
     distanceFunction: myDistance
   })
   ```

3. **Custom Storage Adapters**
   ```typescript
   // Implement the StorageAdapter interface
   class MyStorage implements StorageAdapter {
     // Your storage implementation
   }

   // Use it in Brainy
   const db = new BrainyData({
     storageAdapter: new MyStorage()
   })
   ```

4. **Augmentations System**
   ```typescript
   // Create custom augmentations to extend functionality
   const myAugmentation = {
     type: 'memory',
     name: 'my-custom-storage',
     // Implementation details
   }

   // Register with Brainy
   db.registerAugmentation(myAugmentation)
   ```

## Data Model

Brainy uses a graph-based data model with two primary concepts:

### Nouns (Entities)

The main entities in your data (nodes in the graph):

- Each noun has a unique ID, vector representation, and metadata
- Nouns can be categorized by type (Person, Place, Thing, Event, Concept, etc.)
- Nouns are automatically vectorized for similarity search

### Verbs (Relationships)

Connections between nouns (edges in the graph):

- Each verb connects a source noun to a target noun
- Verbs have types that define the relationship (RelatedTo, Controls, Contains, etc.)
- Verbs can have their own metadata to describe the relationship

## Command Line Interface

Brainy includes a powerful CLI for managing your data. The CLI is available as a separate package
`@soulcraft/brainy-cli` to reduce the bundle size of the main package.

### Installing and Using the CLI

```bash
# Install the CLI globally
npm install -g @soulcraft/brainy-cli

# Initialize a database
brainy init

# Add some data
brainy add "Cats are independent pets" '{"noun":"Thing","category":"animal"}'
brainy add "Dogs are loyal companions" '{"noun":"Thing","category":"animal"}'

# Search for similar items
brainy search "feline pets" 5

# Add relationships between items
brainy addVerb <sourceId> <targetId> RelatedTo '{"description":"Both are pets"}'

# Visualize the graph structure
brainy visualize
brainy visualize --root <id> --depth 3
```

### Using the CLI in Your Code

If you need to use the CLI functionality in your code, you can import it explicitly:

```typescript
// Import the CLI functionality
import '@soulcraft/brainy/cli'

// Now you can use the CLI programmatically
// ...
```

This will only build and load the CLI when you explicitly import it, keeping your bundle size small when you don't need
the CLI.

### Available Commands

#### Basic Database Operations:

- `init` - Initialize a new database
- `add <text> [metadata]` - Add a new noun with text and optional metadata
- `search <query> [limit]` - Search for nouns similar to the query
- `get <id>` - Get a noun by ID
- `delete <id>` - Delete a noun by ID
- `addVerb <sourceId> <targetId> <verbType> [metadata]` - Add a relationship
- `getVerbs <id>` - Get all relationships for a noun
- `status` - Show database status
- `clear` - Clear all data from the database
- `generate-random-graph` - Generate test data
- `visualize` - Visualize the graph structure
- `completion-setup` - Setup shell autocomplete

#### Pipeline and Augmentation Commands:

- `list-augmentations` - List all available augmentation types and registered augmentations
- `augmentation-info <type>` - Get detailed information about a specific augmentation type
- `test-pipeline [text]` - Test the sequential pipeline with sample data
    - `-t, --data-type <type>` - Type of data to process (default: 'text')
    - `-m, --mode <mode>` - Execution mode: sequential, parallel, threaded (default: 'sequential')
    - `-s, --stop-on-error` - Stop execution if an error occurs
    - `-v, --verbose` - Show detailed output
- `stream-test` - Test streaming data through the pipeline (simulated)
    - `-c, --count <number>` - Number of data items to stream (default: 5)
    - `-i, --interval <ms>` - Interval between data items in milliseconds (default: 1000)
    - `-t, --data-type <type>` - Type of data to process (default: 'text')
    - `-v, --verbose` - Show detailed output

## API Reference

### Database Management

```typescript
// Initialize the database
await db.init()

// Clear all data
await db.clear()

// Get database status
const status = await db.status()

// Backup all data from the database
const backupData = await db.backup()

// Restore data into the database
const restoreResult = await db.restore(backupData, { clearExisting: true })
```

### Working with Nouns (Entities)

```typescript
// Add a noun (automatically vectorized)
const id = await db.add(textOrVector, {
  noun: NounType.Thing,
  // other metadata...
})

// Add multiple nouns in parallel (with multithreading and batch embedding)
const ids = await db.addBatch([
  {
    vectorOrData: "First item to add",
    metadata: { noun: NounType.Thing, category: 'example' }
  },
  {
    vectorOrData: "Second item to add",
    metadata: { noun: NounType.Thing, category: 'example' }
  },
  // More items...
], {
  forceEmbed: false,
  concurrency: 4, // Control the level of parallelism (default: 4)
  batchSize: 50   // Control the number of items to process in a single batch (default: 50)
})

// Retrieve a noun
const noun = await db.get(id)

// Update noun metadata
await db.updateMetadata(id, {
  noun: NounType.Thing,
  // updated metadata...
})

// Delete a noun
await db.delete(id)

// Search for similar nouns
const results = await db.search(vectorOrText, numResults)
const textResults = await db.searchText("query text", numResults)

// Search by noun type
const thingNouns = await db.searchByNounTypes([NounType.Thing], numResults)
```

### Working with Verbs (Relationships)

```typescript
// Add a relationship between nouns
await db.addVerb(sourceId, targetId, {
  verb: VerbType.RelatedTo,
  // other metadata...
})

// Get all relationships
const verbs = await db.getAllVerbs()

// Get relationships by source noun
const outgoingVerbs = await db.getVerbsBySource(sourceId)

// Get relationships by target noun
const incomingVerbs = await db.getVerbsByTarget(targetId)

// Get relationships by type
const containsVerbs = await db.getVerbsByType(VerbType.Contains)

// Get a specific relationship
const verb = await db.getVerb(verbId)

// Delete a relationship
await db.deleteVerb(verbId)
```

## Advanced Configuration

### Embedding

```typescript
import {
  BrainyData,
  createTensorFlowEmbeddingFunction,
  createThreadedEmbeddingFunction
} from '@soulcraft/brainy'

// Use the standard TensorFlow Universal Sentence Encoder embedding function
const db = new BrainyData({
  embeddingFunction: createTensorFlowEmbeddingFunction()
})
await db.init()

// Or use the threaded embedding function for better performance
const threadedDb = new BrainyData({
  embeddingFunction: createThreadedEmbeddingFunction()
})
await threadedDb.init()

// Directly embed text to vectors
const vector = await db.embed("Some text to convert to a vector")
```

The threaded embedding function runs in a separate thread (Web Worker in browsers, Worker Thread in Node.js) to improve
performance, especially for embedding operations. It uses GPU acceleration when available (via WebGL in browsers) and
falls back to CPU processing for compatibility. Universal Sentence Encoder is always used for embeddings. The
implementation includes worker reuse and model caching for optimal performance.

### Performance Tuning

Brainy includes comprehensive performance optimizations that work across all environments (browser, CLI, Node.js,
container, server):

#### GPU and CPU Optimization

Brainy uses GPU and CPU optimization for compute-intensive operations:

1. **GPU-Accelerated Embeddings**: Generate text embeddings using TensorFlow.js with WebGL backend when available
2. **Automatic Fallback**: Falls back to CPU backend when GPU is not available
3. **Optimized Distance Calculations**: Perform vector similarity calculations with optimized algorithms
4. **Cross-Environment Support**: Works consistently across browsers and Node.js environments
5. **Memory Management**: Properly disposes of tensors to prevent memory leaks

#### Multithreading Support

Brainy includes comprehensive multithreading support to improve performance across all environments:

1. **Parallel Batch Processing**: Add multiple items concurrently with controlled parallelism
2. **Multithreaded Vector Search**: Perform distance calculations in parallel for faster search operations
3. **Threaded Embedding Generation**: Generate embeddings in separate threads to avoid blocking the main thread
4. **Worker Reuse**: Maintains a pool of workers to avoid the overhead of creating and terminating workers
5. **Model Caching**: Initializes the embedding model once per worker and reuses it for multiple operations
6. **Batch Embedding**: Processes multiple items in a single embedding operation for better performance
7. **Automatic Environment Detection**: Adapts to browser (Web Workers) and Node.js (Worker Threads) environments

```typescript
import { BrainyData, euclideanDistance } from '@soulcraft/brainy'

// Configure with custom options
const db = new BrainyData({
  // Use Euclidean distance instead of default cosine distance
  distanceFunction: euclideanDistance,

  // HNSW index configuration for search performance
  hnsw: {
    M: 16,              // Max connections per noun
    efConstruction: 200, // Construction candidate list size
    efSearch: 50,       // Search candidate list size
  },

  // Performance optimization options
  performance: {
    useParallelization: true, // Enable multithreaded search operations
  },

  // Noun and Verb type validation
  typeValidation: {
    enforceNounTypes: true,  // Validate noun types against NounType enum
    enforceVerbTypes: true,  // Validate verb types against VerbType enum
  },

  // Storage configuration
  storage: {
    requestPersistentStorage: true,
    // Example configuration for cloud storage (replace with your own values):
    // s3Storage: {
    //   bucketName: 'your-s3-bucket-name',
    //   region: 'your-aws-region'
    //   // Credentials should be provided via environment variables
    //   // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    // }
  }
})
```

### Optimized HNSW for Large Datasets

Brainy includes an optimized HNSW index implementation for large datasets that may not fit entirely in memory, using a
hybrid approach:

1. **Product Quantization** - Reduces vector dimensionality while preserving similarity relationships
2. **Disk-Based Storage** - Offloads vectors to disk when memory usage exceeds a threshold
3. **Memory-Efficient Indexing** - Optimizes memory usage for large-scale vector collections

```typescript
import { BrainyData } from '@soulcraft/brainy'

// Configure with optimized HNSW index for large datasets
const db = new BrainyData({
  hnswOptimized: {
    // Standard HNSW parameters
    M: 16,              // Max connections per noun
    efConstruction: 200, // Construction candidate list size
    efSearch: 50,       // Search candidate list size

    // Memory threshold in bytes - when exceeded, will use disk-based approach
    memoryThreshold: 1024 * 1024 * 1024, // 1GB default threshold

    // Product quantization settings for dimensionality reduction
    productQuantization: {
      enabled: true,              // Enable product quantization
      numSubvectors: 16,          // Number of subvectors to split the vector into
      numCentroids: 256           // Number of centroids per subvector
    },

    // Whether to use disk-based storage for the index
    useDiskBasedIndex: true         // Enable disk-based storage
  },

  // Storage configuration (required for disk-based index)
  storage: {
    requestPersistentStorage: true
  }
})

// The optimized index automatically adapts based on dataset size:
// 1. For small datasets: Uses standard in-memory approach
// 2. For medium datasets: Applies product quantization to reduce memory usage
// 3. For large datasets: Combines product quantization with disk-based storage

// Check status to see memory usage and optimization details
const status = await db.status()
console.log(status.details.index)
```

## Distance Functions

Brainy provides several distance functions for vector similarity calculations:

- `cosineDistance` (default): Measures the cosine of the angle between vectors (1 - cosine similarity)
- `euclideanDistance`: Measures the straight-line distance between vectors
- `manhattanDistance`: Measures the sum of absolute differences between vector components
- `dotProductDistance`: Measures the negative dot product between vectors

All distance functions are optimized for performance and automatically use the most efficient implementation based on
the dataset size and available resources. For large datasets and high-dimensional vectors, Brainy uses batch processing
and multithreading when available to improve performance.

## Backup and Restore

Brainy provides backup and restore capabilities that allow you to:

- Back up your data
- Transfer data between Brainy instances
- Restore existing data into Brainy for vectorization and indexing
- Backup data for analysis or visualization in other tools

### Backing Up Data

```typescript
// Backup all data from the database
const backupData = await db.backup()

// The backup data includes:
// - All nouns (entities) with their vectors and metadata
// - All verbs (relationships) between nouns
// - Noun types and verb types
// - HNSW index data for fast similarity search
// - Version information

// Save the backup data to a file (Node.js environment)
import fs from 'fs'

fs.writeFileSync('brainy-backup.json', JSON.stringify(backupData, null, 2))
```

### Restoring Data

Brainy's restore functionality can handle:

1. Complete backups with vectors and index data
2. Sparse data without vectors (vectors will be created during restore)
3. Data without HNSW index (index will be reconstructed if needed)

```typescript
// Restore data with all options
const restoreResult = await db.restore(backupData, {
  clearExisting: true // Whether to clear existing data before restore
})

// Import sparse data (without vectors)
// Vectors will be automatically created using the embedding function
const sparseData = {
  nouns: [
    {
      id: '123',
      // No vector field - will be created during import
      metadata: {
        noun: 'Thing',
        text: 'This text will be used to generate a vector'
      }
    }
  ],
  verbs: [],
  version: '1.0.0'
}

const sparseImportResult = await db.importSparseData(sparseData)
```

### CLI Backup/Restore

```bash
# Backup data to a file
brainy backup --output brainy-backup.json

# Restore data from a file
brainy restore --input brainy-backup.json --clear-existing

# Import sparse data (without vectors)
brainy import-sparse --input sparse-data.json
```

## Embedding

Brainy uses the following embedding approach:

- TensorFlow Universal Sentence Encoder (high-quality text embeddings)
- GPU acceleration when available (via WebGL in browsers)
- Batch embedding for processing multiple items efficiently
- Worker reuse and model caching for optimal performance
- Custom embedding functions can be plugged in for specialized domains

## Extensions

Brainy includes an augmentation system for extending functionality:

- **Memory Augmentations**: Different storage backends
- **Sense Augmentations**: Process raw data
- **Cognition Augmentations**: Reasoning and inference
- **Dialog Augmentations**: Text processing and interaction
- **Perception Augmentations**: Data interpretation and visualization
- **Activation Augmentations**: Trigger actions

### Simplified Augmentation System

Brainy provides a simplified factory system for creating, importing, and executing augmentations with minimal
boilerplate:

```typescript
import {
  createMemoryAugmentation,
  createConduitAugmentation,
  createSenseAugmentation,
  addWebSocketSupport,
  executeStreamlined,
  processStaticData,
  processStreamingData,
  createPipeline
} from '@soulcraft/brainy'

// Create a memory augmentation with minimal code
const memoryAug = createMemoryAugmentation({
  name: 'simple-memory',
  description: 'A simple in-memory storage augmentation',
  autoRegister: true,
  autoInitialize: true,

  // Implement only the methods you need
  storeData: async (key, data) => {
    // Your implementation here
    return {
      success: true,
      data: true
    }
  },

  retrieveData: async (key) => {
    // Your implementation here
    return {
      success: true,
      data: { example: 'data', key }
    }
  }
})

// Add WebSocket support to any augmentation
const wsAugmentation = addWebSocketSupport(memoryAug, {
  connectWebSocket: async (url) => {
    // Your implementation here
    return {
      connectionId: 'ws-1',
      url,
      status: 'connected'
    }
  }
})

// Process static data through a pipeline
const result = await processStaticData(
  'Input data',
  [
    {
      augmentation: senseAug,
      method: 'processRawData',
      transformArgs: (data) => [data, 'text']
    },
    {
      augmentation: memoryAug,
      method: 'storeData',
      transformArgs: (data) => ['processed-data', data]
    }
  ]
)

// Create a reusable pipeline
const pipeline = createPipeline([
  {
    augmentation: senseAug,
    method: 'processRawData',
    transformArgs: (data) => [data, 'text']
  },
  {
    augmentation: memoryAug,
    method: 'storeData',
    transformArgs: (data) => ['processed-data', data]
  }
])

// Use the pipeline
const result = await pipeline('New input data')

// Dynamically load augmentations at runtime
const loadedAugmentations = await loadAugmentationModule(
  import('./my-augmentations.js'),
  {
    autoRegister: true,
    autoInitialize: true
  }
)
```

The simplified augmentation system provides:

1. **Factory Functions** - Create augmentations with minimal boilerplate
2. **WebSocket Support** - Add WebSocket capabilities to any augmentation
3. **Streamlined Pipeline** - Process data through augmentations more efficiently
4. **Dynamic Loading** - Load augmentations at runtime when needed
5. **Static & Streaming Data** - Handle both static and streaming data with the same API

### Model Control Protocol (MCP)

Brainy includes a Model Control Protocol (MCP) implementation that allows external models to access Brainy data and use
the augmentation pipeline as tools:

- **BrainyMCPAdapter**: Provides access to Brainy data through MCP
- **MCPAugmentationToolset**: Exposes the augmentation pipeline as tools
- **BrainyMCPService**: Integrates the adapter and toolset, providing WebSocket and REST server implementations

Environment compatibility:

- **BrainyMCPAdapter** and **MCPAugmentationToolset** can run in any environment (browser, Node.js, server)
- **BrainyMCPService** core functionality works in any environment

For detailed documentation and usage examples, see the [MCP documentation](src/mcp/README.md).

## Cross-Environment Compatibility

Brainy is designed to run seamlessly in any environment, from browsers to Node.js to serverless functions and
containers. All Brainy data, functions, and augmentations are environment-agnostic, allowing you to use the same code
everywhere.

### Environment Detection

Brainy automatically detects the environment it's running in:

```typescript
import { environment } from '@soulcraft/brainy'

// Check which environment we're running in
console.log(`Running in ${
  environment.isBrowser ? 'browser' :
    environment.isNode ? 'Node.js' :
      'serverless/unknown'
} environment`)
```

### Adaptive Storage

Storage adapters are automatically selected based on the environment:

- **Browser**: Uses Origin Private File System (OPFS) when available, falls back to in-memory storage
- **Node.js**: Uses file system storage by default, with options for S3-compatible cloud storage
- **Serverless**: Uses in-memory storage with options for cloud persistence
- **Container**: Automatically detects and uses the appropriate storage based on available capabilities

### Dynamic Imports

Brainy uses dynamic imports to load environment-specific dependencies only when needed, keeping the bundle size small
and ensuring compatibility across environments.

### Browser Support

Works in all modern browsers:

- Chrome 86+
- Edge 86+
- Opera 72+
- Chrome for Android 86+

For browsers without OPFS support, falls back to in-memory storage.


## Related Projects

- **[Cartographer](https://github.com/sodal-project/cartographer)** - A companion project that provides standardized
  interfaces for interacting with Brainy

## Demo

The repository includes a comprehensive demo that showcases Brainy's main features:

- `demo/index.html` - A single demo page with animations demonstrating Brainy's features.
    - **[Try the live demo](https://soulcraft-research.github.io/brainy/demo/index.html)** - Check out the
      interactive demo on
      GitHub Pages
    - Or run it locally with `npm run demo` (see [demo instructions](README.demo.md) for details)
    - To deploy your own version to GitHub Pages, use the GitHub Actions workflow in
      `.github/workflows/deploy-demo.yml`,
      which automatically deploys when pushing to the main branch or can be manually triggered
    - To use a custom domain (like www.soulcraft.com):
        1. A CNAME file is already included in the demo directory
            2. In your GitHub repository settings, go to Pages > Custom domain and enter your domain
            3. Configure your domain's DNS settings to point to GitHub Pages:

            - Add a CNAME record for www pointing to `<username>.github.io` (e.g., `soulcraft-research.github.io`)
            - Or for an apex domain (soulcraft.com), add A records pointing to GitHub Pages IP addresses

The demo showcases:

- How Brainy runs in different environments (browser, Node.js, server, cloud)
- How the noun-verb data model works
- How HNSW search works

## Syncing Brainy Instances

You can use the conduit augmentations to sync Brainy instances:

- **WebSocket iConduit**: For syncing between browsers and servers, or between servers. WebSockets cannot be used for
  direct browser-to-browser communication without a server in the middle.
- **WebRTC iConduit**: For direct peer-to-peer syncing between browsers. This is the recommended approach for
  browser-to-browser communication.

#### WebSocket Sync Example

```typescript
import {
  BrainyData,
  pipeline,
  createConduitAugmentation
} from '@soulcraft/brainy'

// Create and initialize the database
const db = new BrainyData()
await db.init()

// Create a WebSocket conduit augmentation
const wsConduit = await createConduitAugmentation('websocket', 'my-websocket-sync')

// Register the augmentation with the pipeline
pipeline.register(wsConduit)

// Connect to another Brainy instance (server or browser)
// Replace the example URL below with your actual WebSocket server URL
const connectionResult = await pipeline.executeConduitPipeline(
  'establishConnection',
  ['wss://example-websocket-server.com/brainy-sync', { protocols: 'brainy-sync' }]
)

if (connectionResult[0] && (await connectionResult[0]).success) {
  const connection = (await connectionResult[0]).data

  // Read data from the remote instance
  const readResult = await pipeline.executeConduitPipeline(
    'readData',
    [{ connectionId: connection.connectionId, query: { type: 'getAllNouns' } }]
  )

  // Process and add the received data to the local instance
  if (readResult[0] && (await readResult[0]).success) {
    const remoteNouns = (await readResult[0]).data
    for (const noun of remoteNouns) {
      await db.add(noun.vector, noun.metadata)
    }
  }

  // Set up real-time sync by monitoring the stream
  await wsConduit.monitorStream(connection.connectionId, async (data) => {
    // Handle incoming data (e.g., new nouns, verbs, updates)
    if (data.type === 'newNoun') {
      await db.add(data.vector, data.metadata)
    } else if (data.type === 'newVerb') {
      await db.addVerb(data.sourceId, data.targetId, data.vector, data.options)
    }
  })
}
```

#### WebRTC Peer-to-Peer Sync Example

```typescript
import {
  BrainyData,
  pipeline,
  createConduitAugmentation
} from '@soulcraft/brainy'

// Create and initialize the database
const db = new BrainyData()
await db.init()

// Create a WebRTC conduit augmentation
const webrtcConduit = await createConduitAugmentation('webrtc', 'my-webrtc-sync')

// Register the augmentation with the pipeline
pipeline.register(webrtcConduit)

// Connect to a peer using a signaling server
// Replace the example values below with your actual configuration
const connectionResult = await pipeline.executeConduitPipeline(
  'establishConnection',
  [
    'peer-id-to-connect-to', // Replace with actual peer ID
    {
      signalServerUrl: 'wss://example-signal-server.com', // Replace with your signal server
      localPeerId: 'my-local-peer-id', // Replace with your local peer ID
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Public STUN server
    }
  ]
)

if (connectionResult[0] && (await connectionResult[0]).success) {
  const connection = (await connectionResult[0]).data

  // Set up real-time sync by monitoring the stream
  await webrtcConduit.monitorStream(connection.connectionId, async (data) => {
    // Handle incoming data (e.g., new nouns, verbs, updates)
    if (data.type === 'newNoun') {
      await db.add(data.vector, data.metadata)
    } else if (data.type === 'newVerb') {
      await db.addVerb(data.sourceId, data.targetId, data.vector, data.options)
    }
  })

  // When adding new data locally, also send to the peer
  const nounId = await db.add("New data to sync", { noun: "Thing" })

  // Send the new noun to the peer
  await pipeline.executeConduitPipeline(
    'writeData',
    [
      {
        connectionId: connection.connectionId,
        data: {
          type: 'newNoun',
          id: nounId,
          vector: (await db.get(nounId)).vector,
          metadata: (await db.get(nounId)).metadata
        }
      }
    ]
  )
}
```

#### Browser-Server Search Example

Brainy supports searching a server-hosted instance from a browser, storing results locally, and performing further
searches against the local instance:

```typescript
import { BrainyData } from '@soulcraft/brainy'

// Create and initialize the database with remote server configuration
// Replace the example URL below with your actual Brainy server URL
const db = new BrainyData({
  remoteServer: {
    url: 'wss://example-brainy-server.com/ws', // Replace with your server URL
    protocols: 'brainy-sync',
    autoConnect: true // Connect automatically during initialization
  }
})
await db.init()

// Or connect manually after initialization
if (!db.isConnectedToRemoteServer()) {
  // Replace the example URL below with your actual Brainy server URL
  await db.connectToRemoteServer('wss://example-brainy-server.com/ws', 'brainy-sync')
}

// Search the remote server (results are stored locally)
const remoteResults = await db.searchText('machine learning', 5, { searchMode: 'remote' })

// Search the local database (includes previously stored results)
const localResults = await db.searchText('machine learning', 5, { searchMode: 'local' })

// Perform a combined search (local first, then remote if needed)
const combinedResults = await db.searchText('neural networks', 5, { searchMode: 'combined' })

// Add data to both local and remote instances
const id = await db.addToBoth('Deep learning is a subset of machine learning', {
  noun: 'Concept',
  category: 'AI',
  tags: ['deep learning', 'neural networks']
})

// Clean up when done (this also cleans up worker pools)
await db.shutDown()
```

---

## 📈 Scaling Strategy

Brainy is designed to handle datasets of various sizes, from small collections to large-scale deployments. For
terabyte-scale data that can't fit entirely in memory, we provide several approaches:

- **Disk-Based HNSW**: Modified implementations using intelligent caching and partial loading
- **Distributed HNSW**: Sharding and partitioning across multiple machines
- **Hybrid Solutions**: Combining quantization techniques with multi-tier architectures

For detailed information on how to scale Brainy for large datasets, see our
comprehensive [Scaling Strategy](scalingStrategy.md) document.

## Contributing

For detailed contribution guidelines, please see [CONTRIBUTING.md](CONTRIBUTING.md).

For developer documentation, including building, testing, and publishing instructions, please
see [DEVELOPERS.md](DEVELOPERS.md).

We have a [Code of Conduct](CODE_OF_CONDUCT.md) that all contributors are expected to follow.

## License

[MIT](LICENSE)
