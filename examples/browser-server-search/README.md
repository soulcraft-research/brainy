<div align="center">
<img src="../../brainy.png" alt="Brainy Logo" width="200"/>

# Brainy Browser-Server Search Example
</div>

This example demonstrates how to use Brainy in a browser, call a server-hosted version for search, store the results locally, and then perform further searches against the local instance.

## Overview

The solution consists of:

1. A `BrainyServerSearch` class that handles the connection to the server and local storage
2. An HTML interface for testing the functionality
3. Server-side setup using the Brainy cloud wrapper

This approach allows you to:
- Search a server-hosted Brainy instance from a browser
- Store the search results in a local Brainy instance
- Perform further searches against the local instance without needing to query the server again
- Add data to both local and server instances

## How It Works

1. The browser creates a local Brainy instance
2. It connects to the server-hosted Brainy instance using WebSocket
3. When a search is performed:
   - The query is sent to the server
   - The server returns the search results
   - The results are stored in the local Brainy instance
   - The results are displayed to the user
4. Subsequent searches can be performed against the local instance
5. A combined search mode first checks the local instance and then queries the server only if needed

## Setup Instructions

### Server Setup

1. Set up the Brainy cloud wrapper:

```bash
# Clone the repository if you haven't already
git clone https://github.com/soulcraft/brainy.git
cd brainy/cloud-wrapper

# Install dependencies
npm install --legacy-peer-deps

# Configure the server
cp .env.example .env
# Edit .env to configure your environment

# Build and start the server
npm run build
npm run start
```

2. Note the WebSocket URL of your server (e.g., `wss://your-server.com/ws` or `ws://localhost:3000/ws` for local development)

### Client Setup

1. Copy the example files to your project:

```bash
cp -r examples/browser-server-search your-project/
```

2. Include the Brainy library in your project:

```bash
npm install @soulcraft/brainy --legacy-peer-deps
```

3. Open the HTML file in a browser or serve it using a local server:

```bash
# Using a simple HTTP server
cd your-project
npx http-server
```

4. Navigate to http://localhost:8080/browser-server-search/ in your browser

5. Enter the WebSocket URL of your server and start using the example

## Usage

### Using the HTML Interface

1. Enter the WebSocket URL of your Brainy server
2. Click "Connect" to establish a connection
3. Enter a search query and click one of the search buttons:
   - "Search Server" - Search the server and store results locally
   - "Search Local" - Search only the local instance
   - "Search Combined" - Search local first, then server if needed
4. To add data, enter text in the "Add Data" field and click "Add to Both"

### Using the BrainyServerSearch Class in Your Code

```javascript
import { BrainyServerSearch } from './index.js';

// Create a new instance
const brainySearch = new BrainyServerSearch('wss://your-brainy-server.com/ws');

// Initialize and connect
await brainySearch.init();

// Search the server and store results locally
const serverResults = await brainySearch.searchServer('machine learning', 5);

// Search the local instance
const localResults = await brainySearch.searchLocal('machine learning', 5);

// Perform a combined search
const combinedResults = await brainySearch.searchCombined('neural networks', 5);

// Add data to both local and server
const id = await brainySearch.add('Deep learning is a subset of machine learning', {
  noun: 'Concept',
  category: 'AI',
  tags: ['deep learning', 'neural networks']
});

// Close the connection when done
await brainySearch.close();
```

## API Reference

### BrainyServerSearch Class

#### Constructor

```javascript
const brainySearch = new BrainyServerSearch(serverUrl);
```

- `serverUrl` (string): WebSocket URL of the Brainy server

#### Methods

- `init()`: Initialize the local Brainy instance and connect to the server
- `searchServer(query, limit = 10)`: Search the server-hosted Brainy instance, store results locally, and return them
- `searchLocal(query, limit = 10)`: Search the local Brainy instance
- `searchCombined(query, limit = 10)`: Search both server and local instances, combine results, and store server results locally
- `add(data, metadata = {})`: Add data to both local and server instances
- `close()`: Close the connection to the server

## Advanced Configuration

### Custom Embedding Function

You can customize the embedding function used by the local Brainy instance:

```javascript
import { createSimpleEmbeddingFunction } from '@soulcraft/brainy';

// In your code, before calling init():
brainySearch.setEmbeddingFunction(createSimpleEmbeddingFunction());
```

### Persistent Storage

To enable persistent storage for the local Brainy instance:

```javascript
// In your code, before calling init():
brainySearch.setStorageOptions({
  requestPersistentStorage: true
});
```

## Troubleshooting

### Connection Issues

- Ensure the server is running and accessible
- Check that the WebSocket URL is correct
- Verify that your browser supports WebSockets
- Check for CORS issues if the server is on a different domain

### Search Issues

- Ensure the server has data to search
- Check that the query is not empty
- Verify that the server is properly configured for search

## License

MIT
