# 🧠 Brainy Augmentation Architecture - Complete Guide

## Overview

Brainy has a clear augmentation system with four tiers:

```
1. Built-in (Free, Always Included)
2. Community (Free, npm packages)  
3. Premium (Brain Cloud subscription - auto-loads after auth)
4. Brain Cloud (Managed Service)
```

## 1. Built-in Augmentations (Always Free)

These come with every Brainy installation:

### Currently Implemented:
- **NeuralImport** - AI-powered data understanding
- **Basic Storage** - Filesystem/memory persistence
- **Vector Search** - Semantic similarity
- **Graph Traversal** - Relationship queries

### To Be Added (Still Built-in):
```javascript
// src/augmentations/built-in/
├── autoSave.ts        // Automatic persistence
├── basicCache.ts      // Query caching
├── simpleBackup.ts    // Local backups
└── metadataIndex.ts   // Facet indexing
```

## 2. Community Augmentations (Free, Open Source)

Published to npm by the community:

```bash
# Examples (to be created by community)
npm install brainy-sentiment      # Sentiment analysis
npm install brainy-translator     # Multi-language
npm install brainy-summarizer     # Text summarization
npm install brainy-classifier     # Text classification
```

Usage:
```javascript
import { SentimentAnalyzer } from 'brainy-sentiment'

const cortex = new Cortex()
cortex.register(new SentimentAnalyzer())
```

## 3. Premium Augmentations (Brain Cloud Auto-Loading)

The `/brain-cloud` project contains premium augmentations:

### Core Premium Features (AI Memory & Coordination):
```javascript
// After 'brainy cloud auth', these are automatically available:
// - AIMemory           // Persistent AI memory across sessions  
// - AgentCoordinator   // Multi-agent handoffs
// - TeamSync          // Real-time team synchronization
// - CloudBackup       // Automatic cloud backups

// No imports needed - they auto-load based on your subscription!
const cortex = new Cortex()
// Premium augmentations are automatically registered
```

### Enterprise Connectors (Auto-Loading):
```javascript
// Enterprise augmentations auto-load for Team+ plans after auth:
// - NotionSync        // Bidirectional Notion sync
// - SalesforceConnect // CRM integration  
// - AirtableSync      // Database sync
// - PostgresSync      // Real-time replication
// - SlackMemory       // Team knowledge base
// - AnalyticsSuite    // Business intelligence

// Just configure with your credentials - no imports needed!
await brainy.connectNotion({
  notionToken: process.env.NOTION_TOKEN
})
```

## 4. Brain Cloud Service (Managed)

The hosted service at brain-cloud.soulcraft.com:

```javascript
// Connect to managed service
await brain.connect('brain-cloud.soulcraft.com', {
  instance: 'my-team',
  apiKey: process.env.BRAIN_CLOUD_KEY
})
```

## CLI Commands Structure

### Core Commands (brainy)
```bash
# Database operations
brainy init              # Initialize Brainy
brainy add "data"        # Add data
brainy search "query"    # Search
brainy chat              # Interactive chat

# Augmentation management
brainy augment           # List augmentations
brainy augment add       # Add augmentation (interactive)
brainy augment remove    # Remove augmentation
brainy augment config    # Configure augmentation

# Brain Cloud connection
brainy cloud             # Connect to Brain Cloud service
brainy cloud --status    # Check connection status
brainy cloud --sync      # Force sync
```

### Installing Augmentations via CLI

#### Built-in (always available):
```bash
brainy augment enable neural-import
brainy augment enable auto-save
```

#### Community (from npm):
```bash
# Install from npm first
npm install -g brainy-sentiment

# Then register with Brainy
brainy augment add brainy-sentiment --type sense
```

#### Premium (requires license):
```bash
# Set license key
export BRAINY_LICENSE_KEY=lic_xxxxx

# Install premium package
brainy cloud auth  # Auto-configures based on your subscription

# Register augmentations
brainy augment add ai-memory --premium
brainy augment add notion-sync --premium
```

#### For Brain Cloud service:
```bash
# Connect to cloud (handles everything)
brainy cloud --connect YOUR_CUSTOMER_ID
```

## How Augmentations Work

### 1. Local Instance
```javascript
const brain = new BrainyData()
const cortex = new Cortex()

// Register augmentations
cortex.register(new NeuralImport(brain))      // Built-in
cortex.register(new SentimentAnalyzer())      // Community
cortex.register(new NotionSync({ key }))      // Premium

await brain.init()
```

### 2. Remote Hosted Instance
```javascript
// Connect to remote Brainy
const brain = new BrainyData({
  remote: 'https://my-brainy-server.com'
})

// Augmentations run on server
await brain.addAugmentation('sentiment-analyzer')
```

### 3. Brain Cloud Instance
```javascript
// Connect to Brain Cloud
const brain = new BrainyData({
  cloud: true,
  customerId: 'cust_xxx'
})

// All premium augmentations available
// Managed by Brain Cloud service
```

## Directory Structure

### /brainy (this project)
```
src/
├── augmentations/
│   ├── built-in/          # Free, always included
│   │   ├── neuralImport.ts
│   │   ├── autoSave.ts
│   │   └── basicCache.ts
│   └── cortexSense.ts     # Legacy, being refactored
├── cortex.ts              # Orchestrator
└── brainyData.ts          # Core database
```

### /brain-cloud (premium project)
```
src/
├── augmentations/
│   ├── memory/            # AI Memory features
│   │   ├── aiMemory.ts
│   │   ├── agentCoordinator.ts
│   │   └── teamSync.ts
│   ├── enterprise/        # Enterprise connectors
│   │   ├── notionSync.ts
│   │   ├── salesforce.ts
│   │   └── airtable.ts
│   └── index.ts          # Main exports
├── licensing/            # License validation
└── cloud-service/        # Brain Cloud API
```

## Migration Plan

### Phase 1: Update References
- [x] Replace all `brainy-quantum-vault` → Brain Cloud managed service
- [ ] Update documentation
- [ ] Update CLI commands

### Phase 2: Restructure brain-cloud
- [ ] Organize enterprise connectors in brain-cloud managed service
- [ ] Add AI memory augmentations
- [ ] Implement license validation

### Phase 3: CLI Enhancement
- [ ] Add `brainy augment` commands
- [ ] Interactive augmentation installer
- [ ] Auto-detect available augmentations

### Phase 4: Documentation
- [ ] Update README with clear tiers
- [ ] Create augmentation development guide
- [ ] Website update instructions

## License Model

```
Built-in:  MIT License (Free forever)
Community: Varies (usually MIT)
Premium:   Commercial License ($49-299/mo)
Cloud:     Subscription ($19-99/mo)
```

## The Promise

1. **Built-in augmentations are ALWAYS free**
2. **No feature moves from free to paid**
3. **Community contributions welcome**
4. **Premium funds open source development**
5. **Brain Cloud is optional, not required**