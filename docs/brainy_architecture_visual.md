# Brainy Architecture Documentation
## Vector Graph Database with AI Pipeline

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Architecture](#core-architecture)
3. [Data Model & Graph Structure](#data-model--graph-structure)
4. [Vector Search Engine](#vector-search-engine)
5. [Storage Architecture](#storage-architecture)
6. [Augmentation Pipeline](#augmentation-pipeline)
7. [Performance Optimizations](#performance-optimizations)
8. [Cross-Platform Integration](#cross-platform-integration)
9. [Data Flow Example](#data-flow-example)

---

## System Overview

Brainy is a powerful, cross-platform vector graph database that intelligently adapts to any environment while providing both semantic vector search and graph relationship capabilities.

```mermaid
graph TD
    A[User Application] --> B[Brainy Platform]
    B --> C[Environment Detection]
    
    C --> D[Browser<br/>OPFS Storage]
    C --> E[Node.js<br/>File System]
    C --> F[Serverless<br/>In-Memory]
    C --> G[Container<br/>Adaptive]
    C --> H[Server<br/>S3/Cloud]
    
    B --> I[Vector Search Engine]
    B --> J[Graph Database]
    B --> K[Augmentation Pipeline]
    
    style B fill:#e1f5fe
    style I fill:#f3e5f5
    style J fill:#e8f5e8
    style K fill:#fff3e0
```

### Key Features

- **Universal Compatibility**: Runs everywhere - browsers, Node.js, serverless functions, containers
- **Intelligent Adaptation**: Automatically optimizes for environment and usage patterns
- **Dual Nature**: Vector similarity search + graph relationships in one system
- **Real-time Streaming**: Live data processing through extensible pipeline
- **AI Integration**: Built-in TensorFlow.js with GPU acceleration

---

## Core Architecture

```mermaid
graph TB
    subgraph "Application Layer"
        API[Brainy Data API<br/>add() | search() | addVerb() | get() | delete()]
    end
    
    subgraph "Processing Layer"
        PIPELINE[Augmentation Pipeline<br/>SENSE → MEMORY → COGNITION → CONDUIT → ACTIVATION → PERCEPTION → DIALOG → WS]
    end
    
    subgraph "Engine Layer"
        EMBED[Embedding Engine<br/>TensorFlow.js Universal Sentence Encoder]
        VECTOR[Vector Index<br/>HNSW Algorithm]
        GRAPH[Graph Engine<br/>Noun-Verb Model]
    end
    
    subgraph "Storage Layer"
        CACHE[Multi-tier Caching<br/>Hot → Warm → Cold]
        STORAGE[Adaptive Storage<br/>OPFS | FileSystem | S3 | Memory]
    end
    
    API --> PIPELINE
    PIPELINE --> EMBED
    PIPELINE --> VECTOR
    PIPELINE --> GRAPH
    EMBED --> CACHE
    VECTOR --> CACHE
    GRAPH --> STORAGE
    CACHE --> STORAGE
    
    style API fill:#e3f2fd
    style PIPELINE fill:#f1f8e9
    style EMBED fill:#fce4ec
    style VECTOR fill:#fff8e1
    style GRAPH fill:#e8f5e8
    style CACHE fill:#f3e5f5
    style STORAGE fill:#efebe9
```

---

## Data Model & Graph Structure

### Noun Types (Entities/Nodes)

```mermaid
mindmap
  root((Brainy<br/>Noun Types))
    Core Entities
      Person
      Organization
      Location
      Thing
      Concept
      Event
    Digital Content
      Document
      Media
      File
      Message
      Content
    Collections
      Collection
      Dataset
    Business/App
      Product
      Service
      User
      Task
      Project
    Descriptive
      Process
      State
      Role
      Topic
      Language
      Currency
      Measurement
```

### Verb Types (Relationships/Edges)

```mermaid
mindmap
  root((Brainy<br/>Verb Types))
    Core Relations
      RelatedTo
      Contains
      PartOf
      LocatedAt
      References
    Temporal/Causal
      Precedes
      Succeeds
      Causes
      DependsOn
      Requires
    Creation/Transform
      Creates
      Transforms
      Becomes
      Modifies
      Consumes
    Ownership/Attribution
      Owns
      AttributedTo
      CreatedBy
      BelongsTo
    Social/Organizational
      MemberOf
      WorksWith
      FriendOf
      Follows
      Likes
      ReportsTo
      Supervises
      Mentors
      Communicates
    Descriptive/Functional
      Describes
      Defines
      Categorizes
      Measures
      Evaluates
      Uses
      Implements
      Extends
```

### Graph Example

```mermaid
graph LR
    A[Person: John Doe<br/>ID: person-123] -->|WorksWith| B[Organization: Acme Corp<br/>ID: org-456]
    A -->|CreatedBy| C[Document: Report<br/>ID: doc-789]
    A -->|LocatedAt| D[Location: New York<br/>ID: loc-101]
    B -->|Contains| E[Project: AI Initiative<br/>ID: proj-202]
    C -->|PartOf| E
    E -->|Uses| F[Concept: Machine Learning<br/>ID: concept-303]
    
    style A fill:#ffcdd2
    style B fill:#c8e6c9
    style C fill:#bbdefb
    style D fill:#fff9c4
    style E fill:#f8bbd9
    style F fill:#d1c4e9
```

---

## Vector Search Engine

### HNSW Index Structure

```mermaid
graph TB
    subgraph "HNSW Hierarchical Structure"
        subgraph "Layer 2 (Sparse)"
            L2A((●)) --- L2B((●))
            L2B --- L2C((●))
        end
        
        subgraph "Layer 1 (Medium Density)"
            L1A((●)) --- L1B((●))
            L1B --- L1C((●))
            L1C --- L1D((●))
            L1D --- L1E((●))
            L1E --- L1F((●))
            L1F --- L1G((●))
            L1G --- L1H((●))
        end
        
        subgraph "Layer 0 (Dense Connections)"
            L0A((●)) --- L0B((●))
            L0B --- L0C((●))
            L0C --- L0D((●))
            L0D --- L0E((●))
            L0E --- L0F((●))
            L0F --- L0G((●))
            L0G --- L0H((●))
            L0H --- L0I((●))
            L0I --- L0J((●))
            L0J --- L0K((●))
            L0K --- L0L((●))
            L0L --- L0M((●))
            L0M --- L0N((●))
            L0N --- L0O((●))
            L0O --- L0P((●))
        end
        
        L2A -.-> L1A
        L2A -.-> L1D
        L2B -.-> L1C
        L2B -.-> L1F
        L2C -.-> L1G
        
        L1A -.-> L0A
        L1A -.-> L0B
        L1B -.-> L0C
        L1B -.-> L0D
        L1C -.-> L0E
        L1C -.-> L0F
        L1D -.-> L0G
        L1D -.-> L0H
        L1E -.-> L0I
        L1E -.-> L0J
        L1F -.-> L0K
        L1F -.-> L0L
        L1G -.-> L0M
        L1G -.-> L0N
        L1H -.-> L0O
        L1H -.-> L0P
    end
    
    style L2A fill:#ff9999
    style L2B fill:#ff9999
    style L2C fill:#ff9999
    style L1A fill:#99ccff
    style L1B fill:#99ccff
    style L1C fill:#99ccff
    style L1D fill:#99ccff
    style L1E fill:#99ccff
    style L1F fill:#99ccff
    style L1G fill:#99ccff
    style L1H fill:#99ccff
    style L0A fill:#99ff99
    style L0B fill:#99ff99
    style L0C fill:#99ff99
    style L0D fill:#99ff99
    style L0E fill:#99ff99
    style L0F fill:#99ff99
    style L0G fill:#99ff99
    style L0H fill:#99ff99
    style L0I fill:#99ff99
    style L0J fill:#99ff99
    style L0K fill:#99ff99
    style L0L fill:#99ff99
    style L0M fill:#99ff99
    style L0N fill:#99ff99
    style L0O fill:#99ff99
    style L0P fill:#99ff99
```

### Search Process Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Embedding
    participant HNSW
    participant Storage
    
    User->>API: searchText("feline pets", 5)
    API->>Embedding: embed("feline pets")
    Embedding->>Embedding: TensorFlow.js Universal Sentence Encoder
    Embedding-->>API: [0.123, -0.456, 0.789, ...]
    
    API->>HNSW: search(vector, k=5)
    HNSW->>HNSW: Navigate from top layer
    HNSW->>HNSW: Descend to lower layers
    HNSW->>HNSW: Find k nearest neighbors
    HNSW-->>API: [id1, id2, id3, id4, id5]
    
    API->>Storage: get([id1, id2, id3, id4, id5])
    Storage-->>API: [noun1, noun2, noun3, noun4, noun5]
    
    API-->>User: [{text: "Cats are independent pets", similarity: 0.89}, ...]
```

---

## Storage Architecture

### Multi-Tier Caching System

```mermaid
graph TD
    subgraph "Memory Hierarchy"
        subgraph "Hot Cache (RAM)"
            HC[Most Accessed Items<br/>LRU Eviction<br/>Auto-tuned Size<br/>Millisecond Access]
        end
        
        subgraph "Warm Cache (Storage)"
            WC[Recent Items<br/>TTL-based<br/>Sub-second Access<br/>OPFS/FS/S3]
        end
        
        subgraph "Cold Storage (Persistent)"
            CS[All Items<br/>Batch Operations<br/>Full Persistence<br/>OPFS/FS/S3]
        end
    end
    
    subgraph "Environment Adapters"
        Browser[Browser<br/>OPFS → IndexedDB]
        NodeJS[Node.js<br/>FileSystem → S3]
        Serverless[Serverless<br/>Memory → S3]
        Container[Container<br/>Auto-detect]
        Server[Server<br/>S3/Multi-cloud]
    end
    
    User[User Query] --> HC
    HC -->|Cache Miss| WC
    WC -->|Cache Miss| CS
    
    CS --> Browser
    CS --> NodeJS
    CS --> Serverless
    CS --> Container
    CS --> Server
    
    style HC fill:#ffcdd2
    style WC fill:#fff9c4
    style CS fill:#c8e6c9
    style Browser fill:#e1f5fe
    style NodeJS fill:#e8f5e8
    style Serverless fill:#f3e5f5
    style Container fill:#fff3e0
    style Server fill:#efebe9
```

### Storage Performance Characteristics

```mermaid
xychart-beta
    title "Storage Performance by Environment"
    x-axis [Browser, Node.js, Serverless, Container, Server]
    y-axis "Latency (ms)" 0 --> 1000
    line [50, 10, 200, 30, 100]
```

---

## Augmentation Pipeline

### Pipeline Flow Architecture

```mermaid
flowchart LR
    subgraph "Data Processing Pipeline"
        Input[Raw Data] --> SENSE[SENSE<br/>Process Input<br/>Convert & Validate]
        SENSE --> MEMORY[MEMORY<br/>Storage Operations<br/>Persist & Retrieve]
        MEMORY --> COGNITION[COGNITION<br/>Reasoning<br/>Inference & Logic]
        COGNITION --> CONDUIT[CONDUIT<br/>Data Sync<br/>External Systems]
        CONDUIT --> ACTIVATION[ACTIVATION<br/>Actions<br/>Triggers & Events]
        ACTIVATION --> PERCEPTION[PERCEPTION<br/>Visualization<br/>Interpretation]
        PERCEPTION --> DIALOG[DIALOG<br/>NLP & Chat<br/>Context & Response]
        DIALOG --> WEBSOCKET[WEBSOCKET<br/>Real-time<br/>Streaming & Sync]
        WEBSOCKET --> Output[Processed Output]
    end
    
    subgraph "Execution Modes"
        SEQ[Sequential<br/>Step-by-step]
        PAR[Parallel<br/>Concurrent]
        THR[Threaded<br/>Worker Pools]
    end
    
    Input -.-> SEQ
    Input -.-> PAR
    Input -.-> THR
    
    style SENSE fill:#e8f5e8
    style MEMORY fill:#e3f2fd
    style COGNITION fill:#fff3e0
    style CONDUIT fill:#f3e5f5
    style ACTIVATION fill:#ffebee
    style PERCEPTION fill:#e0f2f1
    style DIALOG fill:#fce4ec
    style WEBSOCKET fill:#e8eaf6
```

### Augmentation Types Detail

```mermaid
mindmap
  root((Augmentation<br/>System))
    SENSE
      Process Raw Data
      Listen to Feeds
      Data Validation
      Format Conversion
    MEMORY
      Store Data
      Retrieve Data
      Update Data
      Delete Data
      List Keys
    COGNITION
      Reason
      Infer
      Execute Logic
      Pattern Recognition
    CONDUIT
      Establish Connection
      Read Data
      Write Data
      Monitor Stream
      Sync Instances
    ACTIVATION
      Trigger Actions
      Generate Output
      Interact External
      Event Handling
    PERCEPTION
      Interpret Data
      Organize Info
      Generate Visualization
      Context Analysis
    DIALOG
      Process User Input
      Generate Response
      Manage Context
      NLP Operations
    WEBSOCKET
      Connect WebSocket
      Send Messages
      Message Callbacks
      Stream Monitoring
```

---

## Performance Optimizations

### Multithreading Architecture

```mermaid
graph TB
    subgraph "Main Thread"
        MT[Main Thread<br/>Coordination & API]
    end
    
    subgraph "Worker Pool"
        W1[Worker 1<br/>Embedding<br/>Generation]
        W2[Worker 2<br/>Vector<br/>Search]
        W3[Worker 3<br/>Batch<br/>Processing]
        WN[Worker N<br/>Custom<br/>Operations]
    end
    
    subgraph "GPU Acceleration"
        GPU[TensorFlow.js<br/>WebGL Backend<br/>GPU Compute]
        CPU[CPU Fallback<br/>Compatibility<br/>Mode]
    end
    
    MT -->|Distribute Tasks| W1
    MT -->|Distribute Tasks| W2
    MT -->|Distribute Tasks| W3
    MT -->|Distribute Tasks| WN
    
    W1 --> GPU
    W2 --> GPU
    W3 --> GPU
    WN --> GPU
    
    GPU -.->|Fallback| CPU
    
    W1 -->|Results| MT
    W2 -->|Results| MT
    W3 -->|Results| MT
    WN -->|Results| MT
    
    style MT fill:#e3f2fd
    style W1 fill:#e8f5e8
    style W2 fill:#e8f5e8
    style W3 fill:#e8f5e8
    style WN fill:#e8f5e8
    style GPU fill:#ffebee
    style CPU fill:#fff3e0
```

### Performance Metrics

```mermaid
xychart-beta
    title "Performance Improvements with Optimizations"
    x-axis [Baseline, Caching, Multithreading, GPU, All Combined]
    y-axis "Operations/Second" 0 --> 10000
    bar [1000, 3000, 5000, 7000, 9500]
```

---

## Cross-Platform Integration

### Synchronization Network

```mermaid
graph TB
    subgraph "Browser Instances"
        B1[Browser 1]
        B2[Browser 2]
        B3[Browser 3]
    end
    
    subgraph "Server Infrastructure"
        WS[WebSocket Server]
        API[REST API Server]
        S3[S3/Cloud Storage]
    end
    
    subgraph "Peer-to-Peer"
        STUN[STUN Server]
        SIGNAL[Signaling Server]
    end
    
    subgraph "External AI"
        MCP[MCP Server]
        AI[AI Models]
    end
    
    B1 <-->|WebSocket| WS
    B2 <-->|WebSocket| WS
    B3 <-->|WebSocket| WS
    
    B1 <-.->|WebRTC| B2
    B2 <-.->|WebRTC| B3
    B1 <-.->|WebRTC| B3
    
    WS <--> S3
    API <--> S3
    
    B1 -.->|Signaling| SIGNAL
    B2 -.->|Signaling| SIGNAL
    B3 -.->|Signaling| SIGNAL
    
    SIGNAL -.-> STUN
    
    WS <--> MCP
    MCP <--> AI
    
    style B1 fill:#e3f2fd
    style B2 fill:#e3f2fd
    style B3 fill:#e3f2fd
    style WS fill:#e8f5e8
    style API fill:#e8f5e8
    style S3 fill:#fff3e0
    style MCP fill:#f3e5f5
    style AI fill:#ffebee
```

### Model Control Protocol (MCP) Integration

```mermaid
sequenceDiagram
    participant AI as External AI Model
    participant MCP as MCP Server
    participant Adapter as Brainy MCP Adapter
    participant Brainy as Brainy Database
    
    AI->>MCP: Request data access
    MCP->>Adapter: Forward request
    Adapter->>Brainy: Query data
    Brainy-->>Adapter: Return results
    Adapter-->>MCP: Formatted response
    MCP-->>AI: Data payload
    
    AI->>MCP: Execute augmentation
    MCP->>Adapter: Pipeline request
    Adapter->>Brainy: Run augmentation
    Brainy-->>Adapter: Processing result
    Adapter-->>MCP: Tool response
    MCP-->>AI: Execution result
```

---

## Data Flow Example

### Complete Processing Pipeline

```mermaid
flowchart TD
    subgraph "Input Processing"
        I1[Input: "Cats are independent pets"]
        I2[Metadata: {noun: "Thing", category: "animal"}]
    end
    
    subgraph "Embedding Generation"
        E1[TensorFlow.js Universal Sentence Encoder]
        E2[Vector: [0.123, -0.456, 0.789, ...]]
    end
    
    subgraph "Storage & Indexing"
        S1[Store in Multi-tier Cache]
        S2[Add to HNSW Index]
        S3[Persist to Storage Layer]
    end
    
    subgraph "Query Processing"
        Q1[Query: "feline pets"]
        Q2[Generate Query Vector]
        Q3[HNSW Similarity Search]
        Q4[Retrieve & Rank Results]
    end
    
    subgraph "Graph Operations"
        G1[Add Relationship]
        G2[catId --RelatedTo--> dogId]
        G3[Store Verb Metadata]
    end
    
    I1 --> E1
    I2 --> E1
    E1 --> E2
    E2 --> S1
    S1 --> S2
    S2 --> S3
    
    Q1 --> Q2
    Q2 --> Q3
    Q3 --> Q4
    
    E2 -.-> G1
    G1 --> G2
    G2 --> G3
    
    style I1 fill:#e8f5e8
    style E1 fill:#e3f2fd
    style E2 fill:#f3e5f5
    style S1 fill:#fff3e0
    style Q1 fill:#e8f5e8
    style Q4 fill:#ffebee
    style G2 fill:#e0f2f1
```

### Result Example

```json
{
  "results": [
    {
      "id": "noun-123",
      "text": "Cats are independent pets",
      "similarity": 0.89,
      "metadata": {
        "noun": "Thing",
        "category": "animal"
      }
    }
  ],
  "query": "feline pets",
  "processingTime": "15ms",
  "cacheHit": false
}
```

---

## Key Architecture Principles

### 🌐 **Environment Agnostic**
Automatically adapts to browser, Node.js, serverless, container, or server environments without code changes.

### 🧠 **Intelligent Storage**
Multi-tier caching with automatic storage selection optimizes for performance and persistence across platforms.

### 🔍 **Vector + Graph Unified**
Combines semantic vector search with graph relationships in a single, coherent data model.

### 🔧 **Extensible Pipeline**
Modular augmentation system allows custom processing, AI integration, and workflow automation.

### ⚡ **Performance Optimized**
GPU acceleration, multithreading, intelligent caching, and memory management deliver enterprise-grade performance.

### 🔄 **Scalable Synchronization**
WebSocket and WebRTC conduits enable real-time synchronization across instances and platforms.

### 🤖 **AI Integration Ready**
Built-in MCP protocol support allows external AI models to access Brainy data and utilize augmentation tools.

---

*Generated from Brainy v0.34.0 Architecture Documentation*