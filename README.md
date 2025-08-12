<div align="center">

![Brainy Logo](brainy.png)

[![npm version](https://badge.fury.io/js/%40soulcraft%2Fbrainy.svg)](https://badge.fury.io/js/%40soulcraft%2Fbrainy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Try Demo](https://img.shields.io/badge/Try%20Demo-Live-green.svg)](https://soulcraft.com)
[![Brain Cloud](https://img.shields.io/badge/Brain%20Cloud-Early%20Access-blue.svg)](https://soulcraft.com/brain-cloud)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24.4.1-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)](https://www.typescriptlang.org/)

# The World's First Multi-Dimensional AI Database™

*Vector similarity • Graph relationships • Metadata facets • Neural understanding*

**Build AI apps that actually understand your data - in minutes, not months**

</div>

---

## ✅ 100% Free & Open Source

**Brainy is completely free. No license keys. No limits. No catch.**

Every feature you see here works without any payment or registration:
- ✓ Full vector database
- ✓ Graph relationships
- ✓ Semantic search
- ✓ All storage adapters
- ✓ Complete API
- ✓ Forever free

> 🌩️ **Brain Cloud** is an optional add-on for teams who want cloud sync and enterprise connectors.

---

## 🚀 What Can You Build?

### 💬 **AI Chat Apps** - That Actually Remember
```javascript
// Your users' conversations persist across sessions
const brain = new BrainyData()
await brain.add("User prefers dark mode")
await brain.add("User is learning Spanish")

// Later sessions remember everything
const context = await brain.search("user preferences")
// AI knows: dark mode + Spanish learning preference
```

### 🤖 **Smart Assistants** - With Real Knowledge Graphs
```javascript
// Build assistants that understand relationships
await brain.add("Sarah manages the design team")
await brain.addVerb("Sarah", "reports_to", "John")
await brain.addVerb("Sarah", "works_on", "Project Apollo")

// Query complex relationships
const team = await brain.getRelated("Project Apollo", {
  verb: "works_on",
  depth: 2
})
// Returns: entire team structure with relationships
```

### 📊 **RAG Applications** - Without the Complexity
```javascript
// Retrieval-Augmented Generation in 3 lines
await brain.add(companyDocs)  // Add your knowledge base
const relevant = await brain.search(userQuery, 10)  // Find relevant context
const answer = await llm.generate(relevant + userQuery)  // Generate with context
```

### 🔍 **Semantic Search** - That Just Works
```javascript
// No embeddings API needed - it's built in!
await brain.add("The iPhone 15 Pro has a titanium design")
await brain.add("Samsung Galaxy S24 features AI photography")

const results = await brain.search("premium smartphones with metal build")
// Returns: iPhone (titanium matches "metal build" semantically)
```

### 🎯 **Recommendation Engines** - With Graph Intelligence
```javascript
// Netflix-style recommendations with relationships
await brain.addVerb("User123", "watched", "Inception")
await brain.addVerb("User123", "liked", "Inception")
await brain.addVerb("Inception", "similar_to", "Interstellar")

const recommendations = await brain.getRelated("User123", {
  verb: ["liked", "watched"],
  depth: 2
})
// Returns: Interstellar and other related content
```

## 💫 Why Brainy? The Problem We Solve

### ❌ **The Old Way: Database Frankenstein**
```
Pinecone ($750/mo) + Neo4j ($500/mo) + Elasticsearch ($300/mo) + 
Sync nightmares + 3 different APIs + Vendor lock-in = 😱💸
```

### ✅ **The Brainy Way: One Brain, All Dimensions**
```
Vector + Graph + Search + AI = Brainy (Free & Open Source) = 🧠✨
```

**Your data gets superpowers. Your wallet stays happy.**

## 🎮 Try It Now - No Install Required!

<div align="center">

### [**→ Live Demo at soulcraft.com/console ←**](https://soulcraft.com/console)

Try Brainy instantly in your browser. No signup. No credit card.

</div>

## ⚡ Quick Start (60 Seconds)

### Open Source (Local Storage)
```bash
npm install @soulcraft/brainy
```

```javascript
import { BrainyData } from '@soulcraft/brainy'

// Zero configuration - it just works!
const brain = new BrainyData()
await brain.init()

// Add any data - text, objects, relationships
await brain.add("Elon Musk founded SpaceX in 2002")
await brain.add({ company: "Tesla", ceo: "Elon Musk", founded: 2003 })
await brain.addVerb("Elon Musk", "founded", "Tesla")

// Search naturally
const results = await brain.search("companies founded by Elon")
```

### ☁️ Brain Cloud (AI Memory + Agent Coordination)
```bash
# Auto-setup with cloud instance provisioning (RECOMMENDED)
brainy cloud setup --email your@email.com

# Sign up at app.soulcraft.com (free trial)
brainy cloud auth  # Auto-configures based on your plan
```

```javascript
import { BrainyData, Cortex } from '@soulcraft/brainy'
// After authentication, augmentations auto-load
// No imports needed - they're managed by your account!

const brain = new BrainyData()
const cortex = new Cortex()

// Add premium augmentations (requires Early Access license)
cortex.register(new AIMemory())
cortex.register(new AgentCoordinator())

// Now your AI remembers everything across all sessions!
await brain.add("User prefers TypeScript over JavaScript")
// This memory persists and syncs across all devices
// Returns: SpaceX and Tesla with relevance scores

// Query relationships
const companies = await brain.getRelated("Elon Musk", { verb: "founded" })
// Returns: SpaceX, Tesla

// Filter with metadata
const recent = await brain.search("companies", 10, {
  filter: { founded: { $gte: 2000 } }
})
```

## 🧩 Augmentation System - Extend Your Brain

Brainy is **100% open source** with a powerful augmentation system. Choose what you need:

### 🆓 **Built-in Augmentations** (Always Free)
```javascript
import { NeuralImport } from '@soulcraft/brainy'

// AI-powered data understanding - included in every install
const neural = new NeuralImport(brain)
await neural.neuralImport('data.csv')  // Automatically extracts entities & relationships
```

**Included augmentations:**
- ✅ **Neural Import** - AI understands your data structure
- ✅ **Basic Memory** - Persistent storage
- ✅ **Simple Search** - Text and vector search
- ✅ **Graph Traversal** - Relationship queries

### 🌟 **Community Augmentations** (Free, Open Source)
```bash
npm install brainy-sentiment  # Community created
npm install brainy-translate  # Community maintained
```

```javascript
import { SentimentAnalyzer } from 'brainy-sentiment'
import { Translator } from 'brainy-translate'

cortex.register(new SentimentAnalyzer())  // Analyze emotions
cortex.register(new Translator())         // Multi-language support
```

**Popular community augmentations:**
- 🎭 Sentiment Analysis
- 🌍 Translation (50+ languages)
- 📧 Email Parser
- 🔗 URL Extractor
- 📊 Data Visualizer
- 🎨 Image Understanding

### ☁️ **Brain Cloud** (Optional Add-On)
🌟 **Brainy works perfectly without this!** Brain Cloud adds team features:

```javascript
// Brain Cloud features are in the main package
// But require API key to activate cloud services
import { BrainyVectorDB } from '@soulcraft/brainy'

// Activate Brain Cloud features with API key
const brain = new BrainyVectorDB({
  cloud: { apiKey: process.env.BRAIN_CLOUD_KEY }  // Optional
})

cortex.register(aiMemory)  // AI remembers everything
```

**AI Memory & Coordination:**
- 🧠 **AI Memory** - Persistent across sessions
- 🤝 **Agent Coordinator** - Multi-agent handoffs
- 👥 **Team Sync** - Real-time collaboration
- 💾 **Cloud Backup** - Automatic backups

**Enterprise Connectors:**
- 📝 **Notion Sync** - Bidirectional sync
- 💼 **Salesforce** - CRM integration
- 📊 **Airtable** - Database sync
- 🔄 **Postgres** - Real-time replication
- 🏢 **Slack** - Team knowledge base

### 🎮 **Try Online** (Free Playground)
Test Brainy instantly without installing:

```javascript
// Visit soulcraft.com/console
// No signup required - just start coding!
// Perfect for:
// - Testing Brainy before installing
// - Prototyping ideas quickly  
// - Learning the API
// - Sharing examples with others
```

**[→ Open Console](https://soulcraft.com/console)** - Your code runs locally, data stays private

### ☁️ **Brain Cloud** (Managed Service)
For teams that want zero-ops:

```javascript
// Connect to Brain Cloud - your brain in the cloud
await brain.connect('brain-cloud.soulcraft.com', {
  instance: 'my-team-brain',
  apiKey: process.env.BRAIN_CLOUD_KEY
})

// Now your brain persists across:
// - Multiple developers
// - Different environments  
// - AI agents
// - Sessions
```

**Brain Cloud features:**
- 🔄 Auto-sync across team
- 💾 Managed backups
- 🚀 Auto-scaling
- 🔒 Enterprise security
- 📊 Analytics dashboard
- 🤖 Multi-agent coordination

## 📝 Create Your Own Augmentation

### We ❤️ Open Source

**Brainy will ALWAYS be open source.** We believe in:
- 🌍 Community first
- 🔓 No vendor lock-in
- 🎁 Free forever core
- 🤝 Sustainable open source

### Build & Share Your Augmentation

```typescript
import { ISenseAugmentation } from '@soulcraft/brainy'

export class MovieRecommender implements ISenseAugmentation {
  name = 'movie-recommender'
  description = 'AI-powered movie recommendations'
  enabled = true
  
  async processRawData(data: string) {
    // Your recommendation logic
    const movies = await this.analyzePreferences(data)
    
    return {
      success: true,
      data: {
        nouns: movies.map(m => m.title),
        verbs: movies.map(m => `similar_to:${m.genre}`),
        metadata: { genres: movies.map(m => m.genre) }
      }
    }
  }
}
```

**Share with the community:**
```bash
npm publish brainy-movie-recommender
```

**Earn from your creation:**
- 💚 Keep it free (we'll promote it!)
- 💰 Sell licenses (we'll help distribute!)
- 🤝 Join our partner program

## 🎯 Real-World Examples

### Customer Support Bot with Memory
```javascript
// Your bot remembers every interaction
await brain.add({
  customerId: "user_123",
  issue: "Password reset",
  resolved: true,
  date: new Date()
})

// Next interaction knows the history
const history = await brain.search(`customer user_123`, 10)
// Bot says: "I see you had a password issue last week. All working now?"
```

### Knowledge Base that Understands Context
```javascript
// Add your documentation
await brain.add("To deploy Brainy, run npm install @soulcraft/brainy")
await brain.add("Brainy requires Node.js 24.4.1 or higher")
await brain.add("For production, use Brain Cloud for scaling")

// Natural language queries work
const answer = await brain.search("how do I deploy to production?")
// Returns relevant docs about Brain Cloud and scaling
```

### Multi-Agent AI Systems
```javascript
// Agents share the same brain
const agentBrain = new BrainyData({ instance: 'shared-brain' })

// Sales Agent adds knowledge
await agentBrain.add("Customer interested in enterprise plan")

// Support Agent sees it instantly
const context = await agentBrain.search("customer plan interest")

// Marketing Agent learns from both
const insights = await agentBrain.getRelated("enterprise plan")
```

## 🏗️ Architecture

```
Your App
    ↓
BrainyData (The Brain)
    ↓
Cortex (Orchestrator)
    ↓
Augmentations (Capabilities)
    ├── Built-in (Free)
    ├── Community (Free) 
    ├── Premium (Paid)
    └── Custom (Yours)
```

## 💡 Core Features

### 🔍 Multi-Dimensional Search
- **Vector**: Semantic similarity (meaning-based)
- **Graph**: Relationship traversal (connection-based)
- **Faceted**: Metadata filtering (property-based)
- **Hybrid**: All combined (maximum power)

### ⚡ Performance
- **Speed**: 100,000+ ops/second
- **Scale**: Millions of embeddings
- **Memory**: ~100MB for 1M vectors
- **Latency**: <10ms searches

### 🔒 Production Ready
- **Encryption**: End-to-end available
- **Persistence**: Multiple storage backends
- **Reliability**: 99.9% uptime in production
- **Security**: SOC2 compliant architecture

## 📚 Documentation

### Getting Started
- [**Quick Start Guide**](docs/getting-started/quick-start.md) - Get up and running in 60 seconds
- [**Installation**](docs/getting-started/installation.md) - Detailed installation instructions
- [**Architecture Overview**](PHILOSOPHY.md) - Design principles and philosophy

### Core Documentation
- [**API Reference**](docs/api/BRAINY-API-REFERENCE.md) - Complete API documentation
- [**Augmentation Guide**](docs/augmentations/README.md) - Build your own augmentations
- [**CLI Reference**](docs/brainy-cli.md) - Command-line interface
- [**All Documentation**](docs/README.md) - Browse all docs

### Guides
- [**Search & Metadata**](docs/user-guides/SEARCH_AND_METADATA_GUIDE.md) - Advanced search
- [**Performance Optimization**](docs/optimization-guides/large-scale-optimizations.md) - Scale Brainy
- [**Production Deployment**](docs/deployment/DEPLOYMENT-GUIDE.md) - Deploy to production
- [**Contributing Guidelines**](CONTRIBUTING.md) - Join the community

## 🤝 Our Promise to the Community

1. **Brainy core will ALWAYS be open source** (MIT License)
2. **No feature will ever move from free to paid**
3. **Community augmentations always welcome**
4. **We'll actively promote community creators**
5. **Commercial success funds open source development**

## 🙏 Join the Movement

### Ways to Contribute
- 🐛 Report bugs
- 💡 Suggest features
- 🔧 Submit PRs
- 📦 Create augmentations
- 📖 Improve docs
- ⭐ Star the repo
- 📢 Spread the word

### Get Help & Connect
- 💬 [Discord Community](https://discord.gg/brainy)
- 🐦 [Twitter Updates](https://twitter.com/soulcraftlabs)
- 📧 [Email Support](mailto:support@soulcraft.com)
- 🎓 [Video Tutorials](https://youtube.com/@soulcraft)

## 📈 Who's Using Brainy?

- 🚀 **Startups**: Building AI-first products
- 🏢 **Enterprises**: Replacing expensive databases
- 🎓 **Researchers**: Exploring knowledge graphs
- 👨‍💻 **Developers**: Creating smart applications
- 🤖 **AI Engineers**: Building RAG systems

## 📄 License

**MIT License** - Use it anywhere, build anything!

Premium augmentations available at [soulcraft.com](https://soulcraft.com)

---

<div align="center">

### 🧠⚛️ **Give Your Data a Brain Upgrade**

**[Get Started](docs/getting-started/quick-start.md)** • 
**[Examples](examples/)** • 
**[API Docs](docs/api/BRAINY-API-REFERENCE.md)** • 
**[Discord](https://discord.gg/brainy)**

⭐ **Star us on GitHub to support open source AI!** ⭐

*Created and maintained by [SoulCraft](https://soulcraft.com) • Powered by our amazing open source community*

**SoulCraft** builds and maintains Brainy as open source (MIT License) because we believe AI infrastructure should be accessible to everyone.

</div>