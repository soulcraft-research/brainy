# Brainy Service Template

**Zero-configuration, intelligent service template built with Brainy's native augmentation system.**

This template embodies Brainy's core tenets: **zero configuration**, **intelligent adaptation**, and **augmentation-first architecture**. It automatically adapts to any environment (browser, Node.js, serverless, containers) and uses WebRTC, WebSocket, and HTTP transport layers as needed.

## Features

🧠 **Zero Configuration**
- Auto-detects optimal storage (memory → filesystem → S3)
- Intelligent transport selection (WebRTC → WebSocket → HTTP)
- Environment adaptation (browser, Node.js, serverless, containers)
- Self-optimizing performance and caching

🔌 **Augmentation-First Architecture**
- WebSocket Augmentation - Real-time queries and updates
- WebRTC Augmentation - Peer-to-peer Brainy connections
- HTTP Augmentation - Minimal REST API for universal access
- Auto-Discovery Augmentation - Understand your data patterns
- Adaptive Storage Augmentation - Intelligent resource management
- Environment Adapter - Works everywhere automatically

🌐 **Universal Compatibility**
- Browser (OPFS, IndexedDB, WebRTC peer-to-peer)
- Node.js (filesystem, worker threads, clustering)
- Serverless (memory, fast cold starts)
- Docker/Containers (volumes, health checks)
- Kubernetes (pod-aware, service mesh ready)
- Edge computing (ultra-low latency, minimal footprint)

⚡ **Intelligent Features**
- Intelligent Verb Scoring (enabled by default)
- Automatic relationship weighting and confidence scoring
- Learning from usage patterns and feedback
- Real-time performance optimization
- Data quality analysis and recommendations

## Quick Start

### 1. Zero-Config Instant Start

```bash
# Copy template
cp -r examples/brainy-service-template my-brainy-service
cd my-brainy-service
npm install

# Start with ZERO configuration - everything auto-detected!
npm start
```

**That's it!** The service automatically:
- ✅ Detects your environment (Node.js, browser, container, etc.)
- ✅ Chooses optimal storage (memory → filesystem → S3)
- ✅ Enables best transport layers (WebRTC → WebSocket → HTTP)
- ✅ Configures intelligent verb scoring
- ✅ Sets up real-time capabilities
- ✅ Optimizes performance for your hardware

### 2. Access Your Brainy Service

The service automatically provides multiple ways to interact:

```javascript
// WebSocket (real-time, best performance)
const ws = new WebSocket('ws://localhost:3001')
ws.send(JSON.stringify({
  type: 'search',
  payload: { query: 'machine learning', limit: 10 }
}))

// WebRTC (peer-to-peer, direct connection)
// Client code automatically generated at http://localhost:3002

// HTTP (universal fallback)
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "machine learning", "limit": 10}'
```

### 3. Optional: Environment Variables

Only set these if you want to override the intelligent defaults:

```bash
# Storage preference (auto-detected by default)
export BRAINY_STORAGE_TYPE=s3
export BRAINY_S3_BUCKET=my-brainy-data

# Transport preference (all enabled by default)
export BRAINY_TRANSPORTS=websocket,http  # disable WebRTC

# Port preference (3000 by default)
export PORT=8080
```

## API Endpoints

### Entities
- `POST /api/entities` - Create entity
- `GET /api/entities/:id` - Get entity by ID
- `PUT /api/entities/:id` - Update entity
- `DELETE /api/entities/:id` - Delete entity
- `GET /api/entities` - List entities (paginated)
- `POST /api/entities/search` - Search entities

### Relationships
- `POST /api/relationships` - Create relationship
- `GET /api/relationships/:id` - Get relationship by ID
- `PUT /api/relationships/:id` - Update relationship
- `DELETE /api/relationships/:id` - Delete relationship
- `GET /api/relationships` - List relationships (paginated)

### Intelligent Scoring (when enabled)
- `POST /api/scoring/feedback/:id` - Provide feedback for learning
- `GET /api/scoring/stats` - Get scoring statistics
- `POST /api/scoring/export` - Export learning data
- `POST /api/scoring/import` - Import learning data
- `DELETE /api/scoring/stats` - Clear statistics
- `POST /api/scoring/analyze` - Analyze relationship patterns
- `GET /api/scoring/recommendations/:entityId` - Get recommendations

### Health & Monitoring
- `GET /health` - Overall health check
- `GET /health/liveness` - Kubernetes liveness probe
- `GET /health/readiness` - Kubernetes readiness probe
- `GET /health/metrics` - System metrics

## Configuration Options

### Basic Configuration

```json
{
  "service": {
    "name": "my-service",
    "port": 3000,
    "cors": {
      "enabled": true,
      "origins": ["http://localhost:3000"]
    }
  },
  "brainy": {
    "storage": {
      "type": "filesystem|memory|s3",
      "path": "./data",
      "s3": {
        "bucket": "my-bucket",
        "region": "us-east-1"
      }
    }
  }
}
```

### Advanced Features

```json
{
  "brainy": {
    "features": {
      "intelligentVerbScoring": true,
      "realTimeUpdates": true,
      "distributedMode": false
    },
    "intelligentVerbScoring": {
      "enabled": true,
      "enableSemanticScoring": true,
      "enableFrequencyAmplification": true,
      "enableTemporalDecay": true,
      "temporalDecayRate": 0.01,
      "minWeight": 0.1,
      "maxWeight": 1.0,
      "baseConfidence": 0.5,
      "learningRate": 0.1
    },
    "cache": {
      "autoTune": true,
      "hotCacheMaxSize": 10000
    }
  }
}
```

## Deployment

### Development

```bash
npm run dev
```

### Production (Local)

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t my-brainy-service .
docker run -p 3000:3000 my-brainy-service
```

### Docker Compose

```bash
docker-compose up
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `BRAINY_STORAGE_TYPE` | Storage type | `filesystem` |
| `BRAINY_STORAGE_PATH` | Storage path | `./data` |
| `BRAINY_INTELLIGENT_SCORING` | Enable scoring | `false` |
| `LOG_LEVEL` | Logging level | `info` |

## Examples

### Adding Entities with Smart Relationships

```javascript
// Add entities
const person = await fetch('/entities', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'John is a senior software developer with expertise in React and Node.js',
    metadata: { type: 'person', name: 'John' }
  })
})

const project = await fetch('/entities', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'E-commerce platform built with React and Node.js',
    metadata: { type: 'project', name: 'ShopApp' }
  })
})

// Add relationship (with intelligent scoring if enabled)
const relationship = await fetch('/relationships', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceId: person.id,
    targetId: project.id,
    type: 'contributesTo',
    // weight is automatically computed if intelligent scoring is enabled
    metadata: { role: 'lead developer' }
  })
})
```

### Providing Learning Feedback

```javascript
// Correct a relationship weight (helps the system learn)
await fetch(`/relationships/${relationshipId}/feedback`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    weight: 0.9,  // corrected weight
    confidence: 0.85,  // corrected confidence
    type: 'correction'
  })
})
```

### Semantic Search

```javascript
const results = await fetch('/entities/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'experienced React developer',
    limit: 10,
    threshold: 0.7
  })
})
```

## Directory Structure

```
brainy-service-template/
├── src/
│   ├── controllers/
│   │   ├── entities.js
│   │   ├── relationships.js
│   │   └── scoring.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── brainyService.js
│   │   └── scoringService.js
│   ├── utils/
│   │   ├── config.js
│   │   ├── logger.js
│   │   └── helpers.js
│   └── app.js
├── config/
│   ├── default.json
│   ├── development.json
│   └── production.json
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── tests/
│   ├── integration/
│   └── unit/
└── docs/
    └── api.md
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## Customization

### Adding Custom Endpoints

```javascript
// src/controllers/custom.js
export const customEndpoint = async (req, res) => {
  const { brainyService } = req.app.locals
  
  // Your custom logic using Brainy
  const results = await brainyService.search(req.body.query)
  
  res.json({ results })
}
```

### Custom Augmentations

```javascript
// src/services/customAugmentation.js
import { ICognitionAugmentation } from '@soulcraft/brainy'

export class CustomAugmentation implements ICognitionAugmentation {
  // Your custom augmentation logic
}
```

## Monitoring & Observability

The template includes built-in monitoring:

- **Health checks**: `/health` endpoint
- **Metrics**: Request counts, response times, error rates
- **Logging**: Structured JSON logging with correlation IDs
- **Performance**: Automatic performance tracking for Brainy operations

## Production Considerations

### Security

- Input validation and sanitization
- Rate limiting
- CORS configuration  
- Environment-based secrets management

### Performance

- Connection pooling
- Request caching
- Automatic cache tuning
- Background processing for heavy operations

### Reliability

- Graceful shutdown handling
- Circuit breaker patterns
- Retry logic with exponential backoff
- Health checks for dependencies

## Support & Documentation

- [Brainy Documentation](../../docs/)
- [Intelligent Verb Scoring Guide](../../docs/guides/intelligent-verb-scoring.md)
- [API Reference](./docs/api.md)
- [Configuration Examples](./config/)

## License

This template is provided under the same license as Brainy.