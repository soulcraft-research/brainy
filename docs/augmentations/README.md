# 🧠⚛️ Brainy Augmentations Documentation

## Complete Guide to the Atomic Age Intelligence Augmentation System

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Augmentation Types](#augmentation-types)
4. [Installation Guide](#installation-guide)
5. [Pipeline Execution](#pipeline-execution)
6. [Cortex CLI Integration](#cortex-cli-integration)
7. [Server Deployment](#server-deployment)
8. [Remote Connection](#remote-connection)
9. [License Management](#license-management)
10. [API Reference](#api-reference)

---

## Overview

Brainy's augmentation system is a powerful, extensible framework that enhances your vector + graph database with AI-powered capabilities. Think of augmentations as "sensory organs" for the atomic age brain-in-jar system.

### Key Concepts

- **Pipeline Architecture**: 8 categories of augmentations that process data in sequence
- **Dual Execution**: Augmentations can run automatically in pipelines OR be called directly
- **Universal Compatibility**: Free, open source, premium, and custom augmentations all work together
- **Neural Import**: The default AI-powered augmentation that comes with every installation

### Augmentation Categories

1. **SENSE** - Input processing and data understanding (Neural Import lives here)
2. **CONDUIT** - External system integrations and sync (Notion, Salesforce, etc.)
3. **COGNITION** - AI reasoning and analysis
4. **MEMORY** - Enhanced storage and retrieval
5. **PERCEPTION** - Pattern recognition and insights
6. **DIALOG** - Conversational interfaces
7. **ACTIVATION** - Automation and triggers
8. **WEBSOCKET** - Real-time communications

---

## Architecture

### Pipeline Execution Flow

```
User Input → BrainyData.add()
                ↓
        [SENSE Pipeline]
        • Neural Import (default)
        • Custom analyzers
        • Premium enhancers
                ↓
        [CONDUIT Pipeline]
        • Notion sync
        • Salesforce sync
        • API connectors
                ↓
        [Other Pipelines...]
                ↓
        Vector + Graph Storage
```

### Execution Modes

```typescript
export enum ExecutionMode {
  SEQUENTIAL = 'sequential',    // One after another (default)
  PARALLEL = 'parallel',        // All at once
  FIRST_SUCCESS = 'firstSuccess', // Stop at first success
  FIRST_RESULT = 'firstResult',  // Return first result
  THREADED = 'threaded'         // Separate threads
}
```

---

## Augmentation Types

### 1. Neural Import (Free, Default)

**Always installed, always active, always free.**

```typescript
const brainy = new BrainyData()
await brainy.init() // Neural Import activates automatically

// Every add() uses Neural Import
await brainy.add("John Smith works at Acme Corp")
// Automatically detects: entities, relationships, confidence scores
```

### 2. Community Augmentations (Free, Open Source)

**Install from npm, contribute your own.**

```typescript
import { TranslatorAugmentation } from 'brainy-translator'

const translator = new TranslatorAugmentation({
  languages: ['en', 'es', 'fr']
})

await brainy.addAugmentation('DIALOG', translator, {
  name: 'translator',
  autoStart: true
})
```

### 3. Premium Augmentations (Paid, Licensed)

**Enterprise features with license validation.**

```typescript
import { NotionConnector } from '@soulcraft/brainy-quantum-vault'

const notion = new NotionConnector({
  licenseKey: 'lic_xxxxxxxxxxxxx', // Required!
  notionToken: 'secret_xxxxxxxxx',
  syncMode: 'bidirectional'
})

await brainy.addAugmentation('CONDUIT', notion, {
  name: 'notion',
  autoStart: true
})
```

### 4. Custom Augmentations

**Build your own for specific needs.**

```typescript
class MyAugmentation implements ISenseAugmentation {
  name = 'my-augmentation'
  version = '1.0.0'
  
  async processRawData(data: string, type: string) {
    // Your logic here
    return { success: true, data: { /* ... */ } }
  }
}

await brainy.addAugmentation('SENSE', new MyAugmentation())
```

---

## Installation Guide

### In Code (TypeScript/JavaScript)

#### Neural Import (Automatic)
```typescript
import { BrainyData } from '@soulcraft/brainy'

const brainy = new BrainyData()
await brainy.init() // ✅ Neural Import ready
```

#### Community Augmentations
```bash
npm install brainy-translator
```

```typescript
import { Translator } from 'brainy-translator'
await brainy.addAugmentation('DIALOG', new Translator())
```

#### Premium Augmentations
```bash
npm install @soulcraft/brainy-quantum-vault
```

```typescript
import { NotionConnector } from '@soulcraft/brainy-quantum-vault'

const notion = new NotionConnector({
  licenseKey: process.env.BRAINY_LICENSE_KEY
})

await brainy.addAugmentation('CONDUIT', notion)
```

### In Cortex CLI

#### Check Status
```bash
cortex augmentations
# Shows all active augmentations
```

#### Add Community
```bash
npm install -g brainy-translator
cortex augmentation add brainy-translator --type DIALOG
```

#### Activate Premium
```bash
cortex license activate lic_xxxxxxxxxxxxx
cortex augmentation activate notion-connector
```

#### Add Custom
```bash
cortex augmentation add ./my-augmentation.js --type SENSE
```

---

## Pipeline Execution

### Automatic Execution

When you add data, relevant pipelines execute automatically:

```typescript
await brainy.add("Customer data")
// Triggers in order:
// 1. SENSE pipeline (Neural Import analyzes)
// 2. CONDUIT pipeline (syncs to external systems)
// 3. MEMORY pipeline (enhanced storage)
```

### Manual Execution

Call augmentations directly for specific operations:

```typescript
// Get specific augmentation
const notion = brainy.getAugmentation('CONDUIT', 'notion')

// Call methods directly
await notion.triggerSync({ full: true })
await notion.exportToNotion(data)
```

### Pipeline Control

```typescript
// Configure execution mode
await brainy.add(data, metadata, {
  pipelineOptions: {
    mode: ExecutionMode.PARALLEL,
    timeout: 10000,
    stopOnError: false
  }
})

// Disable specific augmentations
await brainy.disableAugmentation('CONDUIT', 'slow-connector')

// Enable again
await brainy.enableAugmentation('CONDUIT', 'slow-connector')
```

---

## Cortex CLI Integration

### Shared Configuration

Code and Cortex share configuration via `.cortex/config.json`:

```typescript
// Save from code
await brainy.saveConfiguration('.cortex/config.json')

// Load in Cortex
cortex init  // Automatically loads config
```

### Unified Management

```bash
# View all augmentations
cortex augmentations

# Configure any augmentation
cortex augmentation config notion --set syncInterval=15

# Manually trigger
cortex connector sync notion --full
```

---

## Server Deployment

### Basic Server Setup

#### 1. Create Brainy Server

```typescript
// server.ts
import express from 'express'
import { BrainyData } from '@soulcraft/brainy'
import { NotionConnector } from '@soulcraft/brainy-quantum-vault'

const app = express()
const brainy = new BrainyData({
  storage: {
    s3Storage: {
      bucketName: process.env.S3_BUCKET,
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY
    }
  }
})

// Initialize with augmentations
async function initialize() {
  await brainy.init() // Neural Import active
  
  // Add premium augmentations if licensed
  if (process.env.BRAINY_LICENSE_KEY) {
    const notion = new NotionConnector({
      licenseKey: process.env.BRAINY_LICENSE_KEY,
      notionToken: process.env.NOTION_TOKEN
    })
    
    await brainy.addAugmentation('CONDUIT', notion, {
      name: 'notion',
      autoStart: true
    })
  }
  
  // Save config for remote Cortex access
  await brainy.saveConfiguration('/data/.cortex/config.json')
}

// API endpoints
app.post('/add', async (req, res) => {
  const { data, metadata } = req.body
  const id = await brainy.add(data, metadata)
  res.json({ id })
})

app.get('/search', async (req, res) => {
  const { query } = req.query
  const results = await brainy.search(query)
  res.json({ results })
})

// WebSocket for real-time
const server = app.listen(3000)
const io = require('socket.io')(server)

io.on('connection', (socket) => {
  socket.on('cortex:command', async (command) => {
    // Handle Cortex commands
    const result = await executeCortexCommand(command)
    socket.emit('cortex:result', result)
  })
})

initialize().then(() => {
  console.log('🧠⚛️ Brainy server ready on port 3000')
})
```

#### 2. Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

# Download models for offline use
RUN npm run download-models

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  brainy:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - BRAINY_LICENSE_KEY=${BRAINY_LICENSE_KEY}
      - AWS_ACCESS_KEY=${AWS_ACCESS_KEY}
      - AWS_SECRET_KEY=${AWS_SECRET_KEY}
      - S3_BUCKET=brainy-production
      - NOTION_TOKEN=${NOTION_TOKEN}
    volumes:
      - brainy-data:/data
      - ./augmentations:/app/augmentations
    restart: unless-stopped

  cortex:
    build: .
    command: cortex server --port 8080
    ports:
      - "8080:8080"
    environment:
      - BRAINY_SERVER=http://brainy:3000
      - BRAINY_LICENSE_KEY=${BRAINY_LICENSE_KEY}
    volumes:
      - brainy-data:/data
    depends_on:
      - brainy

volumes:
  brainy-data:
```

#### 3. Deploy to Cloud

```bash
# Deploy to AWS/GCP/Azure
docker-compose up -d

# Or deploy to Kubernetes
kubectl apply -f brainy-deployment.yaml
```

---

## Remote Connection

### Connect Cortex to Remote Brainy Server

#### Method 1: Direct API Connection

```bash
# Configure Cortex to use remote server
cortex config set server.url https://brainy.example.com
cortex config set server.apiKey your-api-key

# Now all commands go to remote
cortex add "Data to add remotely"
cortex search "remote search query"
cortex augmentations  # Shows remote augmentations
```

#### Method 2: WebSocket Connection (Real-time)

```bash
# Connect via WebSocket for real-time sync
cortex connect ws://brainy.example.com:3000
# Connected to remote Brainy server

# Add augmentation remotely
cortex augmentation add brainy-translator
# Augmentation added to remote server

# Configure remote augmentation
cortex augmentation config translator --set languages="en,es,fr"
# Configuration updated on remote server
```

#### Method 3: SSH Tunnel (Secure)

```bash
# Create SSH tunnel to server
ssh -L 3000:localhost:3000 user@brainy-server.com

# Connect Cortex to tunneled port
cortex config set server.url http://localhost:3000

# Now Cortex commands execute on remote server
cortex augmentations
cortex add "Secure data"
```

### Adding Augmentations Remotely

#### 1. Via Cortex CLI

```bash
# Connect to remote server
cortex connect https://brainy.example.com

# Add community augmentation
cortex augmentation install brainy-sentiment
cortex augmentation add brainy-sentiment --type PERCEPTION

# Add premium augmentation
cortex license activate lic_xxxxxxxxxxxxx
cortex augmentation activate salesforce-connector \
  --instance-url https://mycompany.salesforce.com \
  --access-token $SF_TOKEN

# Add custom augmentation
cortex augmentation upload ./my-custom.js
cortex augmentation add my-custom --type COGNITION

# Verify all augmentations
cortex augmentations
```

#### 2. Via REST API

```bash
# Add augmentation via API
curl -X POST https://brainy.example.com/api/augmentations \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CONDUIT",
    "name": "notion-connector",
    "config": {
      "licenseKey": "lic_xxxxxxxxxxxxx",
      "notionToken": "secret_xxxxxxxxx",
      "syncMode": "bidirectional"
    }
  }'

# Check status
curl https://brainy.example.com/api/augmentations \
  -H "Authorization: Bearer $API_KEY"
```

#### 3. Via Remote Management UI

```typescript
// admin-ui/src/AugmentationManager.tsx
import { useState, useEffect } from 'react'

export function RemoteAugmentationManager() {
  const [augmentations, setAugmentations] = useState([])
  
  async function addAugmentation(config) {
    const response = await fetch('/api/augmentations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(config)
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('Augmentation added:', result)
      refreshAugmentations()
    }
  }
  
  return (
    <div>
      <h2>🧠⚛️ Remote Augmentation Manager</h2>
      <AugmentationList items={augmentations} />
      <AddAugmentationForm onAdd={addAugmentation} />
    </div>
  )
}
```

### Production Deployment Example

```bash
# 1. Deploy Brainy server to AWS EC2
ssh ec2-user@brainy-prod.aws.com
docker-compose up -d

# 2. Connect local Cortex to production
cortex config set server.url https://brainy-prod.aws.com
cortex config set server.apiKey $PROD_API_KEY

# 3. Add production augmentations
cortex license activate $PROD_LICENSE_KEY
cortex augmentation activate notion-connector
cortex augmentation activate salesforce-connector

# 4. Configure for production workload
cortex augmentation config notion \
  --set syncMode=bidirectional \
  --set syncInterval=5 \
  --set maxConcurrent=10

# 5. Monitor augmentations
cortex monitor --dashboard
cortex augmentations --status
```

### Load Balancing Multiple Servers

```nginx
# nginx.conf for load balancing
upstream brainy_servers {
    server brainy1.internal:3000;
    server brainy2.internal:3000;
    server brainy3.internal:3000;
}

server {
    listen 443 ssl;
    server_name brainy.example.com;
    
    location / {
        proxy_pass http://brainy_servers;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /ws {
        proxy_pass http://brainy_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## License Management

### Activation

```bash
# Purchase or trial
cortex license purchase notion-connector
cortex license trial salesforce-connector

# Activate
cortex license activate lic_xxxxxxxxxxxxx

# Check status
cortex license status
```

### Environment Variables

```bash
# Set once, use everywhere
export BRAINY_LICENSE_KEY=lic_xxxxxxxxxxxxx

# Works in code
const notion = new NotionConnector({
  licenseKey: process.env.BRAINY_LICENSE_KEY
})

# Works in Cortex
cortex augmentation activate notion-connector
```

---

## API Reference

### Core Methods

```typescript
// Add augmentation
await brainy.addAugmentation(
  category: AugmentationType,
  augmentation: IAugmentation,
  options?: {
    name?: string
    position?: number
    autoStart?: boolean
  }
)

// Get augmentation
const aug = brainy.getAugmentation(category: string, name: string)

// Remove augmentation
await brainy.removeAugmentation(category: string, name: string)

// List all augmentations
const list = brainy.listAugmentations(category?: string)

// Configure augmentation
await aug.configure(config: Record<string, any>)
```

### Pipeline Control

```typescript
// Execute specific pipeline
await augmentationPipeline.executeSensePipeline(
  'processRawData',
  [data, type],
  { mode: ExecutionMode.PARALLEL }
)

// Register augmentation with pipeline
augmentationPipeline.register(augmentation)

// Get augmentations by type
const senseAugs = augmentationPipeline.getAugmentationsByType('sense')
```

---

## Best Practices

1. **Always let Neural Import run first** - It provides entity detection for other augmentations
2. **Use PARALLEL mode for independent augmentations** - Better performance
3. **Configure retry logic for network-based augmentations** - Handle transient failures
4. **Save configuration after changes** - Keep code and Cortex in sync
5. **Use environment variables for secrets** - Never hardcode credentials
6. **Monitor augmentation performance** - Use `cortex monitor` regularly
7. **Test augmentations locally first** - Before deploying to production

---

## Troubleshooting

### Common Issues

**Augmentation not running:**
```bash
cortex augmentations --verbose
# Check status and errors
```

**License validation failed:**
```bash
cortex license status
cortex license refresh
```

**Remote connection issues:**
```bash
cortex config test
cortex connect --debug
```

**Performance problems:**
```bash
cortex monitor --dashboard
cortex augmentation profile <name>
```

---

## Examples

### Complete Service Implementation

```typescript
// production-service.ts
import { BrainyData } from '@soulcraft/brainy'
import { 
  NotionConnector,
  SalesforceConnector 
} from '@soulcraft/brainy-quantum-vault'

export class ProductionDataService {
  private brainy: BrainyData
  
  async initialize() {
    // Initialize with S3 storage for production
    this.brainy = new BrainyData({
      storage: {
        s3Storage: {
          bucketName: 'brainy-production',
          region: 'us-east-1',
          accessKeyId: process.env.AWS_ACCESS_KEY,
          secretAccessKey: process.env.AWS_SECRET_KEY
        }
      },
      cache: {
        maxSize: 10000,
        ttl: 3600
      }
    })
    
    await this.brainy.init()
    // Neural Import ready
    
    // Add production augmentations
    await this.setupAugmentations()
    
    // Save config for Cortex
    await this.brainy.saveConfiguration('/data/.cortex/config.json')
  }
  
  private async setupAugmentations() {
    const licenseKey = process.env.BRAINY_LICENSE_KEY
    
    if (!licenseKey) {
      console.warn('No license key - running with free augmentations only')
      return
    }
    
    // Notion for documentation sync
    const notion = new NotionConnector({
      licenseKey,
      notionToken: process.env.NOTION_TOKEN,
      syncMode: 'bidirectional',
      autoSync: true,
      syncInterval: 30
    })
    
    await this.brainy.addAugmentation('CONDUIT', notion, {
      name: 'notion',
      autoStart: true
    })
    
    // Salesforce for CRM sync
    const salesforce = new SalesforceConnector({
      licenseKey,
      instanceUrl: process.env.SF_INSTANCE_URL,
      accessToken: process.env.SF_ACCESS_TOKEN,
      refreshToken: process.env.SF_REFRESH_TOKEN,
      syncContacts: true,
      syncOpportunities: true
    })
    
    await this.brainy.addAugmentation('CONDUIT', salesforce, {
      name: 'salesforce',
      autoStart: true
    })
    
    console.log('✅ Production augmentations configured')
  }
  
  // Service methods
  async processCustomerData(data: string, customerId: string) {
    // Flows through all augmentations
    const id = await this.brainy.add(data, { customerId })
    return id
  }
  
  async searchCustomers(query: string) {
    return await this.brainy.search(query)
  }
  
  async syncNow(target: 'notion' | 'salesforce') {
    const aug = this.brainy.getAugmentation('CONDUIT', target)
    if (aug) {
      await aug.triggerSync({ full: true })
    }
  }
}
```

---

## Support

- **Documentation**: https://soulcraft-research.com/brainy/docs
- **Community**: https://github.com/soulcraftlabs/brainy/discussions
- **Issues**: https://github.com/soulcraftlabs/brainy/issues
- **Premium Support**: support@soulcraft-research.com (license holders)

---

*🧠⚛️ Brainy Augmentations - Extending intelligence at the speed of thought*