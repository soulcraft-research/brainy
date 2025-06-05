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

## Data Model

Brainy uses a graph-based data model with two primary concepts:

1. **Nouns**: The main entities in your data (nodes in the graph)
    - Each noun has a unique ID, vector representation, and metadata
    - Nouns can be categorized by type (Person, Place, Thing, Event, Concept, etc.)
    - Nouns are automatically vectorized for similarity search

2. **Verbs**: Relationships between nouns (edges in the graph)
    - Each verb connects a source noun to a target noun
    - Verbs have types that define the relationship (RelatedTo, Controls, Contains, etc.)
    - Verbs can have their own metadata to describe the relationship

## What Can You Use It For?

- **Semantic Search**: Find content based on meaning, not just keywords
- **Recommendation Systems**: Suggest similar items based on vector similarity
- **Knowledge Graphs**: Build connected data structures with relationships
- **Data Organization**: Automatically categorize and connect related information
- **AI Applications**: Store and retrieve embeddings for machine learning models

## Installation

Due to a dependency conflict between TensorFlow.js packages, you need to use the `--legacy-peer-deps` flag when
installing:

```bash
npm install @soulcraft/brainy --legacy-peer-deps
```

If you encounter an error like this:

```
npm error ERESOLVE unable to resolve dependency tree
npm error Found: @tensorflow/tfjs-core@4.22.0
npm error Could not resolve dependency: peer @tensorflow/tfjs-core@"3.21.0" from @tensorflow/tfjs-converter@3.21.0
```

Use the `--legacy-peer-deps` flag as shown above to resolve it.

## Command Line Interface

Brainy includes a command-line interface (CLI) that allows you to experiment with the API and data directly from the
terminal.

### Using the CLI during development

```bash
# Run the CLI directly from the source
npm run cli help

# Initialize a database
npm run cli init

# Add some data
npm run cli add "Cats are independent pets" '{"noun":"Thing","category":"animal"}'
npm run cli add "Dogs are loyal companions" '{"noun":"Thing","category":"animal"}'

# Search for similar items
npm run cli search "feline pets" 5

# Add relationships between items
npm run cli addVerb <sourceId> <targetId> RelatedTo '{"description":"Both are pets"}'

# View database status
npm run cli status
```

### Installing the CLI globally

```bash
# Install the package globally (with --legacy-peer-deps to resolve TensorFlow.js dependency conflicts)
npm install -g @soulcraft/brainy --legacy-peer-deps

# Now you can use the 'brainy' command directly
brainy help
brainy init
brainy add "Some text" '{"noun":"Thing"}'
```

### Available Commands

- `init` - Initialize a new database
- `add <text> [metadata]` - Add a new noun with the given text and optional metadata
- `search <query> [limit]` - Search for nouns similar to the query
- `get <id>` - Get a noun by ID
- `delete <id>` - Delete a noun by ID
- `addVerb <sourceId> <targetId> <verbType> [metadata]` - Add a relationship between nouns
- `getVerbs <id>` - Get all relationships for a noun
- `status` - Show database status
- `completion-setup` - Setup shell autocomplete for the Brainy CLI

### Autocomplete

The CLI supports autocomplete for commands, noun types, and verb types. To enable autocomplete:

```bash
# Set up autocomplete for your shell
brainy completion-setup

# Restart your shell or source your shell configuration file
# For bash:
source ~/.bashrc

# For zsh:
source ~/.zshrc
```

Once enabled, you can use tab completion for:
- Commands (e.g., `brainy a<tab>` completes to `brainy add`)
- Noun types in metadata (e.g., when adding nouns)
- Verb types (e.g., when adding relationships)

## Basic Usage

```typescript
import {BrainyData, NounType, VerbType} from '@soulcraft/brainy';

// Create and initialize the database
const db = new BrainyData();
await db.init();

// Add nouns (automatically converted to vectors)
const catId = await db.add("Cats are independent pets", {
  noun: NounType.Thing,
  category: 'animal'
});

const dogId = await db.add("Dogs are loyal companions", {
  noun: NounType.Thing,
  category: 'animal'
});

// Search for similar nouns
const results = await db.searchText("feline pets", 2);
console.log(results);
// Returns nouns similar to "feline pets" with their similarity scores

// Add a verb (relationship) between nouns
await db.addVerb(catId, dogId, {
  verb: VerbType.RelatedTo,
  description: 'Both are common household pets'
});

// Retrieve a noun
const cat = await db.get(catId);
console.log(cat);

// Get all relationships for a noun
const catRelationships = await db.getVerbsBySource(catId);
console.log(catRelationships);

// Update noun metadata
await db.updateMetadata(catId, {
  noun: NounType.Thing,
  category: 'animal',
  size: 'small'
});

// Delete a noun
await db.delete(dogId);
```

## Key Features

- **Automatic Vectorization**: Converts text and data to vector embeddings
- **Fast Similarity Search**: Uses HNSW algorithm for efficient retrieval
- **Noun-Based Data Model**: Organize entities with typed categorization (Person, Place, Thing, etc.)
- **Verb-Based Relationships**: Create meaningful connections between nouns with typed relationships
- **Cross-Platform**: Works in browsers, Node.js, and server environments
- **Persistent Storage**: Multiple storage options (OPFS, filesystem, cloud)
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

## API Reference

### Database Methods

```typescript
// Initialize the database
await db.init();

// Database management
await db.clear();
const size = db.size();
const status = await db.status();
```

### Noun Methods (Entities)

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

### Verb Methods (Relationships)

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
