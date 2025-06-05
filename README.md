# Soulcraft Brainy

A combined Graph and Vector database that runs in browsers and Node.js environments. Brainy provides efficient vector
search capabilities with persistent storage options.

## What is Brainy?

Brainy is a lightweight database that combines:

- Vector search (for similarity-based retrieval)
- Graph relationships (for structured data connections)
- Persistent storage (works across sessions)

It's designed to work seamlessly in both browser and server environments.

## How It Works

Brainy combines three key technologies:

1. **Vector Embeddings**: Converts data (text, images, etc.) into numerical vectors that capture semantic meaning
2. **HNSW Algorithm**: Enables fast similarity search through a hierarchical graph structure
3. **Persistent Storage**: Uses the best available storage option for your environment:
    - Browser: Origin Private File System (OPFS)
    - Node.js: File system
    - Server: S3-compatible storage (optional)
    - Fallback: In-memory storage

## What Can You Use It For?

- **Semantic Search**: Find content based on meaning, not just keywords
- **Recommendation Systems**: Suggest similar items based on vector similarity
- **Knowledge Graphs**: Build connected data structures with relationships
- **Data Organization**: Automatically categorize and connect related information
- **AI Applications**: Store and retrieve embeddings for machine learning models

## Installation

```bash
npm install @soulcraft/brainy
```

## Basic Usage

```typescript
import {BrainyData} from '@soulcraft/brainy';

// Create and initialize the database
const db = new BrainyData();
await db.init();

// Add text data (automatically converted to vectors)
const catId = await db.add("Cats are independent pets", {type: 'animal'});
const dogId = await db.add("Dogs are loyal companions", {type: 'animal'});

// Search for similar content
const results = await db.searchText("feline pets", 2);
console.log(results);
// Returns items similar to "feline pets" with their similarity scores

// Add relationships between items
await db.addEdge(catId, dogId, {type: 'related_to'});

// Retrieve data
const cat = await db.get(catId);
console.log(cat);

// Update metadata
await db.updateMetadata(catId, {type: 'animal', size: 'small'});

// Delete data
await db.delete(dogId);
```

## Key Features

- **Automatic Vectorization**: Converts text and data to vector embeddings
- **Fast Similarity Search**: Uses HNSW algorithm for efficient retrieval
- **Cross-Platform**: Works in browsers, Node.js, and server environments
- **Persistent Storage**: Multiple storage options (OPFS, filesystem, cloud)
- **Graph Capabilities**: Create relationships between data points
- **TypeScript Support**: Fully typed API with generics
- **Flexible Configuration**: Customize distance functions, embedding models, and more

## Advanced Usage

### Custom Embedding

```typescript
import {BrainyData, createSimpleEmbeddingFunction} from '@soulcraft/brainy';

// Use a custom embedding function (faster but less accurate)
const db = new BrainyData({
    embeddingFunction: createSimpleEmbeddingFunction()
});
await db.init();

// Directly embed text to vectors
const vector = await db.embed("Some text to convert to a vector");
```

### Configuration Options

```typescript
import {BrainyData, euclideanDistance} from '@soulcraft/brainy';

// Configure with custom options
const db = new BrainyData({
    // Use Euclidean distance instead of default cosine distance
    distanceFunction: euclideanDistance,

    // HNSW index configuration for search performance
    hnsw: {
        M: 16,              // Max connections per node
        efConstruction: 200, // Construction candidate list size
        efSearch: 50,       // Search candidate list size
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

## API Reference

### Core Methods

```typescript
// Initialize the database
await db.init();

// Add data (automatically vectorized)
const id = await db.add(textOrVector, metadata);

// Search by vector or text
const results = await db.search(vectorOrText, numResults);
const textResults = await db.searchText("query text", numResults);

// Manage data
const item = await db.get(id);
await db.updateMetadata(id, newMetadata);
await db.delete(id);

// Graph relationships
await db.addEdge(sourceId, targetId, metadata);
const edges = await db.getAllEdges();

// Database management
await db.clear();
const size = db.size();
const status = await db.status();
```

### Distance Functions

- `cosineDistance` (default)
- `euclideanDistance`
- `manhattanDistance`
- `dotProductDistance`

### Embedding Options

- Default: TensorFlow Universal Sentence Encoder (high quality)
- Alternative: Simple character-based embedding (faster)

## Extensions

Brainy includes an augmentation system for extending functionality:

- **Memory Augmentations**: Different storage backends
- **Sense Augmentations**: Process raw data
- **Cognition Augmentations**: Reasoning and inference
- **Dialog Augmentations**: Natural language processing
- **Perception Augmentations**: Data interpretation and/or visualization
- **Activation Augmentations**: Trigger actions

For detailed documentation on extensions, see the [API docs](https://github.com/soulcraft-labs/brainy/docs).

## Examples

The repository includes several examples:

- Web demo: `examples/demo.html`
- Basic usage: `examples/basicUsage.js`
- Custom storage: `examples/customStorage.js`
- Memory augmentations: `examples/memoryAugmentationExample.js`

## Browser Compatibility

Works in all modern browsers:

- Chrome 86+
- Edge 86+
- Opera 72+
- Chrome for Android 86+

For browsers without OPFS support, falls back to in-memory storage.

## Requirements

- Node.js >= 18.0.0

## License

MIT
