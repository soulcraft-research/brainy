# Brainy Architecture Diagram

## System Overview
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BRAINY PLATFORM                                    │
│                    Vector Graph Database with AI Pipeline                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ENVIRONMENT DETECTION                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Browser    │    Node.js    │   Serverless   │   Container   │    Server       │
│   (OPFS)    │ (File System) │  (In-Memory)   │ (Adaptive)    │  (S3/Cloud)     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
```

## Core Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BRAINY DATA API                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  add() │ search() │ addVerb() │ get() │ delete() │ backup() │ restore() │ etc. │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            AUGMENTATION PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│ SENSE → MEMORY → COGNITION → CONDUIT → ACTIVATION → PERCEPTION → DIALOG → WS   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA PROCESSING                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                    Text/JSON → Embedding → Vector Storage                       │
│                              │                                                  │
│    ┌─────────────────────────┼─────────────────────────┐                       │
│    │      EMBEDDING          │       VECTOR INDEX      │                       │
│    │                         │                         │                       │
│    │  TensorFlow.js          │    HNSW Algorithm       │                       │
│    │  Universal Sentence     │    - Hierarchical       │                       │
│    │  Encoder (USE)          │    - Fast Similarity    │                       │
│    │  - GPU Acceleration     │    - Configurable       │                       │
│    │  - Batch Processing     │    - Memory Efficient   │                       │
│    │  - Worker Threads       │    - Product Quantized  │                       │
│    └─────────────────────────┼─────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
```

## Data Model & Graph Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               GRAPH DATA MODEL                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                    NOUNS (Entities/Nodes)                                      │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ Core Entity Types:        │ Digital/Content Types:                     │   │
│   │ • Person                  │ • Document                                  │   │
│   │ • Organization            │ • Media                                     │   │
│   │ • Location                │ • File                                      │   │
│   │ • Thing                   │ • Message                                   │   │
│   │ • Concept                 │ • Content                                   │   │
│   │ • Event                   │                                             │   │
│   │                           │ Collection Types:                           │   │
│   │ Business/App Types:       │ • Collection                                │   │
│   │ • Product                 │ • Dataset                                   │   │
│   │ • Service                 │                                             │   │
│   │ • User                    │ Descriptive Types:                          │   │
│   │ • Task                    │ • Process, State, Role                      │   │
│   │ • Project                 │ • Topic, Language, Currency, Measurement   │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│                           VERBS (Relationships/Edges)                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ Core Relationships:       │ Social/Organizational:                      │   │
│   │ • RelatedTo               │ • MemberOf, WorksWith                       │   │
│   │ • Contains, PartOf        │ • FriendOf, Follows, Likes                  │   │
│   │ • LocatedAt, References   │ • ReportsTo, Supervises, Mentors            │   │
│   │                           │ • Communicates                              │   │
│   │ Temporal/Causal:          │                                             │   │
│   │ • Precedes, Succeeds      │ Descriptive/Functional:                     │   │
│   │ • Causes, DependsOn       │ • Describes, Defines, Categorizes          │   │
│   │ • Requires                │ • Measures, Evaluates                       │   │
│   │                           │ • Uses, Implements, Extends                 │   │
│   │ Creation/Transformation:  │                                             │   │
│   │ • Creates, Transforms     │ Ownership/Attribution:                      │   │
│   │ • Becomes, Modifies       │ • Owns, AttributedTo                        │   │
│   │ • Consumes                │ • CreatedBy, BelongsTo                      │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Vector Storage & Search Engine

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           VECTOR SEARCH ENGINE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Query Text/Vector → Embedding → HNSW Search → Ranked Results                  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        HNSW INDEX STRUCTURE                             │   │
│  │                                                                         │   │
│  │   Layer 2: ●────────●────────●         (Sparse connections)            │   │
│  │           ╱│        │        │╲                                        │   │
│  │   Layer 1: ●─●──●─●─●─●──●─●─●─●       (Medium density)                │   │
│  │           ╱│││││││││││││││││││││╲                                       │   │
│  │   Layer 0: ●●●●●●●●●●●●●●●●●●●●●●●     (Dense connections)              │   │
│  │                                                                         │   │
│  │   • Hierarchical navigation for fast search                            │   │
│  │   • Configurable M (max connections), efConstruction, efSearch         │   │
│  │   • Memory-efficient with disk-based storage for large datasets       │   │
│  │   • Product quantization for dimensionality reduction                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Storage Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             ADAPTIVE STORAGE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                            ┌─ Hot Cache (RAM) ──┐                             │
│                            │  Most accessed      │                             │
│                            │  LRU eviction       │                             │
│                            │  Auto-tuned size    │                             │
│                            └─────────────────────┘                             │
│                                       │                                        │
│                            ┌─ Warm Cache (Storage) ─┐                         │
│                            │  Recent nodes           │                         │
│                            │  OPFS/Filesystem/S3     │                         │
│                            │  TTL-based              │                         │
│                            └─────────────────────────┘                         │
│                                       │                                        │
│                            ┌─ Cold Storage (Persistent) ─┐                    │
│                            │  All nodes                  │                     │
│                            │  OPFS/Filesystem/S3         │                     │
│                            │  Batch operations           │                     │
│                            └─────────────────────────────┘                     │
│                                                                                 │
│   Environment-Specific Storage Adapters:                                       │
│   ┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐    │
│   │   Browser   │   Node.js   │ Serverless  │ Container   │   Server    │    │
│   │    OPFS     │ FileSystem  │ In-Memory   │ Adaptive    │ S3/Cloud    │    │
│   │ (Fallback:  │  (Backup:   │ (Optional:  │ (Auto-      │ (Multi-     │    │
│   │ IndexedDB)  │  S3/Cloud)  │ S3/Cloud)   │ Detect)     │ Provider)   │    │
│   └─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Augmentation Pipeline System

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         AUGMENTATION PIPELINE FLOW                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ Raw Data → [SENSE] → [MEMORY] → [COGNITION] → [CONDUIT] → [ACTIVATION] →       │
│              │         │           │            │            │                  │
│              ▼         ▼           ▼            ▼            ▼                  │
│           Process   Storage     Reasoning    Data Sync    Actions              │
│           Input     Persist     Inference    External     Triggers             │
│           Convert   Retrieve    Logic Ops    Systems      Responses            │
│                                                                                 │
│                    → [PERCEPTION] → [DIALOG] → [WEBSOCKET] →                   │
│                         │            │           │                              │
│                         ▼            ▼           ▼                              │
│                    Visualization  NLP/Chat   Real-time                         │
│                    Interpretation Response   Streaming                         │
│                    Organization   Context    Communication                     │
│                                                                                 │
│  Execution Modes:                                                              │
│  • SEQUENTIAL: Step-by-step processing                                         │
│  • PARALLEL: Concurrent augmentation execution                                 │
│  • THREADED: Multi-threaded with worker pools                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Performance & Scaling Features

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PERFORMANCE OPTIMIZATIONS                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         MULTITHREADING                                 │   │
│  │                                                                         │   │
│  │  Main Thread  ┌──────────┐  ┌──────────┐  ┌──────────┐                │   │
│  │      ├──────→ │ Worker 1 │  │ Worker 2 │  │ Worker N │                │   │
│  │      │        │Embedding │  │ Search   │  │ Batch    │                │   │
│  │      │        │Generation│  │Operations│  │Processing│                │   │
│  │      ←──────── └──────────┘  └──────────┘  └──────────┘                │   │
│  │                                                                         │   │
│  │  • Web Workers (Browser) / Worker Threads (Node.js)                    │   │
│  │  • Model caching and reuse across workers                              │   │
│  │  • Batch embedding for better performance                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      GPU ACCELERATION                                  │   │
│  │                                                                         │   │
│  │  TensorFlow.js → WebGL Backend → GPU                                   │   │
│  │                ↓                                                       │   │
│  │  Fallback: CPU Backend for compatibility                               │   │
│  │                                                                         │   │
│  │  • Vector similarity calculations                                      │   │
│  │  • Embedding generation                                                │   │
│  │  • Tensor operations                                                   │   │
│  │  • Automatic memory management                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    INTELLIGENT CACHING                                 │   │
│  │                                                                         │   │
│  │  • Auto-tuning based on usage patterns                                 │   │
│  │  • Memory-aware cache sizing                                           │   │
│  │  • Prefetching strategies                                              │   │
│  │  • LRU eviction with batch processing                                  │   │
│  │  • Read-only mode optimizations                                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Cross-Platform Integration

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SYNCHRONIZATION & SCALING                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Browser ←→ WebSocket ←→ Server ←→ S3/Cloud Storage                            │
│     ↓                       ↓                                                   │
│  Browser ←→ WebRTC ←→ Browser (Peer-to-Peer)                                   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      CONDUIT AUGMENTATIONS                              │   │
│  │                                                                         │   │
│  │  WebSocket iConduit:                                                    │   │
│  │  • Browser ↔ Server sync                                               │   │
│  │  • Server ↔ Server sync                                                │   │
│  │  • Real-time data streaming                                            │   │
│  │                                                                         │   │
│  │  WebRTC iConduit:                                                       │   │
│  │  • Direct browser ↔ browser sync                                       │   │
│  │  • Peer-to-peer without server                                         │   │
│  │  • Decentralized data sharing                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                   MODEL CONTROL PROTOCOL (MCP)                         │   │
│  │                                                                         │   │
│  │  External AI Models ←→ MCP Server ←→ Brainy Data & Tools               │   │
│  │                                                                         │   │
│  │  • BrainyMCPAdapter: Data access for external models                   │   │
│  │  • MCPAugmentationToolset: Pipeline tools for models                   │   │
│  │  • BrainyMCPService: WebSocket & REST integration                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Example

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW EXAMPLE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. Input: "Cats are independent pets"                                         │
│     ↓                                                                           │
│  2. SENSE Augmentation: Process raw text                                       │
│     ↓                                                                           │
│  3. Embedding: TensorFlow USE → [0.123, -0.456, 0.789, ...]                  │
│     ↓                                                                           │
│  4. MEMORY Augmentation: Store with metadata                                   │
│     ↓                                                                           │
│  5. HNSW Index: Add vector to hierarchical graph                              │
│     ↓                                                                           │
│  6. Storage: Persist to OPFS/FileSystem/S3                                    │
│                                                                                 │
│  Query: "feline pets" → Embedding → HNSW Search → Ranked Results              │
│  Result: [{text: "Cats are independent pets", similarity: 0.89, id: "123"}]   │
│                                                                                 │
│  Relationship Example:                                                          │
│  addVerb(catId, dogId, VerbType.RelatedTo, {description: "Both are pets"})    │
│  ↓                                                                              │
│  Graph: [Cat] ──RelatedTo──→ [Dog]                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

**Key Architecture Principles:**

1. **Environment Agnostic**: Automatically adapts to browser, Node.js, serverless, container, or server environments
2. **Intelligent Storage**: Multi-tier caching with automatic storage selection (OPFS, filesystem, S3, memory)
3. **Vector + Graph**: Combines semantic vector search with graph relationships in a unified model
4. **Extensible Pipeline**: Modular augmentation system for custom processing and integration
5. **Performance Optimized**: GPU acceleration, multithreading, intelligent caching, and memory management
6. **Scalable Sync**: WebSocket and WebRTC conduits for real-time synchronization across instances
7. **AI Integration**: MCP protocol for external AI model integration and tool access