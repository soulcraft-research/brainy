<div align="center">
<img src="../brainy.png" alt="Brainy Logo" width="200"/>

# Brainy Cloud Wrapper
</div>

A standalone web service wrapper for the [Brainy](https://github.com/soulcraft/brainy) vector graph database. This wrapper allows you to deploy Brainy as a RESTful API service on various cloud platforms including AWS, Google Cloud, and Cloudflare.

## Features

- RESTful API for all Brainy operations
- WebSocket API for real-time updates and subscriptions
- Model Control Protocol (MCP) service for external model access
- Support for multiple storage backends (Memory, FileSystem, S3)
- Configurable via environment variables
- Deployment scripts for AWS, Google Cloud, and Cloudflare
- Secure by default with Helmet middleware
- Cross-origin resource sharing (CORS) support

## Prerequisites

- Node.js 23.11.0 or higher
- npm or yarn
- For cloud deployments:
  - AWS: AWS CLI installed and configured
  - Google Cloud: Google Cloud SDK installed and configured
  - Cloudflare: Wrangler CLI installed and configured

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/soulcraft/brainy.git
   cd brainy/cloud-wrapper
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Create a `.env` file based on the example:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file to configure your environment.

## Configuration

The cloud wrapper can be configured using environment variables. See the `.env.example` file for available options.

### Storage Options

- `STORAGE_TYPE`: The type of storage to use. Options:
  - `memory`: In-memory storage (default for Cloudflare)
  - `filesystem`: File system storage (default for local and AWS/GCP)
  - `s3`: S3-compatible storage (AWS S3, MinIO, etc.)
  - `r2`: Cloudflare R2 storage (Cloudflare only)

### S3 Storage Configuration

When using `STORAGE_TYPE=s3`, the following environment variables are required:

- `S3_BUCKET_NAME`: The name of the S3 bucket
- `S3_ACCESS_KEY_ID`: Your S3 access key ID
- `S3_SECRET_ACCESS_KEY`: Your S3 secret access key
- `S3_REGION`: The S3 region (default: `us-east-1`)
- `S3_ENDPOINT` (optional): Custom endpoint for S3-compatible services

### MCP Service Configuration

The Model Control Protocol (MCP) service can be configured using the following environment variables:

- `MCP_WS_PORT`: Port for the MCP WebSocket server (if not set, WebSocket server is disabled)
- `MCP_REST_PORT`: Port for the MCP REST server (if not set, REST server is disabled)
- `MCP_ENABLE_AUTH`: Enable authentication for MCP requests (`true` or `false`)
- `MCP_API_KEYS`: Comma-separated list of API keys for authentication
- `MCP_RATE_LIMIT_REQUESTS`: Maximum number of requests per time window
- `MCP_RATE_LIMIT_WINDOW_MS`: Time window for rate limiting in milliseconds (default: `60000`)
- `MCP_ENABLE_CORS`: Enable CORS for MCP REST server (`true` or `false`)

## Local Development

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. The API will be available at `http://localhost:3000`.

## API Endpoints

Brainy Cloud Wrapper provides REST API, WebSocket API, and Model Control Protocol (MCP) API for interacting with the database.

### REST API

#### Status

- `GET /api/status`: Get database status

#### Nouns (Entities)

- `POST /api/nouns`: Add a new noun
  - Body: `{ "text": "Your text", "metadata": { ... } }`
- `GET /api/nouns/:id`: Get a noun by ID
- `PUT /api/nouns/:id`: Update noun metadata
  - Body: `{ "metadata": { ... } }`
- `DELETE /api/nouns/:id`: Delete a noun

#### Search

- `POST /api/search`: Search for similar nouns
  - Body: `{ "query": "Your search query", "limit": 10 }`

#### Verbs (Relationships)

- `POST /api/verbs`: Add a relationship between nouns
  - Body: `{ "sourceId": "...", "targetId": "...", "metadata": { ... } }`
- `GET /api/verbs`: Get all relationships
- `GET /api/verbs/source/:id`: Get relationships by source
- `GET /api/verbs/target/:id`: Get relationships by target
- `DELETE /api/verbs/:id`: Delete a relationship

#### Database Management

- `DELETE /api/clear`: Clear all data

### WebSocket API

The WebSocket API provides real-time communication with the Brainy database. Connect to the WebSocket server at `ws://your-server:port`.

#### Message Format

All WebSocket messages follow this format:

```json
{
  "type": "messageType",
  "id": "unique-message-id",
  "payload": {
    // Message-specific data
  }
}
```

#### Available Message Types

##### Status
- Request: `{ "type": "status" }`
- Response: `{ "type": "status", "id": "...", "payload": { /* database status */ } }`

##### Nouns (Entities)
- Add a noun:
  - Request: `{ "type": "addNoun", "payload": { "text": "Your text", "metadata": { ... } } }`
  - Response: `{ "type": "addNoun", "id": "...", "payload": { "id": "new-noun-id" } }`

- Get a noun:
  - Request: `{ "type": "getNoun", "payload": { "id": "noun-id" } }`
  - Response: `{ "type": "getNoun", "id": "...", "payload": { /* noun data */ } }`

- Update a noun:
  - Request: `{ "type": "updateNoun", "payload": { "id": "noun-id", "metadata": { ... } } }`
  - Response: `{ "type": "updateNoun", "id": "...", "payload": { "success": true } }`

- Delete a noun:
  - Request: `{ "type": "deleteNoun", "payload": { "id": "noun-id" } }`
  - Response: `{ "type": "deleteNoun", "id": "...", "payload": { "success": true } }`

##### Search
- Search for similar nouns:
  - Request: `{ "type": "search", "payload": { "query": "Your search query", "limit": 10 } }`
  - Response: `{ "type": "search", "id": "...", "payload": [ /* search results */ ] }`

##### Verbs (Relationships)
- Add a verb:
  - Request: `{ "type": "addVerb", "payload": { "sourceId": "...", "targetId": "...", "metadata": { ... } } }`
  - Response: `{ "type": "addVerb", "id": "...", "payload": { "success": true } }`

- Get all verbs:
  - Request: `{ "type": "getVerbs" }`
  - Response: `{ "type": "getVerbs", "id": "...", "payload": [ /* all verbs */ ] }`

- Get verbs by source:
  - Request: `{ "type": "getVerbsBySource", "payload": { "id": "source-id" } }`
  - Response: `{ "type": "getVerbsBySource", "id": "...", "payload": [ /* verbs */ ] }`

- Get verbs by target:
  - Request: `{ "type": "getVerbsByTarget", "payload": { "id": "target-id" } }`
  - Response: `{ "type": "getVerbsByTarget", "id": "...", "payload": [ /* verbs */ ] }`

- Delete a verb:
  - Request: `{ "type": "deleteVerb", "payload": { "id": "verb-id" } }`
  - Response: `{ "type": "deleteVerb", "id": "...", "payload": { "success": true } }`

##### Database Management
- Clear all data:
  - Request: `{ "type": "clear" }`
  - Response: `{ "type": "clear", "id": "...", "payload": { "success": true } }`

#### Real-time Subscriptions

The WebSocket API supports subscribing to real-time updates:

- Subscribe to updates:
  - Request: `{ "type": "subscribe", "payload": { "type": "nouns" } }`
  - Response: `{ "type": "subscribe", "id": "...", "payload": { "success": true, "type": "nouns" } }`

- Unsubscribe from updates:
  - Request: `{ "type": "unsubscribe", "payload": { "type": "nouns" } }`
  - Response: `{ "type": "unsubscribe", "id": "...", "payload": { "success": true, "type": "nouns" } }`

Available subscription types:
- `nouns`: Updates about nouns (added, updated, deleted)
- `verbs`: Updates about verbs (added, deleted)
- `searchResults`: Updates about search results

When subscribed, you'll receive messages when relevant events occur:

```json
{
  "type": "subscribe",
  "payload": {
    "type": "nouns",
    "data": {
      "type": "added",
      "id": "noun-id",
      "data": { /* noun data */ }
    }
  }
}
```

### MCP API

The Model Control Protocol (MCP) API provides a standardized interface for external models to access Brainy data and use the augmentation pipeline as tools. The MCP API is available through both WebSocket and REST endpoints.

#### MCP REST API Endpoints

- `POST /mcp/data`: Access Brainy data (search, get, add, etc.)
- `POST /mcp/tools`: Execute augmentation pipeline tools
- `POST /mcp/system`: Get system information
- `POST /mcp/auth`: Authenticate with the MCP service
- `GET /mcp/tools`: Get available tools

#### MCP WebSocket

Connect to the MCP WebSocket server at `ws://your-server:MCP_WS_PORT` and send JSON messages in the MCP format:

```json
{
  "type": "DATA_ACCESS",
  "requestId": "unique-request-id",
  "version": "1.0",
  "operation": "search",
  "parameters": {
    "query": "Your search query",
    "k": 5
  }
}
```

For detailed documentation on the MCP API, see the [MCP documentation](../src/mcp/README.md).

## Cloud Deployment

### AWS Lambda and API Gateway

1. Configure AWS-specific environment variables:
   ```
   AWS_REGION=us-east-1
   AWS_FUNCTION_NAME=brainy-cloud-service
   AWS_API_GATEWAY_NAME=brainy-api
   AWS_STAGE_NAME=prod
   AWS_ACCOUNT_ID=your-account-id
   ```

2. Deploy to AWS:
   ```bash
   npm run deploy:aws
   ```

### Google Cloud Run

1. Configure GCP-specific environment variables:
   ```
   GCP_PROJECT_ID=your-project-id
   GCP_REGION=us-central1
   GCP_SERVICE_NAME=brainy-cloud-service
   GCP_IMAGE_NAME=brainy-cloud-service
   GCP_MEMORY=512Mi
   GCP_CPU=1
   GCP_MAX_INSTANCES=10
   GCP_MIN_INSTANCES=0
   ```

2. Deploy to Google Cloud:
   ```bash
   npm run deploy:gcp
   ```

### Cloudflare Workers

1. Configure Cloudflare-specific environment variables:
   ```
   CF_ACCOUNT_ID=your-account-id
   CF_WORKER_NAME=brainy-cloud-service
   CF_KV_NAMESPACE=BRAINY_STORAGE
   CF_R2_BUCKET=brainy-storage
   ```

2. Deploy to Cloudflare:
   ```bash
   npm run deploy:cloudflare
   ```

## Storage Considerations

### AWS Lambda

When deploying to AWS Lambda, it's recommended to use S3 storage for persistence. The filesystem storage option will work but data will be lost when the Lambda function is recycled.

### Google Cloud Run

For Google Cloud Run, you can use either filesystem storage (for ephemeral storage) or S3-compatible storage (like Google Cloud Storage with an S3 compatibility layer).

### Cloudflare Workers

Cloudflare Workers have limited storage options. The recommended approach is to use:
- Cloudflare KV for small datasets
- Cloudflare R2 for larger datasets
- Memory storage for temporary data

## License

MIT
