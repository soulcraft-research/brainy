# 🧠 Soulcraft Brainy

<div align="center">

[![Version](https://img.shields.io/badge/version-0.7.1-blue.svg)](https://www.npmjs.com/package/@soulcraft/brainy)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

**A powerful, lightweight vector & graph database for browsers and Node.js**

</div>

## ✨ Overview

Brainy combines the power of vector search with graph relationships in a lightweight, cross-platform database. Whether you're building AI applications, recommendation systems, or knowledge graphs, Brainy provides the tools you need to store, connect, and retrieve your data intelligently.

### 🚀 Key Features

- **Vector Search** - Find semantically similar content using embeddings
- **Graph Relationships** - Connect data with meaningful relationships
- **Cross-Platform** - Works in browsers, Node.js, and server environments
- **Persistent Storage** - Data persists across sessions
- **TypeScript Support** - Fully typed API with generics
- **CLI Tools** - Powerful command-line interface for data management

## 📊 What Can You Build?

- **Semantic Search Engines** - Find content based on meaning, not just keywords
- **Recommendation Systems** - Suggest similar items based on vector similarity
- **Knowledge Graphs** - Build connected data structures with relationships
- **AI Applications** - Store and retrieve embeddings for machine learning models
- **Data Organization Tools** - Automatically categorize and connect related information

## 🔧 Installation

Due to a dependency conflict between TensorFlow.js packages, use the `--legacy-peer-deps` flag when installing:

```bash
npm install @soulcraft/brainy --legacy-peer-deps
```

## 🏁 Quick Start

```typescript
import { BrainyData, NounType, VerbType } from '@soulcraft/brainy';

// Create and initialize the database
const db = new BrainyData();
await db.init();

// Add data (automatically converted to vectors)
const catId = await db.add("Cats are independent pets", {
    noun: NounType.Thing,
    category: 'animal'
});

const dogId = await db.add("Dogs are loyal companions", {
    noun: NounType.Thing,
    category: 'animal'
});

// Search for similar items
const results = await db.searchText("feline pets", 2);
console.log(results);
// Returns items similar to "feline pets" with similarity scores

// Add a relationship between items
await db.addVerb(catId, dogId, {
    verb: VerbType.RelatedTo,
    description: 'Both are common household pets'
});
```

## 🧩 How It Works

Brainy combines three key technologies:

1. **Vector Embeddings** - Converts data (text, images, etc.) into numerical vectors that capture semantic meaning
2. **HNSW Algorithm** - Enables fast similarity search through a hierarchical graph structure
3. **Persistent Storage** - Uses the best available storage option for your environment:
   - Browser: Origin Private File System (OPFS)
   - Node.js: File system
   - Server: S3-compatible storage (optional)
   - Fallback: In-memory storage

## 🚀 The Brainy Pipeline

Brainy's data processing pipeline transforms raw data into searchable, connected knowledge. Here's how the magic happens:

```
Raw Data → Embedding → Vector Storage → Graph Connections → Query & Retrieval
```

### 🔄 Pipeline Stages

1. **Data Ingestion** 🍽️
   - Raw text or pre-computed vectors enter the pipeline
   - Data is validated and prepared for processing

2. **Embedding Generation** 🧠
   - Text is transformed into numerical vectors using embedding models
   - Choose between TensorFlow Universal Sentence Encoder (high quality) or Simple Embedding (faster)
   - Custom embedding functions can be plugged in for specialized domains

3. **Vector Indexing** 🔍
   - Vectors are indexed using the HNSW algorithm
   - Hierarchical structure enables lightning-fast similarity search
   - Configurable parameters for precision vs. performance tradeoffs

4. **Graph Construction** 🕸️
   - Nouns (entities) become nodes in the knowledge graph
   - Verbs (relationships) connect related entities
   - Typed relationships add semantic meaning to connections

5. **Persistent Storage** 💾
   - Data is saved using the optimal storage for your environment
   - Automatic selection between OPFS, filesystem, S3, or memory
   - Configurable storage adapters for custom persistence needs

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
   - Example: Inferring new connections between existing data

4. **CONDUIT** 🔌
   - Establishes high-bandwidth channels for structured data exchange
   - Connects with external systems
   - Example: Integrating with third-party APIs

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

### 🏃‍♀️ Running the Pipeline

The pipeline runs automatically when you:

```typescript
// Add data (runs embedding → indexing → storage)
const id = await db.add("Your text data here", { metadata });

// Search (runs embedding → similarity search)
const results = await db.searchText("Your query here", 5);

// Connect entities (runs graph construction → storage)
await db.addVerb(sourceId, targetId, { verb: VerbType.RelatedTo });
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
     return [0.1, 0.2, 0.3, ...]; // Return a vector
   };

   // Use it in Brainy
   const db = new BrainyData({
     embeddingFunction: myEmbedder
   });
   ```

2. **Custom Distance Functions** 📏
   ```typescript
   // Define your own distance function
   const myDistance = (a, b) => {
     // Your custom distance calculation
     return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
   };

   // Use it in Brainy
   const db = new BrainyData({
     distanceFunction: myDistance
   });
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
   });
   ```

4. **Augmentations System** 🧠
   ```typescript
   // Create custom augmentations to extend functionality
   const myAugmentation = {
     type: 'memory',
     name: 'my-custom-storage',
     // Implementation details
   };

   // Register with Brainy
   db.registerAugmentation(myAugmentation);
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
await db.init();

// Clear all data
await db.clear();

// Get database status
const status = await db.status();
```

### Working with Nouns (Entities)

```typescript
// Add a noun (automatically vectorized)
const id = await db.add(textOrVector, {
    noun: NounType.Thing,
    // other metadata...
});

// Retrieve a noun
const noun = await db.get(id);

// Update noun metadata
await db.updateMetadata(id, {
    noun: NounType.Thing,
    // updated metadata...
});

// Delete a noun
await db.delete(id);

// Search for similar nouns
const results = await db.search(vectorOrText, numResults);
const textResults = await db.searchText("query text", numResults);

// Search by noun type
const thingNouns = await db.searchByNounTypes([NounType.Thing], numResults);
```

### Working with Verbs (Relationships)

```typescript
// Add a relationship between nouns
await db.addVerb(sourceId, targetId, {
    verb: VerbType.RelatedTo,
    // other metadata...
});

// Get all relationships
const verbs = await db.getAllVerbs();

// Get relationships by source noun
const outgoingVerbs = await db.getVerbsBySource(sourceId);

// Get relationships by target noun
const incomingVerbs = await db.getVerbsByTarget(targetId);

// Get relationships by type
const containsVerbs = await db.getVerbsByType(VerbType.Contains);

// Get a specific relationship
const verb = await db.getVerb(verbId);

// Delete a relationship
await db.deleteVerb(verbId);
```

## ⚙️ Advanced Configuration

### Custom Embedding

```typescript
import { BrainyData, createSimpleEmbeddingFunction } from '@soulcraft/brainy';

// Use a custom embedding function (faster but less accurate)
const db = new BrainyData({
    embeddingFunction: createSimpleEmbeddingFunction()
});
await db.init();

// Directly embed text to vectors
const vector = await db.embed("Some text to convert to a vector");
```

### Performance Tuning

```typescript
import { BrainyData, euclideanDistance } from '@soulcraft/brainy';

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
        // Uncomment to use cloud storage:
        // s3Storage: {
        //   bucketName: 'your-bucket',
        //   accessKeyId: 'your-key',
        //   secretAccessKey: 'your-secret',
        //   region: 'us-east-1'
        // }
    }
});
```

## 🧪 Distance Functions

- `cosineDistance` (default)
- `euclideanDistance`
- `manhattanDistance`
- `dotProductDistance`

## 🔋 Embedding Options

- Default: TensorFlow Universal Sentence Encoder (high quality)
- Alternative: Simple character-based embedding (faster)

## 🧰 Extensions

Brainy includes an augmentation system for extending functionality:

- **Memory Augmentations**: Different storage backends
- **Sense Augmentations**: Process raw data
- **Cognition Augmentations**: Reasoning and inference
- **Dialog Augmentations**: Natural language processing
- **Perception Augmentations**: Data interpretation and visualization
- **Activation Augmentations**: Trigger actions

## 🌐 Browser Compatibility

Works in all modern browsers:

- Chrome 86+
- Edge 86+
- Opera 72+
- Chrome for Android 86+

For browsers without OPFS support, falls back to in-memory storage.

## 📚 Examples

The repository includes several examples:

- Web demo: `examples/demo.html`
- Basic usage: `examples/basicUsage.js`
- Custom storage: `examples/customStorage.js`
- Memory augmentations: `examples/memoryAugmentationExample.js`

## 📋 Requirements

- Node.js >= 18.0.0

## 📄 License

[MIT](LICENSE)
