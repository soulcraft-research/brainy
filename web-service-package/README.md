# Brainy Web Service

A secure, read-only web service wrapper for the Brainy vector graph database. This service exposes Brainy's search capabilities through RESTful API endpoints, designed specifically as a search service with comprehensive security measures.

## Features

- 🔒 **Read-only by design** - Only safe search operations are exposed
- 🚀 **RESTful API** - Clean, well-documented HTTP endpoints
- 🛡️ **Security-first** - Rate limiting, input validation, CORS, and security headers
- 📊 **Comprehensive search** - Vector search, text search, similarity search
- 🔍 **Flexible querying** - Support for noun types, verb filtering, and pagination
- 📈 **Production-ready** - Proper error handling, logging, and graceful shutdown
- 🌐 **CORS enabled** - Ready for browser-based applications

## Installation

```bash
npm install -g @soulcraft/brainy-web-service
```

Or run directly:

```bash
npx @soulcraft/brainy-web-service
```

## Quick Start

1. **Start the service:**
   ```bash
   brainy-server
   ```

2. **Check if it's running:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **View API documentation:**
   ```bash
   curl http://localhost:3000/api
   ```

## 🚀 Easy Deployment

### Option 1: Direct NPM Deployment
```bash
# Install globally and run
npm install -g @soulcraft/brainy-web-service
brainy-server
```

### Option 2: One-liner with npx
```bash
# Run without installation
npx @soulcraft/brainy-web-service
```

### Option 3: Docker Deployment
```bash
# Create a simple Dockerfile
cat > Dockerfile << EOF
FROM node:24-alpine
RUN npm install -g @soulcraft/brainy-web-service
EXPOSE 3000
CMD ["brainy-server"]
EOF

# Build and run
docker build -t brainy-web-service .
docker run -p 3000:3000 brainy-web-service
```

### Option 4: Cloud Platform Deployment

#### Google Cloud Platform (App Engine)
```bash
# Create package.json
echo '{"scripts":{"start":"brainy-server"},"dependencies":{"@soulcraft/brainy-web-service":"latest"}}' > package.json

# Create app.yaml for App Engine
cat > app.yaml << EOF
runtime: nodejs20
env: standard
automatic_scaling:
  min_instances: 1
  max_instances: 10
EOF

# Deploy to App Engine
gcloud app deploy
```

#### AWS (App Runner)
```bash
# Create package.json
echo '{"scripts":{"start":"brainy-server"},"dependencies":{"@soulcraft/brainy-web-service":"latest"}}' > package.json

# Create apprunner.yaml
cat > apprunner.yaml << EOF
version: 1.0
runtime: nodejs20
build:
  commands:
    build:
      - npm install
run:
  runtime-version: 20
  command: npm start
  network:
    port: 3000
    env: PORT
EOF

# Deploy via AWS App Runner console or CLI
aws apprunner create-service --service-name brainy-web-service --source-configuration '{...}'
```

#### Microsoft Azure (App Service)
```bash
# Create package.json
echo '{"scripts":{"start":"brainy-server"},"dependencies":{"@soulcraft/brainy-web-service":"latest"}}' > package.json

# Deploy using Azure CLI
az webapp create --resource-group myResourceGroup --plan myAppServicePlan --name brainy-web-service --runtime "NODE:20-lts"
az webapp deployment source config-zip --resource-group myResourceGroup --name brainy-web-service --src deployment.zip
```

#### Cloudflare Workers
```bash
# Create package.json
echo '{"scripts":{"start":"brainy-server"},"dependencies":{"@soulcraft/brainy-web-service":"latest"}}' > package.json

# Create wrangler.toml
cat > wrangler.toml << EOF
name = "brainy-web-service"
main = "src/worker.js"
compatibility_date = "2024-01-01"

[env.production]
name = "brainy-web-service"
EOF

# Deploy with Wrangler
npx wrangler deploy
```

### Option 5: Serverless Deployment
```javascript
// For serverless platforms, wrap the service:
const express = require('express');
const app = require('@soulcraft/brainy-web-service');

module.exports = app;
```

## Configuration

Configure the service using environment variables:

```bash
# Server configuration
PORT=3000                    # Server port (default: 3000)
HOST=0.0.0.0                # Server host (default: 0.0.0.0)

# Local Storage configuration (fallback)
BRAINY_DATA_PATH=/path/to/data  # Path to Brainy database files (used when no cloud storage configured)
FORCE_LOCAL_STORAGE=true    # Force local filesystem storage (ignores cloud storage config)

# Security configuration
CORS_ORIGIN=*               # CORS origin (default: *)
RATE_LIMIT_WINDOW=900000    # Rate limit window in ms (default: 15 minutes)
RATE_LIMIT_MAX=100          # Max requests per window (default: 100)

# Environment
NODE_ENV=production         # Environment mode
```

### Cloud Storage Configuration

The service automatically detects and uses cloud storage when configured. If no cloud storage is configured, it falls back to local filesystem storage.

#### AWS S3
```bash
S3_BUCKET_NAME=my-brainy-bucket
S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE    # or AWS_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY    # or AWS_SECRET_ACCESS_KEY
S3_REGION=us-west-2                      # or AWS_REGION
```

#### Cloudflare R2
```bash
R2_BUCKET_NAME=my-brainy-bucket
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
```

#### Google Cloud Storage (S3-compatible)
```bash
GCS_BUCKET_NAME=my-brainy-bucket
GCS_ACCESS_KEY_ID=your-gcs-access-key
GCS_SECRET_ACCESS_KEY=your-gcs-secret-key
GCS_ENDPOINT=https://storage.googleapis.com  # Optional, defaults to GCS endpoint
```

#### Azure Blob Storage (S3-compatible)
For Azure, you can use the S3-compatible interface with a custom endpoint:
```bash
S3_BUCKET_NAME=my-brainy-container
S3_ACCESS_KEY_ID=your-storage-account-name
S3_SECRET_ACCESS_KEY=your-storage-account-key
S3_REGION=auto
# Note: Azure Blob Storage S3 compatibility may require additional configuration
```

#### Custom S3-Compatible Storage
```bash
S3_BUCKET_NAME=my-brainy-bucket
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=us-east-1
# Set custom endpoint via application configuration
```

## API Endpoints

### Health & Status

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-22T09:33:00.000Z",
  "service": "brainy-web-service",
  "version": "0.12.0"
}
```

#### `GET /api`
API documentation and endpoint listing.

#### `GET /api/status`
Database status and statistics.

**Response:**
```json
{
  "size": 1000,
  "readOnly": true,
  "timestamp": "2025-07-22T09:33:00.000Z"
}
```

### Search Operations

#### `POST /api/search`
Search using a vector.

**Request Body:**
```json
{
  "vector": [0.1, 0.2, 0.3, ...],
  "k": 10,
  "nounTypes": ["document", "image"],
  "includeVerbs": false
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "item-1",
      "score": 0.95,
      "vector": [0.1, 0.2, 0.3, ...],
      "metadata": {
        "title": "Example Document",
        "type": "document"
      }
    }
  ],
  "query": {
    "vectorLength": 384,
    "k": 10,
    "nounTypes": ["document"],
    "includeVerbs": false
  },
  "timestamp": "2025-07-22T09:33:00.000Z"
}
```

#### `POST /api/search/text`
Search using text query (automatically vectorized).

**Request Body:**
```json
{
  "query": "machine learning algorithms",
  "k": 5,
  "nounTypes": ["document"],
  "includeVerbs": false
}
```

**Response:** Same format as vector search.

### Data Retrieval

#### `GET /api/item/:id`
Get a specific item by ID.

**Response:**
```json
{
  "item": {
    "id": "item-1",
    "vector": [0.1, 0.2, 0.3, ...],
    "metadata": {
      "title": "Example Document",
      "type": "document"
    }
  },
  "timestamp": "2025-07-22T09:33:00.000Z"
}
```

#### `GET /api/items?page=1&limit=20`
Get all items with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000,
    "totalPages": 50,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-07-22T09:33:00.000Z"
}
```

#### `POST /api/similar/:id`
Find items similar to a given item.

**Request Body:**
```json
{
  "k": 10,
  "includeVerbs": false
}
```

**Response:** Same format as search results.

## Usage Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Text search
async function searchText(query) {
  const response = await axios.post(`${API_BASE}/search/text`, {
    query: query,
    k: 10
  });
  return response.data.results;
}

// Vector search
async function searchVector(vector) {
  const response = await axios.post(`${API_BASE}/search`, {
    vector: vector,
    k: 5
  });
  return response.data.results;
}

// Get item by ID
async function getItem(id) {
  const response = await axios.get(`${API_BASE}/item/${id}`);
  return response.data.item;
}

// Usage
searchText('artificial intelligence').then(results => {
  console.log('Search results:', results);
});
```

### Python

```python
import requests

API_BASE = 'http://localhost:3000/api'

def search_text(query, k=10):
    response = requests.post(f'{API_BASE}/search/text', json={
        'query': query,
        'k': k
    })
    return response.json()['results']

def search_vector(vector, k=10):
    response = requests.post(f'{API_BASE}/search', json={
        'vector': vector,
        'k': k
    })
    return response.json()['results']

def get_item(item_id):
    response = requests.get(f'{API_BASE}/item/{item_id}')
    return response.json()['item']

# Usage
results = search_text('machine learning')
print(f'Found {len(results)} results')
```

### cURL

```bash
# Text search
curl -X POST http://localhost:3000/api/search/text \
  -H "Content-Type: application/json" \
  -d '{"query": "artificial intelligence", "k": 5}'

# Vector search
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"vector": [0.1, 0.2, 0.3], "k": 10}'

# Get item
curl http://localhost:3000/api/item/example-id

# Get items with pagination
curl "http://localhost:3000/api/items?page=1&limit=10"
```

## Security Features

### Read-Only Protection
- Database is automatically set to read-only mode on startup
- No write operations (add, delete, update) are exposed
- Only safe search and retrieval operations are available

### Rate Limiting
- Default: 100 requests per 15-minute window per IP
- Configurable via environment variables
- Returns 429 status code when limit exceeded

### Input Validation
- All inputs are validated using express-validator
- Vector dimensions and types are checked
- String lengths are limited to prevent abuse
- Numeric ranges are enforced

### Security Headers
- Helmet.js provides security headers
- Content Security Policy configured
- CORS properly configured
- Compression enabled for performance

### Error Handling
- Detailed error messages in development
- Generic error messages in production
- All errors are logged for monitoring
- Graceful shutdown on SIGTERM/SIGINT

## Deployment

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:24-alpine

# Create non-root user for security
RUN addgroup -g 1001 -S brainy && \
    adduser -S brainy -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .
RUN npm run build

# Create data directory and set permissions
RUN mkdir -p /app/data && chown -R brainy:brainy /app

# Switch to non-root user
USER brainy

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start service
CMD ["npm", "start"]
```

#### Local Storage Deployment
```bash
docker build -t brainy-web-service .
docker run -p 3000:3000 \
  -v /host/data:/app/data \
  -e BRAINY_DATA_PATH=/app/data \
  brainy-web-service
```

#### AWS S3 Deployment
```bash
docker run -p 3000:3000 \
  -e S3_BUCKET_NAME=my-brainy-bucket \
  -e S3_ACCESS_KEY_ID=your-access-key \
  -e S3_SECRET_ACCESS_KEY=your-secret-key \
  -e S3_REGION=us-west-2 \
  brainy-web-service
```

#### Cloudflare R2 Deployment
```bash
docker run -p 3000:3000 \
  -e R2_BUCKET_NAME=my-brainy-bucket \
  -e R2_ACCOUNT_ID=your-account-id \
  -e R2_ACCESS_KEY_ID=your-r2-access-key \
  -e R2_SECRET_ACCESS_KEY=your-r2-secret-key \
  brainy-web-service
```

#### Google Cloud Storage Deployment
```bash
docker run -p 3000:3000 \
  -e GCS_BUCKET_NAME=my-brainy-bucket \
  -e GCS_ACCESS_KEY_ID=your-gcs-access-key \
  -e GCS_SECRET_ACCESS_KEY=your-gcs-secret-key \
  brainy-web-service
```

### Docker Compose

```yaml
version: '3.8'
services:
  brainy-web-service:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - BRAINY_DATA_PATH=/app/data
      - RATE_LIMIT_MAX=200
    restart: unless-stopped
```

### Systemd Service

Create `/etc/systemd/system/brainy-web-service.service`:

```ini
[Unit]
Description=Brainy Web Service
After=network.target

[Service]
Type=simple
User=brainy
WorkingDirectory=/opt/brainy-web-service
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=BRAINY_DATA_PATH=/opt/brainy-web-service/data
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable brainy-web-service
sudo systemctl start brainy-web-service
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Development

### Setup

```bash
git clone https://github.com/soulcraft-research/brainy.git
cd brainy/web-service-package
npm install
```

### Development Mode

```bash
npm run dev
```

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## Monitoring

### Health Checks

The service provides health check endpoints for monitoring:

- `GET /health` - Basic health check
- `GET /api/status` - Detailed database status

### Logging

All requests and errors are logged to console. In production, consider using a logging service like Winston or Bunyan.

### Metrics

Consider integrating with monitoring solutions:
- Prometheus metrics
- New Relic
- DataDog
- Custom metrics via the status endpoint

## Troubleshooting

### Common Issues

1. **Service won't start**
   - Check if the data directory exists and is readable
   - Verify Node.js version (requires >= 24.4.0)
   - Check port availability

2. **Database not found**
   - Ensure `BRAINY_DATA_PATH` points to valid Brainy database files
   - Check file permissions

3. **Rate limiting issues**
   - Adjust `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW`
   - Consider implementing IP whitelisting

4. **Memory issues**
   - Monitor memory usage with large databases
   - Consider implementing pagination for large result sets

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see the main Brainy project for details.

## Support

- GitHub Issues: https://github.com/soulcraft-research/brainy/issues
- Documentation: https://github.com/soulcraft-research/brainy
- Email: david@soulcraft.com
