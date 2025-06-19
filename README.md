<div align="center">
<img src="./brainy.png" alt="Brainy Logo" width="200"/>
<br/><br/>

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D23.11.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1.6-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Cartographer](https://img.shields.io/badge/Cartographer-Official%20Standard-brightgreen)](https://github.com/sodal-project/cartographer)

**A lightweight and powerful graph & vector data platform for AI applications across any environment**

</div>

## ✨ Overview

Say hello to Brainy, your new favorite data sidekick! 🎉 Brainy combines the power of vector search with graph
relationships in a lightweight, cross-platform database that's as smart as it is fun to use. Whether you're building AI
applications, recommendation systems, or knowledge graphs, Brainy provides the tools you need to store, connect, and
retrieve your data intelligently.

What makes Brainy special? It intelligently adapts to you and your environment! Like a chameleon with a PhD, Brainy
automatically detects your platform, adjusts its storage strategy, and optimizes performance based on your usage
patterns. The more you use it, the smarter it gets - learning from your data to provide increasingly relevant results
and connections.

### 🚀 Key Features

- **Run Everywhere** - Run Brainy in a browser, container, serverless cloud service or the terminal!
- **Vector Search** - Find semantically similar content using embeddings (like having ESP for your data!)
- **Graph Relationships** - Connect data with meaningful relationships (your data's social network)
- **Streaming Pipeline** - Process data in real-time as it flows through the system (like a data waterslide!)
- **Extensible Augmentations** - Customize and extend functionality with pluggable components (LEGO blocks for your
  data!)
- **Built-in Conduits** - Sync and scale across instances with WebSocket and WebRTC (your data's teleportation system!)
- **TensorFlow Integration** - Use TensorFlow.js for high-quality embeddings (included as a required dependency)
- **Adaptive Intelligence** - Automatically optimizes for your environment and usage patterns
- **Cross-Platform** - Works everywhere you do: browsers, Node.js, and server environments
- **Persistent Storage** - Data persists across sessions and scales to any size (no memory loss here, even for
  elephant-sized data!)
- **TypeScript Support** - Fully typed API with generics (for those who like their code tidy)
- **CLI Tools** - Powerful command-line interface for data management (command line wizardry)

## 📊 What Can You Build? (The Fun Stuff!)

- **Semantic Search Engines** - Find content based on meaning, not just keywords (mind-reading for your data!)
- **Recommendation Systems** - Suggest similar items based on vector similarity (like a friend who really gets your
  taste)
- **Knowledge Graphs** - Build connected data structures with relationships (your data's family tree)
- **AI Applications** - Store and retrieve embeddings for machine learning models (brain food for your AI)
- **AI-Enhanced Applications** - Build applications that leverage vector embeddings for intelligent data processing
- **Data Organization Tools** - Automatically categorize and connect related information (like having a librarian in
  your code)
- **Adaptive Experiences** - Create applications that learn and evolve with your users (digital chameleons!)

## 🔧 Installation

```bash
npm install @soulcraft/brainy
```

### TensorFlow.js Support

TensorFlow-based embeddings are now included as required dependencies. All necessary TensorFlow.js packages are automatically installed when you install Brainy.

Note: If you encounter dependency conflicts with TensorFlow.js packages, you may need to use the `--legacy-peer-deps` flag:

```bash
npm install @soulcraft/brainy --legacy-peer-deps
```

## 🏁 Quick Start

Brainy now uses a unified build that automatically adapts to your environment (Node.js, browser, or serverless), so you can use the same code everywhere!

```typescript
import {BrainyData, NounType, VerbType, environment} from '@soulcraft/brainy'

// Check which environment we're running in (optional)
console.log(`Running in ${environment.isBrowser ? 'browser' : environment.isNode ? 'Node.js' : 'serverless'} environment`)

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
// Returns items similar to "feline pets" with similarity scores

// Add a relationship between items
await db.addVerb(catId, dogId, {
    verb: VerbType.RelatedTo,
    description: 'Both are common household pets'
})
```

### Usage Options

Brainy's unified build works in all environments, but you have several import options:

```typescript
// Standard import - automatically adapts to any environment
import {BrainyData, NounType, VerbType, environment} from '@soulcraft/brainy'

// Minified version for production
import {BrainyData, NounType, VerbType} from '@soulcraft/brainy/min'

// Use the same API in any environment
const db = new BrainyData()
await db.init()
// ...
```

#### Using a script tag in HTML

```html
<script type="module">
  // Use the CDN to load the unified build
  import {BrainyData, NounType, VerbType} from 'https://cdn.jsdelivr.net/npm/@soulcraft/brainy/dist/unified.js'

  // Or use the minified version
  // import {BrainyData, NounType, VerbType} from 'https://cdn.jsdelivr.net/npm/@soulcraft/brainy/dist/unified.min.js'

  // Use the same API as in Node.js
  const db = new BrainyData()
  await db.init()
  // ...
</script>
```

Modern bundlers like Webpack, Rollup, and Vite will automatically use the unified build which adapts to any environment.

## 🧩 How It Works (The Magic Behind the Curtain)

Brainy combines four key technologies to create its adaptive intelligence:

1. **Vector Embeddings** - Converts data (text, images, etc.) into numerical vectors that capture semantic meaning (
   translating your data into brain-speak!)
2. **HNSW Algorithm** - Enables fast similarity search through a hierarchical graph structure (like a super-efficient
   treasure map for your data)
3. **Adaptive Environment Detection** - Automatically senses your platform and optimizes accordingly:
    - Adjusts performance parameters based on available resources
    - Learns from query patterns to optimize future searches
    - Tunes itself for your specific use cases the more you use it
4. **Intelligent Storage Selection** - Uses the best available storage option for your environment, scaling effortlessly
   to any data size (from bytes to petabytes!):
    - Browser: Origin Private File System (OPFS)
    - Node.js: File system
    - Server: S3-compatible storage (optional)
    - Fallback: In-memory storage
    - Automatically migrates between storage types as needed!

## 🚀 The Brainy Pipeline (Data's Wild Ride!)

Brainy's data processing pipeline transforms raw data into searchable, connected knowledge that gets smarter over time.
Here's how the magic happens:

```
Raw Data → Embedding → Vector Storage → Graph Connections → Adaptive Learning → Query & Retrieval
```

Each time data flows through this pipeline, Brainy learns a little more about your usage patterns and environment,
making future operations even faster and more relevant!

### 🔄 Pipeline Stages (The Journey of Your Data)

1. **Data Ingestion** 🍽️
    - Raw text or pre-computed vectors enter the pipeline (dinner time for data!)
    - Data is validated and prepared for processing (washing hands before eating)

2. **Embedding Generation** 🧠
    - Text is transformed into numerical vectors using embedding models (language → math magic)
    - Uses TensorFlow Universal Sentence Encoder for high-quality text embeddings
    - Custom embedding functions can be plugged in for specialized domains (bring your own secret sauce)

3. **Vector Indexing** 🔍
    - Vectors are indexed using the HNSW algorithm (filing your data in the brain cabinet)
    - Hierarchical structure enables lightning-fast similarity search (express lanes for your queries)
    - Configurable parameters for precision vs. performance tradeoffs (dial in your perfect balance)

4. **Graph Construction** 🕸️
    - Nouns (entities) become nodes in the knowledge graph (data gets its own social network)
    - Verbs (relationships) connect related entities (making friends and connections)
    - Typed relationships add semantic meaning to connections (not just friends, but BFFs)

5. **Adaptive Learning** 🌱
    - Analyzes usage patterns to optimize future operations (gets to know your habits)
    - Tunes performance parameters based on your environment (adapts to your digital home)
    - Adjusts search strategies based on query history (learns what you're really looking for)
    - Becomes more efficient and relevant the more you use it (like a good friendship)

6. **Intelligent Storage** 💾
    - Data is saved using the optimal storage for your environment (finds the coziest home for your data)
    - Automatic selection between OPFS, filesystem, S3, or memory (no manual configuration needed!)
    - Migrates between storage types as your application's needs evolve (moves houses without you noticing)
    - Scales effortlessly from tiny datasets to massive data collections (from ant-sized to elephant-sized data, no
      problem!)
    - Configurable storage adapters for custom persistence needs (design your own dream data home)

### 🧩 Augmentation Types

Brainy uses a powerful augmentation system to extend functionality. Augmentations are processed in the following order:

1. **SENSE** 👁️
    - Ingests and processes raw, unstructured data into nouns and verbs
    - Handles text, images, audio streams, and other input formats
    - Example: Converting raw text into structured entities

2. **MEMORY** 💾
    - Provides storage capabilities for data in different formats
    - Manages persistence across sessions
    - Example: Storing vectors in OPFS or filesystem

3. **COGNITION** 🧠
    - Enables advanced reasoning, inference, and logical operations
    - Analyzes relationships between entities
    - Examples:
        - Inferring new connections between existing data
        - Deriving insights from graph relationships

4. **CONDUIT** 🔌
    - Establishes high-bandwidth channels for structured data exchange
    - Connects with external systems and syncs between Brainy instances
    - Two built-in iConduit augmentations for scaling out and syncing:
        - **WebSocket iConduit** - Syncs data between browsers and servers (like a digital postal service with
          superpowers!)
        - **WebRTC iConduit** - Direct peer-to-peer syncing between browsers (like telepathy for your data, no middleman
          required!)
    - Examples:
        - Integrating with third-party APIs
        - Syncing Brainy instances between browsers using WebSockets
        - Peer-to-peer syncing between browsers using WebRTC

5. **ACTIVATION** ⚡
    - Initiates actions, responses, or data manipulations
    - Triggers events based on data changes
    - Example: Sending notifications when new data is processed

6. **PERCEPTION** 🔍
    - Interprets, contextualizes, and visualizes identified nouns and verbs
    - Creates meaningful representations of data
    - Example: Generating visualizations of graph relationships

7. **DIALOG** 💬
    - Facilitates natural language understanding and generation
    - Enables conversational interactions
    - Example: Processing user queries and generating responses

8. **WEBSOCKET** 🌐
    - Enables real-time communication via WebSockets
    - Can be combined with other augmentation types
    - Example: Streaming data processing in real-time

### 🌊 Streaming Data Support

Brainy's pipeline is designed to handle streaming data efficiently:

1. **WebSocket Integration** 🔄
    - Built-in support for WebSocket connections
    - Process data as it arrives without blocking
    - Example: `setupWebSocketPipeline(url, dataType, options)`

2. **Asynchronous Processing** ⚡
    - Non-blocking architecture for real-time data handling
    - Parallel processing of incoming streams
    - Example: `createWebSocketHandler(connection, dataType, options)`

3. **Event-Based Architecture** 📡
    - Augmentations can listen to data feeds and streams
    - Real-time updates propagate through the pipeline
    - Example: `listenToFeed(feedUrl, callback)`

4. **Threaded Execution** 🧵
    - Optional multi-threading for high-performance streaming
    - Configurable execution modes (SEQUENTIAL, PARALLEL, THREADED)
    - Example: `executeTypedPipeline(augmentations, method, args, { mode: ExecutionMode.THREADED })`

### 🏗️ Build System

Brainy uses a modern build system that optimizes for both Node.js and browser environments:

1. **ES Modules** 📦
    - Built as ES modules for maximum compatibility
    - Works in modern browsers and Node.js environments
    - Separate optimized builds for browser and Node.js

2. **Environment-Specific Builds** 🔧
    - **Node.js Build**: Optimized for server environments with full functionality
    - **Browser Build**: Optimized for browser environments with reduced bundle size
    - Conditional exports in package.json for automatic environment detection

3. **Environment Detection** 🔍
    - Automatically detects whether it's running in a browser or Node.js
    - Loads appropriate dependencies and functionality based on the environment
    - Provides consistent API across all environments

4. **TypeScript** 📝
    - Written in TypeScript for type safety and better developer experience
    - Generates type definitions for TypeScript users
    - Compiled to ES2020 for modern JavaScript environments

5. **Build Scripts** 🛠️
    - `npm run build`: Builds the Node.js version
    - `npm run build:browser`: Builds the browser-optimized version
    - `npm run build:all`: Builds both versions
    - `npm run demo`: Builds all versions and starts a demo server

### 🏃‍♀️ Running the Pipeline

The pipeline runs automatically when you:

```typescript
// Add data (runs embedding → indexing → storage)
const id = await db.add("Your text data here", {metadata})

// Search (runs embedding → similarity search)
const results = await db.searchText("Your query here", 5)

// Connect entities (runs graph construction → storage)
await db.addVerb(sourceId, targetId, {verb: VerbType.RelatedTo})
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

### 🔧 Extending the Pipeline

Brainy's pipeline is designed for extensibility at every stage:

1. **Custom Embedding** 🧩
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

2. **Custom Distance Functions** 📏
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

3. **Custom Storage Adapters** 📦
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

4. **Augmentations System** 🧠
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

## 📝 Data Model

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

## 🖥️ Command Line Interface

Brainy includes a powerful CLI for managing your data:

```bash
# Install globally
npm install -g @soulcraft/brainy --legacy-peer-deps

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

### 🔄 Using During Development

```bash
# Run the CLI directly from the source
npm run cli help

# Generate a random graph for testing
npm run cli generate-random-graph --noun-count 20 --verb-count 40
```

### 🔍 Available Commands

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


## 🔌 API Reference

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


## ⚙️ Advanced Configuration

### Embedding

```typescript
import {BrainyData, createTensorFlowEmbeddingFunction} from '@soulcraft/brainy'

// Use the TensorFlow Universal Sentence Encoder embedding function
const db = new BrainyData({
    embeddingFunction: createTensorFlowEmbeddingFunction()
})
await db.init()

// Directly embed text to vectors
const vector = await db.embed("Some text to convert to a vector")
```

### Performance Tuning

```typescript
import {BrainyData, euclideanDistance} from '@soulcraft/brainy'

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

Brainy includes an optimized HNSW index implementation designed specifically for large datasets that may not fit entirely in memory. This implementation uses a hybrid approach combining:

1. **Product Quantization** - Reduces vector dimensionality while preserving similarity relationships
2. **Disk-Based Storage** - Offloads vectors to disk when memory usage exceeds a threshold
3. **Memory-Efficient Indexing** - Optimizes memory usage for large-scale vector collections

```typescript
import {BrainyData} from '@soulcraft/brainy'

// Configure with optimized HNSW index for large datasets
const db = new BrainyData({
    // Use the optimized HNSW index instead of the standard one
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
        // Choose appropriate storage for your environment
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
// Example output:
// {
//   indexSize: 10000,
//   optimized: true,
//   memoryUsage: 536870912,  // Memory usage in bytes
//   productQuantization: true,
//   diskBasedIndex: true
// }
```

## 🧪 Distance Functions

- `cosineDistance` (default)
- `euclideanDistance`
- `manhattanDistance`
- `dotProductDistance`

## 📤📥 Backup and Restore

Brainy provides powerful backup and restore capabilities that allow you to:
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

Brainy's restore functionality is flexible and can handle:
1. Complete backups with vectors and index data
2. Sparse data without vectors (vectors will be created during restore)
3. Data without HNSW index (index will be reconstructed if needed)

```typescript
// Restore data with all options
const restoreResult = await db.restore(backupData, {
  clearExisting: true // Whether to clear existing data before restore
})

// Restore sparse data (without vectors)
// Vectors will be automatically created using the embedding function
const sparseData = {
  nouns: [
    {
      id: '123',
      // No vector field - will be created during restore
      metadata: {
        noun: 'Thing',
        text: 'This text will be used to generate a vector'
      }
    }
  ],
  verbs: [],
  version: '1.0.0'
}

const sparseRestoreResult = await db.restore(sparseData)
```

### CLI Backup/Restore

```bash
# Backup data to a file
brainy backup --output brainy-backup.json

# Restore data from a file
brainy restore --input brainy-backup.json --clear-existing

# Restore sparse data (without vectors)
brainy restore --input sparse-data.json
```

## 🔋 Embedding

Brainy uses the following embedding approach:

- TensorFlow Universal Sentence Encoder (high-quality text embeddings)
- Custom embedding functions can be plugged in for specialized domains

## 🧰 Extensions

Brainy includes an augmentation system for extending functionality:

- **Memory Augmentations**: Different storage backends
- **Sense Augmentations**: Process raw data
- **Cognition Augmentations**: Reasoning and inference
- **Dialog Augmentations**: Text processing and interaction
- **Perception Augmentations**: Data interpretation and visualization
- **Activation Augmentations**: Trigger actions

## 🌐 Browser Compatibility

Works in all modern browsers:

- Chrome 86+
- Edge 86+
- Opera 72+
- Chrome for Android 86+

For browsers without OPFS support, falls back to in-memory storage.

## ☁️ Cloud Deployment

Brainy can be deployed as a standalone web service on various cloud platforms using the included cloud wrapper:

- **AWS Lambda and API Gateway**: Deploy as a serverless function with API Gateway
- **Google Cloud Run**: Deploy as a containerized service
- **Cloudflare Workers**: Deploy as a serverless function on the edge

The cloud wrapper provides both RESTful and WebSocket APIs for all Brainy operations, enabling both request-response and
real-time communication patterns. It supports multiple storage backends and can be configured via environment variables.

Key features of the cloud wrapper:

- RESTful API for standard CRUD operations
- WebSocket API for real-time updates and subscriptions
- Support for multiple storage backends (Memory, FileSystem, S3)
- Configurable via environment variables
- Deployment scripts for AWS, Google Cloud, and Cloudflare

### Deploying to the Cloud

You can deploy the cloud wrapper to various cloud platforms using the following npm scripts from the root directory:

```bash
# Deploy to AWS Lambda and API Gateway
npm run deploy:cloud:aws

# Deploy to Google Cloud Run
npm run deploy:cloud:gcp

# Deploy to Cloudflare Workers
npm run deploy:cloud:cloudflare

# Show available deployment options
npm run deploy:cloud
```

Before deploying, make sure to configure the appropriate environment variables in the `cloud-wrapper/.env` file. See the [Cloud Wrapper README](cloud-wrapper/README.md) for detailed configuration instructions and API documentation.

## 🔗 Related Projects

- **[Cartographer](https://github.com/sodal-project/cartographer)** - A companion project that provides standardized
  interfaces for interacting with Brainy

## 📚 Demo

The repository includes a comprehensive demo that showcases Brainy's main features:

- `examples/demo.html` - A single demo page with animations demonstrating Brainy's features. Run it with
  `npm run demo` (see [demo instructions](README.demo.md) for details):
    - How Brainy runs in different environments (browser, Node.js, server, cloud)
    - How the noun-verb data model works
    - How HNSW search works

### Syncing Brainy Instances

You can use the conduit augmentations to sync Brainy instances:

- **WebSocket iConduit**: For syncing between browsers and servers, or between servers (like a digital postal service
  with superpowers!). WebSockets cannot be used for direct browser-to-browser communication without a server in the
  middle.
- **WebRTC iConduit**: For direct peer-to-peer syncing between browsers (like telepathy for your data, no middleman
  required!). This is the recommended approach for browser-to-browser communication.

#### WebSocket Sync Example

```typescript
import {
    BrainyData,
    augmentationPipeline,
    createConduitAugmentation
} from '@soulcraft/brainy'

// Create and initialize the database
const db = new BrainyData()
await db.init()

// Create a WebSocket conduit augmentation
const wsConduit = await createConduitAugmentation('websocket', 'my-websocket-sync')

// Register the augmentation with the pipeline
augmentationPipeline.register(wsConduit)

// Connect to another Brainy instance (server or browser)
// Replace the example URL below with your actual WebSocket server URL
const connectionResult = await augmentationPipeline.executeConduitPipeline(
    'establishConnection',
    ['wss://example-websocket-server.com/brainy-sync', {protocols: 'brainy-sync'}]
)

if (connectionResult[0] && (await connectionResult[0]).success) {
    const connection = (await connectionResult[0]).data

    // Read data from the remote instance
    const readResult = await augmentationPipeline.executeConduitPipeline(
        'readData',
        [{connectionId: connection.connectionId, query: {type: 'getAllNouns'}}]
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
    augmentationPipeline,
    createConduitAugmentation
} from '@soulcraft/brainy'

// Create and initialize the database
const db = new BrainyData()
await db.init()

// Create a WebRTC conduit augmentation
const webrtcConduit = await createConduitAugmentation('webrtc', 'my-webrtc-sync')

// Register the augmentation with the pipeline
augmentationPipeline.register(webrtcConduit)

// Connect to a peer using a signaling server
// Replace the example values below with your actual configuration
const connectionResult = await augmentationPipeline.executeConduitPipeline(
    'establishConnection',
    [
        'peer-id-to-connect-to', // Replace with actual peer ID
        {
            signalServerUrl: 'wss://example-signal-server.com', // Replace with your signal server
            localPeerId: 'my-local-peer-id', // Replace with your local peer ID
            iceServers: [{urls: 'stun:stun.l.google.com:19302'}] // Public STUN server
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
    const nounId = await db.add("New data to sync", {noun: "Thing"})

    // Send the new noun to the peer
    await augmentationPipeline.executeConduitPipeline(
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
import {BrainyData} from '@soulcraft/brainy'

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
const remoteResults = await db.searchText('machine learning', 5, {searchMode: 'remote'})

// Search the local database (includes previously stored results)
const localResults = await db.searchText('machine learning', 5, {searchMode: 'local'})

// Perform a combined search (local first, then remote if needed)
const combinedResults = await db.searchText('neural networks', 5, {searchMode: 'combined'})

// Add data to both local and remote instances
const id = await db.addToBoth('Deep learning is a subset of machine learning', {
    noun: 'Concept',
    category: 'AI',
    tags: ['deep learning', 'neural networks']
})

// Clean up when done
await db.shutDown()
```

For a complete demonstration of Brainy's features, see the [demo page](examples/demo.html).

## 📋 Requirements

- Node.js >= 23.11.0

## 🤝 Contributing

### Code Style Guidelines

Brainy follows a specific code style to maintain consistency throughout the codebase:

1. **No Semicolons**: All code in the project should avoid using semicolons wherever possible. This applies to:
    - Source code files (.ts, .js)
    - Generated code
    - Code examples in documentation
    - Templates and snippets

2. **Formatting**: The project uses Prettier for code formatting with the following settings:
    - No semicolons (`"semi": false`)
    - Single quotes for strings (`"singleQuote": true`)
    - 2-space indentation (`"tabWidth": 2`)
    - Always use parentheses around arrow function parameters (`"arrowParens": "always"`)
    - Place the closing bracket of JSX elements on the same line (`"bracketSameLine": true`)
    - Add spaces between brackets and object literals (`"bracketSpacing": true`)
    - Line width of 80 characters (`"printWidth": 80`)
    - No trailing commas (`"trailingComma": "none"`)
    - Use spaces instead of tabs (`"useTabs": false`)

3. **Linting**: ESLint is configured with the following rules:
    - No semicolons:
      ```json
      "semi": ["error", "never"],
      "@typescript-eslint/semi": ["error", "never"]
      ```
    - Unused variables handling:
      ```json
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        "args": "after-used",
        "argsIgnorePattern": "^_"
      }]
      ```
    - Extends recommended ESLint and TypeScript ESLint configurations

4. **TypeScript Configuration**:
    - Strict type checking enabled (`"strict": true`)
    - Consistent casing in file names enforced (`"forceConsistentCasingInFileNames": true`)
    - ES2020 target with Node.js module system
    - Source maps generated for debugging

5. **Commit Messages**:
    - Use the imperative mood ("Add feature" not "Added feature")
    - Keep the first line concise (under 50 characters)
    - Reference issues and pull requests where appropriate
    - Provide detailed explanations in the commit body when necessary

When contributing to the project, please ensure your code follows these guidelines. The project's CI/CD pipeline will
automatically check for style violations.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests with `npm test`
5. Submit a pull request

## 📄 License

[MIT](LICENSE)
