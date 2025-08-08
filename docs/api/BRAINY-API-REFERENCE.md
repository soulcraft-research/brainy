# 🧠⚛️ Brainy API & MCP Interface Documentation

## Complete Guide to Brainy's Exposed APIs and Model Control Protocol

---

## Table of Contents

1. [Overview](#overview)
2. [REST API](#rest-api)
3. [WebSocket API](#websocket-api)
4. [MCP Interface](#mcp-interface)
5. [GraphQL API](#graphql-api)
6. [Service Integration Patterns](#service-integration-patterns)
7. [Authentication & Security](#authentication--security)
8. [Docker Deployment](#docker-deployment)
9. [API Gateway Configuration](#api-gateway-configuration)
10. [Client Libraries](#client-libraries)

---

## Overview

When deployed on Docker, Brainy exposes **multiple API interfaces** on a single port (default: 3000):

```yaml
# What gets exposed on port 3000:
- REST API        # HTTP/HTTPS endpoints
- WebSocket       # Real-time bidirectional communication
- MCP Interface   # Model Control Protocol for AI models
- GraphQL         # Optional GraphQL endpoint
- Metrics         # Prometheus metrics endpoint
```

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
├─────────────────────────────────────────────────────────────┤
│ Web Apps │ Mobile │ Microservices │ AI Models │ Analytics  │
└────┬─────┴───┬────┴──────┬────────┴─────┬─────┴─────┬──────┘
     │         │           │              │           │
     ▼         ▼           ▼              ▼           ▼
   REST    WebSocket    GraphQL        MCP        Metrics
     │         │           │              │           │
     └─────────┴───────────┴──────────────┴───────────┘
                           │
                    ┌──────▼──────┐
                    │  Port 3000  │
                    ├─────────────┤
                    │   BRAINY    │
                    │   Docker    │
                    │  Container  │
                    └─────────────┘
```

---

## REST API

### Base Configuration

```typescript
// server.ts - Brainy API Server
import express from 'express'
import { BrainyData } from '@soulcraft/brainy'

const app = express()
const brainy = new BrainyData()

app.use(express.json())
app.use(cors())

// Initialize
await brainy.init()

// API Routes
app.use('/api/v1', apiRoutes)
app.use('/health', healthRoutes)
app.use('/metrics', metricsRoutes)

app.listen(3000, () => {
  console.log('🧠⚛️ Brainy API Server running on port 3000')
})
```

### Core Endpoints

#### Data Operations

```typescript
// POST /api/v1/add
// Add data to Brainy with Neural Import processing
app.post('/api/v1/add', async (req, res) => {
  const { data, metadata, options } = req.body
  
  try {
    // Neural Import automatically processes this
    const id = await brainy.add(data, metadata, options)
    
    res.json({
      success: true,
      id,
      message: 'Data added and processed by augmentations'
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/v1/search
// Vector + Graph search
app.get('/api/v1/search', async (req, res) => {
  const { query, k = 10, filter, depth } = req.query
  
  const results = await brainy.search(query, {
    k: parseInt(k),
    filter,
    graphDepth: depth ? parseInt(depth) : undefined
  })
  
  res.json({ success: true, results })
})

// GET /api/v1/get/:id
// Get specific item
app.get('/api/v1/get/:id', async (req, res) => {
  const item = await brainy.get(req.params.id)
  res.json({ success: true, item })
})

// PUT /api/v1/update/:id
// Update existing item
app.put('/api/v1/update/:id', async (req, res) => {
  const { data, metadata } = req.body
  await brainy.update(req.params.id, data, metadata)
  res.json({ success: true, message: 'Updated' })
})

// DELETE /api/v1/delete/:id
// Delete item
app.delete('/api/v1/delete/:id', async (req, res) => {
  await brainy.delete(req.params.id)
  res.json({ success: true, message: 'Deleted' })
})
```

#### Graph Operations

```typescript
// POST /api/v1/graph/relate
// Create relationships
app.post('/api/v1/graph/relate', async (req, res) => {
  const { sourceId, targetId, verb, metadata } = req.body
  
  await brainy.relate(sourceId, targetId, verb, metadata)
  
  res.json({ success: true, message: 'Relationship created' })
})

// GET /api/v1/graph/traverse
// Graph traversal
app.get('/api/v1/graph/traverse', async (req, res) => {
  const { startId, verb, depth = 2, direction = 'outbound' } = req.query
  
  const results = await brainy.traverse(startId, {
    verb,
    depth: parseInt(depth),
    direction
  })
  
  res.json({ success: true, results })
})

// GET /api/v1/graph/neighbors/:id
// Get neighbors
app.get('/api/v1/graph/neighbors/:id', async (req, res) => {
  const { verb, direction = 'both' } = req.query
  
  const neighbors = await brainy.getNeighbors(req.params.id, {
    verb,
    direction
  })
  
  res.json({ success: true, neighbors })
})
```

#### Augmentation Management

```typescript
// GET /api/v1/augmentations
// List all augmentations
app.get('/api/v1/augmentations', async (req, res) => {
  const augmentations = brainy.listAugmentations()
  
  res.json({
    success: true,
    augmentations,
    pipelines: {
      sense: augmentations.filter(a => a.type === 'SENSE'),
      conduit: augmentations.filter(a => a.type === 'CONDUIT'),
      cognition: augmentations.filter(a => a.type === 'COGNITION'),
      memory: augmentations.filter(a => a.type === 'MEMORY')
    }
  })
})

// POST /api/v1/augmentations
// Add new augmentation
app.post('/api/v1/augmentations', async (req, res) => {
  const { type, name, config } = req.body
  
  // Load augmentation dynamically
  const augmentation = await loadAugmentation(config)
  
  await brainy.addAugmentation(type, augmentation, {
    name,
    autoStart: true
  })
  
  res.json({ success: true, message: `Augmentation ${name} added` })
})

// POST /api/v1/augmentations/:name/trigger
// Manually trigger augmentation
app.post('/api/v1/augmentations/:name/trigger', async (req, res) => {
  const { name } = req.params
  const { options } = req.body
  
  const augmentation = brainy.getAugmentation(name)
  const result = await augmentation.trigger(options)
  
  res.json({ success: true, result })
})
```

#### Batch Operations

```typescript
// POST /api/v1/batch/add
// Bulk add data
app.post('/api/v1/batch/add', async (req, res) => {
  const { items } = req.body // Array of { data, metadata }
  
  const ids = await Promise.all(
    items.map(item => brainy.add(item.data, item.metadata))
  )
  
  res.json({ success: true, ids, count: ids.length })
})

// POST /api/v1/batch/search
// Multiple searches
app.post('/api/v1/batch/search', async (req, res) => {
  const { queries } = req.body // Array of search queries
  
  const results = await Promise.all(
    queries.map(q => brainy.search(q.query, q.options))
  )
  
  res.json({ success: true, results })
})
```

---

## WebSocket API

### Real-time Connection

```typescript
// server.ts - WebSocket setup
import { Server } from 'socket.io'

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  // Real-time data operations
  socket.on('add', async (data, callback) => {
    try {
      const id = await brainy.add(data.content, data.metadata)
      callback({ success: true, id })
      
      // Broadcast to all clients
      io.emit('data:added', { id, timestamp: new Date() })
    } catch (error) {
      callback({ success: false, error: error.message })
    }
  })
  
  // Real-time search
  socket.on('search', async (query, callback) => {
    const results = await brainy.search(query.text, query.options)
    callback({ success: true, results })
  })
  
  // Cortex commands
  socket.on('cortex:command', async (command, callback) => {
    const result = await executeCortexCommand(command)
    callback({ success: true, result })
  })
  
  // Subscribe to augmentation events
  socket.on('subscribe:augmentations', () => {
    socket.join('augmentation-events')
  })
  
  // Real-time augmentation notifications
  brainy.on('augmentation:triggered', (data) => {
    io.to('augmentation-events').emit('augmentation:triggered', data)
  })
  
  brainy.on('augmentation:complete', (data) => {
    io.to('augmentation-events').emit('augmentation:complete', data)
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})
```

### Client Connection Examples

```javascript
// JavaScript/TypeScript Client
import io from 'socket.io-client'

const socket = io('http://brainy-server:3000')

// Add data
socket.emit('add', {
  content: 'John works at Acme Corp',
  metadata: { source: 'web-app' }
}, (response) => {
  console.log('Added:', response.id)
})

// Subscribe to events
socket.on('data:added', (data) => {
  console.log('New data added:', data)
})

socket.on('augmentation:complete', (data) => {
  console.log('Augmentation complete:', data)
})
```

```python
# Python Client
import socketio

sio = socketio.Client()

@sio.on('connect')
def on_connect():
    print('Connected to Brainy')
    
@sio.on('data:added')
def on_data_added(data):
    print(f"New data: {data['id']}")

sio.connect('http://brainy-server:3000')
sio.emit('add', {'content': 'Test data'})
```

---

## MCP Interface

### Model Control Protocol for AI Integration

MCP allows AI models (like Claude, GPT, etc.) to access Brainy's data and use augmentations as tools.

```typescript
// server.ts - MCP Interface setup
import { BrainyMCPService } from '@soulcraft/brainy'

// Initialize MCP Service
const mcpService = new BrainyMCPService(brainy, {
  port: 3001, // Optional separate port, or use same as REST
  enableWebSocket: true,
  enableREST: true
})

// Start MCP server
await mcpService.start()

// Or add MCP to existing Express app
app.use('/mcp', mcpService.getExpressMiddleware())

// WebSocket MCP
io.on('connection', (socket) => {
  socket.on('mcp:request', async (request, callback) => {
    const response = await mcpService.handleMCPRequest(request)
    callback(response)
  })
})
```

### MCP Request Types

```typescript
// 1. Data Access Request
{
  type: 'data_access',
  operation: 'search',
  requestId: 'req_123',
  version: '1.0.0',
  parameters: {
    query: 'Find all documents about AI',
    k: 10,
    filter: { type: 'document' }
  }
}

// 2. Tool Execution Request (Augmentations)
{
  type: 'tool_execution',
  toolName: 'brainy_sense_processRawData',
  requestId: 'req_124',
  version: '1.0.0',
  parameters: {
    args: ['Raw text data', 'text', {}]
  }
}

// 3. Pipeline Execution Request
{
  type: 'pipeline_execution',
  pipeline: 'SENSE',
  method: 'processRawData',
  requestId: 'req_125',
  version: '1.0.0',
  parameters: {
    data: 'Complex document text',
    options: { enableDeepAnalysis: true }
  }
}
```

### Available MCP Tools

```typescript
// MCP exposes augmentations as tools for AI models

// SENSE Tools (Neural Import)
'brainy_sense_processRawData'      // Process raw data
'brainy_sense_extractEntities'     // Extract entities
'brainy_sense_analyzeRelationships' // Analyze relationships

// MEMORY Tools
'brainy_memory_storeData'          // Store in enhanced memory
'brainy_memory_retrieveData'       // Retrieve from memory
'brainy_memory_queryMemory'        // Query memory

// CONDUIT Tools
'brainy_conduit_syncNotion'        // Sync with Notion
'brainy_conduit_syncSalesforce'    // Sync with Salesforce
'brainy_conduit_triggerWebhook'    // Trigger webhooks

// COGNITION Tools
'brainy_cognition_analyze'         // Deep analysis
'brainy_cognition_reason'          // Reasoning
'brainy_cognition_infer'           // Inference

// PERCEPTION Tools
'brainy_perception_detectPatterns' // Pattern detection
'brainy_perception_findAnomalies'  // Anomaly detection
'brainy_perception_cluster'        // Clustering

// DIALOG Tools
'brainy_dialog_translate'          // Translation
'brainy_dialog_summarize'          // Summarization
'brainy_dialog_generateResponse'   // Response generation

// ACTIVATION Tools
'brainy_activation_trigger'        // Trigger automation
'brainy_activation_schedule'       // Schedule tasks
'brainy_activation_executeWorkflow' // Execute workflows
```

### AI Model Integration Example

```typescript
// claude-integration.ts
// How Claude or other AI models can use Brainy via MCP

import { Anthropic } from '@anthropic-ai/sdk'

const claude = new Anthropic()

// Define Brainy MCP tools for Claude
const brainyTools = [
  {
    name: 'search_brainy',
    description: 'Search the Brainy vector + graph database',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        k: { type: 'number', description: 'Number of results' }
      },
      required: ['query']
    }
  },
  {
    name: 'add_to_brainy',
    description: 'Add data to Brainy with AI processing',
    input_schema: {
      type: 'object',
      properties: {
        data: { type: 'string', description: 'Data to add' },
        metadata: { type: 'object', description: 'Metadata' }
      },
      required: ['data']
    }
  },
  {
    name: 'analyze_with_neural',
    description: 'Use Neural Import to analyze data',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to analyze' }
      },
      required: ['text']
    }
  }
]

// Claude uses Brainy tools
const message = await claude.messages.create({
  model: 'claude-3-opus-20240229',
  max_tokens: 1000,
  tools: brainyTools,
  messages: [{
    role: 'user',
    content: 'Search Brainy for information about quantum computing and analyze the results'
  }]
})

// Handle tool use
if (message.content[0].type === 'tool_use') {
  const tool = message.content[0]
  
  // Call Brainy MCP
  const response = await fetch('http://brainy:3000/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'tool_execution',
      toolName: tool.name,
      requestId: generateRequestId(),
      version: '1.0.0',
      parameters: tool.input
    })
  })
  
  const result = await response.json()
  // Use result in conversation...
}
```

---

## GraphQL API

### Optional GraphQL Layer

```typescript
// graphql-server.ts
import { ApolloServer, gql } from 'apollo-server-express'

const typeDefs = gql`
  type Query {
    search(query: String!, k: Int): SearchResults
    getItem(id: ID!): Item
    listAugmentations: [Augmentation]
    getGraphNeighbors(id: ID!, verb: String): [Item]
  }
  
  type Mutation {
    addData(input: AddDataInput!): AddDataResponse
    createRelationship(source: ID!, target: ID!, verb: String!): Boolean
    triggerAugmentation(name: String!, options: JSON): AugmentationResult
  }
  
  type Subscription {
    dataAdded: Item
    augmentationComplete: AugmentationEvent
  }
  
  type Item {
    id: ID!
    data: String
    metadata: JSON
    vector: [Float]
    neighbors(verb: String): [Item]
  }
  
  type SearchResults {
    items: [Item]
    totalCount: Int
  }
  
  input AddDataInput {
    data: String!
    metadata: JSON
  }
`

const resolvers = {
  Query: {
    search: async (_, { query, k }) => {
      const results = await brainy.search(query, k)
      return {
        items: results,
        totalCount: results.length
      }
    },
    
    getItem: async (_, { id }) => {
      return await brainy.get(id)
    },
    
    listAugmentations: async () => {
      return brainy.listAugmentations()
    }
  },
  
  Mutation: {
    addData: async (_, { input }) => {
      const id = await brainy.add(input.data, input.metadata)
      return { id, success: true }
    },
    
    createRelationship: async (_, { source, target, verb }) => {
      await brainy.relate(source, target, verb)
      return true
    }
  },
  
  Subscription: {
    dataAdded: {
      subscribe: () => pubsub.asyncIterator(['DATA_ADDED'])
    }
  }
}

const apolloServer = new ApolloServer({ typeDefs, resolvers })
await apolloServer.start()
apolloServer.applyMiddleware({ app, path: '/graphql' })
```

---

## Service Integration Patterns

### Microservice Architecture

```yaml
# docker-compose.yml - Complete microservices setup
version: '3.8'

services:
  # Brainy API Server
  brainy:
    image: soulcraft/brainy:latest
    ports:
      - "3000:3000"  # REST + WebSocket
      - "3001:3001"  # MCP Interface
    environment:
      - ENABLE_REST=true
      - ENABLE_WEBSOCKET=true
      - ENABLE_MCP=true
      - ENABLE_GRAPHQL=true
      - BRAINY_LICENSE_KEY=${LICENSE_KEY}
    volumes:
      - brainy-data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s

  # User Service (connects to Brainy)
  user-service:
    build: ./services/user
    environment:
      - BRAINY_API=http://brainy:3000/api/v1
      - BRAINY_WS=ws://brainy:3000
    depends_on:
      - brainy

  # AI Service (uses MCP)
  ai-service:
    build: ./services/ai
    environment:
      - BRAINY_MCP=http://brainy:3001/mcp
      - OPENAI_API_KEY=${OPENAI_KEY}
    depends_on:
      - brainy

  # Analytics Service
  analytics:
    build: ./services/analytics
    environment:
      - BRAINY_GRAPHQL=http://brainy:3000/graphql
    depends_on:
      - brainy

  # API Gateway
  gateway:
    image: kong:latest
    ports:
      - "8000:8000"
    environment:
      - KONG_DATABASE=off
      - KONG_PROXY_ACCESS_LOG=/dev/stdout
      - KONG_ADMIN_ACCESS_LOG=/dev/stdout
      - KONG_PROXY_ERROR_LOG=/dev/stderr
      - KONG_ADMIN_ERROR_LOG=/dev/stderr
    volumes:
      - ./kong.yml:/usr/local/kong/declarative/kong.yml
    depends_on:
      - brainy
```

### Language-Specific Clients

```python
# Python Service
import requests
import socketio

class BrainyClient:
    def __init__(self, api_url='http://brainy:3000'):
        self.api = f"{api_url}/api/v1"
        self.mcp = f"{api_url}/mcp"
        self.sio = socketio.Client()
        self.sio.connect(api_url)
    
    def add(self, data, metadata=None):
        return requests.post(f"{self.api}/add", json={
            'data': data,
            'metadata': metadata
        }).json()
    
    def search(self, query, k=10):
        return requests.get(f"{self.api}/search", params={
            'query': query,
            'k': k
        }).json()
    
    def use_mcp_tool(self, tool_name, params):
        return requests.post(self.mcp, json={
            'type': 'tool_execution',
            'toolName': tool_name,
            'parameters': params
        }).json()
```

```go
// Go Service
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

type BrainyClient struct {
    BaseURL string
}

func (c *BrainyClient) Add(data string, metadata map[string]interface{}) (string, error) {
    payload, _ := json.Marshal(map[string]interface{}{
        "data": data,
        "metadata": metadata,
    })
    
    resp, err := http.Post(
        c.BaseURL + "/api/v1/add",
        "application/json",
        bytes.NewBuffer(payload),
    )
    // Handle response...
}
```

```java
// Java Service
import okhttp3.*;
import com.google.gson.Gson;

public class BrainyClient {
    private final OkHttpClient client = new OkHttpClient();
    private final String baseUrl;
    private final Gson gson = new Gson();
    
    public BrainyClient(String baseUrl) {
        this.baseUrl = baseUrl;
    }
    
    public String addData(String data, Map<String, Object> metadata) {
        Map<String, Object> body = new HashMap<>();
        body.put("data", data);
        body.put("metadata", metadata);
        
        Request request = new Request.Builder()
            .url(baseUrl + "/api/v1/add")
            .post(RequestBody.create(
                gson.toJson(body),
                MediaType.parse("application/json")
            ))
            .build();
        
        // Execute and handle response...
    }
}
```

---

## Authentication & Security

### API Key Authentication

```typescript
// middleware/auth.ts
const API_KEYS = new Map([
  ['key_abc123', { name: 'user-service', permissions: ['read', 'write'] }],
  ['key_def456', { name: 'analytics', permissions: ['read'] }]
])

export function authenticateAPIKey(req, res, next) {
  const apiKey = req.headers['x-api-key']
  
  if (!apiKey || !API_KEYS.has(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' })
  }
  
  req.client = API_KEYS.get(apiKey)
  next()
}

// Apply to routes
app.use('/api', authenticateAPIKey)
```

### JWT Authentication

```typescript
// For user-facing applications
import jwt from 'jsonwebtoken'

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  
  // Validate credentials...
  
  const token = jwt.sign(
    { userId: user.id, email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  )
  
  res.json({ token })
})

// Protect routes
function authenticateJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'Token required' })
  }
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(403).json({ error: 'Invalid token' })
  }
}
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit'

// General rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

// Stricter limit for expensive operations
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10 // 10 searches per minute
})

app.use('/api', limiter)
app.use('/api/v1/search', searchLimiter)
```

---

## Docker Deployment

### Complete Dockerfile

```dockerfile
# Multi-stage build for optimal size
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Download models for offline use
RUN npm run download-models

# Production image
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/models ./models

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create data directory
RUN mkdir -p /data && chown -R nodejs:nodejs /data

USER nodejs

# Expose all API ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start server
CMD ["node", "dist/server/index.js"]
```

### Docker Compose with All APIs

```yaml
version: '3.8'

services:
  brainy:
    build: .
    container_name: brainy-api
    ports:
      - "3000:3000"  # REST + WebSocket + GraphQL
      - "3001:3001"  # MCP Interface
      - "9090:9090"  # Metrics
    environment:
      # API Configuration
      - ENABLE_REST=true
      - ENABLE_WEBSOCKET=true
      - ENABLE_MCP=true
      - ENABLE_GRAPHQL=true
      - ENABLE_METRICS=true
      
      # Authentication
      - JWT_SECRET=${JWT_SECRET}
      - API_KEYS=${API_KEYS}
      
      # Storage
      - STORAGE_TYPE=s3
      - S3_BUCKET=${S3_BUCKET}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      
      # Premium Features
      - BRAINY_LICENSE_KEY=${BRAINY_LICENSE_KEY}
      
    volumes:
      - brainy-data:/data
      - ./config:/app/config
      
    restart: unless-stopped
    
    networks:
      - brainy-network
      
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

networks:
  brainy-network:
    driver: bridge

volumes:
  brainy-data:
```

---

## API Gateway Configuration

### Kong Configuration

```yaml
# kong.yml
_format_version: "2.1"

services:
  - name: brainy-rest-api
    url: http://brainy:3000
    routes:
      - name: brainy-rest-route
        paths:
          - /api
        strip_path: false
    plugins:
      - name: rate-limiting
        config:
          minute: 100
      - name: cors
      - name: jwt

  - name: brainy-mcp
    url: http://brainy:3001
    routes:
      - name: brainy-mcp-route
        paths:
          - /mcp
    plugins:
      - name: key-auth
      - name: rate-limiting
        config:
          minute: 50

  - name: brainy-graphql
    url: http://brainy:3000/graphql
    routes:
      - name: brainy-graphql-route
        paths:
          - /graphql
    plugins:
      - name: cors
      - name: request-size-limiting
        config:
          allowed_payload_size: 8
```

### Nginx Configuration

```nginx
# nginx.conf
upstream brainy_api {
    least_conn;
    server brainy1:3000;
    server brainy2:3000;
    server brainy3:3000;
}

upstream brainy_mcp {
    server brainy1:3001;
    server brainy2:3001;
    server brainy3:3001;
}

server {
    listen 80;
    server_name api.brainy.example.com;

    # REST API
    location /api {
        proxy_pass http://brainy_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://brainy_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Sticky sessions for WebSocket
        ip_hash;
    }

    # MCP Interface
    location /mcp {
        proxy_pass http://brainy_mcp;
        
        # Only allow from AI services
        allow 10.0.0.0/8;
        deny all;
    }

    # GraphQL
    location /graphql {
        proxy_pass http://brainy_api/graphql;
        
        # Limit body size for GraphQL
        client_max_body_size 1m;
    }

    # Metrics (Prometheus)
    location /metrics {
        proxy_pass http://brainy_api:9090/metrics;
        
        # Only allow from monitoring network
        allow 10.1.0.0/16;
        deny all;
    }
}
```

---

## Client Libraries

### Official SDKs

```bash
# JavaScript/TypeScript
npm install @soulcraft/brainy-client

# Python
pip install brainy-client

# Go
go get github.com/soulcraft-research/brainy-client-go

# Java
implementation 'com.soulcraft:brainy-client:1.0.0'

# Ruby
gem install brainy-client
```

### SDK Usage Example

```typescript
// TypeScript SDK
import { BrainyClient } from '@soulcraft/brainy-client'

const client = new BrainyClient({
  apiUrl: 'https://api.brainy.example.com',
  apiKey: process.env.BRAINY_API_KEY,
  enableWebSocket: true,
  enableMCP: true
})

// REST operations
const id = await client.add('Data to store')
const results = await client.search('query')

// WebSocket real-time
client.on('data:added', (data) => {
  console.log('New data:', data)
})

// MCP tools for AI
const analysis = await client.mcp.useTool('brainy_sense_analyzeRelationships', {
  text: 'Complex document'
})

// GraphQL queries
const graphqlResult = await client.graphql(`
  query {
    search(query: "test") {
      items {
        id
        data
        neighbors(verb: "related_to") {
          id
        }
      }
    }
  }
`)
```

---

## Monitoring & Observability

### Prometheus Metrics

```typescript
// Exposed at /metrics endpoint
brainy_api_requests_total{method="POST",endpoint="/api/v1/add"}
brainy_api_request_duration_seconds{method="GET",endpoint="/api/v1/search"}
brainy_websocket_connections_active
brainy_mcp_requests_total{tool="brainy_sense_processRawData"}
brainy_augmentation_executions_total{type="SENSE",name="neural-import"}
brainy_storage_size_bytes
brainy_vector_dimensions
brainy_graph_nodes_total
brainy_graph_edges_total
```

### Health Check Endpoint

```typescript
// GET /health
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "apis": {
    "rest": "active",
    "websocket": "active",
    "mcp": "active",
    "graphql": "active"
  },
  "augmentations": {
    "active": 5,
    "pending": 0,
    "failed": 0
  },
  "storage": {
    "type": "s3",
    "connected": true,
    "size": "1.2GB"
  },
  "performance": {
    "avgResponseTime": "12ms",
    "requestsPerSecond": 150
  }
}
```

---

## Summary

When deployed on Docker, Brainy exposes:

1. **REST API** - Full CRUD operations, graph traversal, augmentation management
2. **WebSocket** - Real-time bidirectional communication
3. **MCP Interface** - AI model integration with augmentations as tools
4. **GraphQL** - Optional query language support
5. **Metrics** - Prometheus-compatible monitoring

All accessible through **a single Docker container** on configurable ports, with:
- **Authentication** options (API keys, JWT, mTLS)
- **Rate limiting** for protection
- **Load balancing** support
- **Language-agnostic** client access
- **Full observability** with metrics and health checks

This makes Brainy a **complete API platform** that any service can connect to and use! 🧠⚛️