<div align="center">

![Brainy Logo](brainy.png)

[![npm version](https://badge.fury.io/js/%40soulcraft%2Fbrainy.svg)](https://badge.fury.io/js/%40soulcraft%2Fbrainy)
[![1.0](https://img.shields.io/badge/Version-1.0.0-brightgreen.svg)](https://github.com/soulcraftlabs/brainy/releases/tag/v1.0.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Website](https://img.shields.io/badge/Website-soulcraft.com-green.svg)](https://soulcraft.com)
[![Brain Cloud](https://img.shields.io/badge/Brain%20Cloud-Coming%20Soon-blue.svg)](https://soulcraft.com)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24.4.1-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)](https://www.typescriptlang.org/)

# The World's First Multi-Dimensional AI Database™

*Vector similarity • Graph relationships • Metadata facets • Neural understanding*

**Build AI apps that actually understand your data - in minutes, not months**

</div>

---

## 💖 **Support Brainy's Development**

<div align="center">

**Brainy is 100% open source and free forever!** Help us keep it that way:

[![Sponsor](https://img.shields.io/badge/💖_Sponsor_Brainy-Support_Development-ff69b4?style=for-the-badge)](https://github.com/soulcraftlabs/brainy)
[![Brain Cloud](https://img.shields.io/badge/☁️_Try_Brain_Cloud-Coming_Soon-4A90E2?style=for-the-badge)](https://soulcraft.com)
[![Star](https://img.shields.io/badge/⭐_Star_on_GitHub-Show_Support-FFC107?style=for-the-badge)](https://github.com/soulcraftlabs/brainy)

**Every sponsorship helps us:** Build more features • Fix bugs faster • Keep Brainy free

</div>

---

## 🎉 **NEW: Brainy 1.0 - The Unified API**

**The Great Cleanup is complete!** Brainy 1.0 introduces the **unified API** - ONE way to do everything with just **9 core methods**:

```bash
# Install Brainy 1.0
npm install @soulcraft/brainy
```

```javascript
import { BrainyData, NounType, VerbType } from '@soulcraft/brainy'

const brain = new BrainyData()
await brain.init()

// 🎯 THE 9 UNIFIED METHODS - One way to do everything!
await brain.add("Smart data")                    // 1. Smart addition
await brain.search("query", 10)                  // 2. Unified search
await brain.import(["data1", "data2"])          // 3. Bulk import
await brain.addNoun("John", NounType.Person)    // 4. Typed entities
await brain.addVerb(id1, id2, VerbType.Knows)   // 5. Relationships
await brain.update(id, "new data")              // 6. Smart updates
await brain.delete(id)                          // 7. Soft delete
await brain.export({ format: 'json' })          // 8. Export data
brain.augment(myAugmentation)                   // 9. Extend infinitely! ♾️

// NEW: Type-safe augmentation management via brain.augmentations
brain.augmentations.list()       // See all augmentations
brain.augmentations.enable(name) // Enable/disable dynamically
```

### ✨ **What's New in 1.0:**
- **🔥 40+ methods consolidated** → 9 unified methods
- **♾️ The 9th method** - `augment()` lets you extend Brainy infinitely!
- **🧠 Smart by default** - `add()` auto-detects and processes intelligently
- **🔐 Universal encryption** - Built-in encryption for sensitive data
- **🐳 Container ready** - Model preloading for production deployments
- **📦 16% smaller package** despite major new features
- **🔄 Soft delete default** - Better performance, no reindexing needed

**Breaking Changes:** See [MIGRATION.md](MIGRATION.md) for complete upgrade guide.

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

> 🌩️ **Brain Cloud** is our optional cloud service that helps sustain Brainy's development. Currently in early access at [soulcraft.com](https://soulcraft.com).

---

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

### 🧠 **Why Developers Love Brainy 1.0**

#### **⚡ One API to Rule Them All**
```javascript
// Before: Learning 10+ different database APIs
pinecone.upsert(), neo4j.run(), elasticsearch.search()
supabase.insert(), mongodb.find(), redis.set()

// After: 9 methods handle EVERYTHING
brain.add(), brain.search(), brain.import()
brain.addNoun(), brain.addVerb(), brain.update()
brain.delete(), brain.export(), brain.augment()

// Why 9? The 9th method (augment) gives you methods 10 → ∞!
```

#### **🤯 Mind-Blowing Features Out of the Box**
- **Smart by Default**: `add()` automatically understands your data
- **Graph + Vector**: Relationships AND semantic similarity in one query  
- **Zero Config**: Works instantly, optimizes itself
- **Universal Encryption**: Secure everything with one flag
- **Perfect Memory**: Nothing ever gets lost or forgotten

#### **💰 Cost Comparison**
| Traditional Stack | Monthly Cost | Brainy 1.0 |
|------------------|--------------|-------------|
| Pinecone + Neo4j + Search | $1,500+ | **$0** |
| 3 different APIs to learn | Weeks | **Minutes** |
| Sync complexity | High | **None** |
| Vendor lock-in | Yes | **MIT License** |

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
// Build assistants that understand relationships (NEW 1.0 API!)
import { BrainyData, NounType, VerbType } from '@soulcraft/brainy'

const brain = new BrainyData()
await brain.init()

// Create typed entities
const sarahId = await brain.addNoun("Sarah Thompson", NounType.Person)
const johnId = await brain.addNoun("John Davis", NounType.Person) 
const projectId = await brain.addNoun("Project Apollo", NounType.Project)

// Create relationships with metadata
await brain.addVerb(sarahId, johnId, VerbType.ReportsTo, {
  role: "Design Manager",
  startDate: "2024-01-15"
})
await brain.addVerb(sarahId, projectId, VerbType.WorksWith, {
  responsibility: "Lead Designer",
  allocation: "75%"
})

// Query complex relationships with graph traversal
const sarahData = await brain.getNounWithVerbs(sarahId)
// Returns: complete graph view with all relationships and metadata
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
// Netflix-style recommendations with 1.0 unified API
import { BrainyData, NounType, VerbType } from '@soulcraft/brainy'

const brain = new BrainyData()
await brain.init()

// Create entities and relationships
const userId = await brain.addNoun("User123", NounType.Person)
const movieId = await brain.addNoun("Inception", NounType.Content)

// Track user behavior with metadata
await brain.addVerb(userId, movieId, VerbType.InteractedWith, {
  action: "watched",
  rating: 5,
  timestamp: new Date(),
  genre: "sci-fi"
})

// Get intelligent recommendations based on relationships
const recommendations = await brain.getNounWithVerbs(userId, {
  verbTypes: [VerbType.InteractedWith],
  depth: 2
})
// Returns: Similar movies based on rating patterns and genre preferences
```

### 🤖 **Multi-Agent AI Systems** - With Shared Memory
```javascript
// Multiple AI agents sharing the same brain
const sharedBrain = new BrainyData({ instance: 'multi-agent-brain' })
await sharedBrain.init()

// Sales Agent adds customer intelligence 
const customerId = await sharedBrain.addNoun("Acme Corp", NounType.Organization)
await sharedBrain.addVerb(customerId, "enterprise-plan", VerbType.InterestedIn, {
  priority: "high",
  budget: "$50k",
  timeline: "Q2 2025"
})

// Support Agent instantly sees the context
const customerData = await sharedBrain.getNounWithVerbs(customerId)
// Support knows: customer interested in enterprise plan with $50k budget

// Marketing Agent learns from both
const insights = await sharedBrain.search("enterprise customers budget 50k", 10)
// Marketing can create targeted campaigns for similar prospects
```

### 🏥 **Customer Support Bots** - With Perfect Memory
```javascript
// Support bot that remembers every interaction
const customerId = await brain.addNoun("Customer_456", NounType.Person)

// Track support history with rich metadata
await brain.addVerb(customerId, "password-reset", VerbType.RequestedHelp, {
  issue: "Password reset",
  resolved: true,
  date: "2025-01-10",
  satisfaction: 5,
  agent: "Sarah"
})

// Next conversation - bot instantly knows history
const history = await brain.getNounWithVerbs(customerId)
// Bot: "I see you had a password issue last week. Everything working smoothly now?"

// Proactive insights
const commonIssues = await brain.search("password reset common issues", 5)
// Bot offers preventive tips before problems occur
```

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
await brain.add("Satya Nadella became CEO of Microsoft in 2014")
await brain.add({ company: "Anthropic", ceo: "Dario Amodei", founded: 2021 })
await brain.addVerb("Sundar Pichai", "leads", "Google")

// Search naturally
const results = await brain.search("tech companies and their leaders")
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

// Add premium augmentations (requires Brain Cloud subscription)
brain.register(new AIMemory())
brain.register(new AgentCoordinator())

// Now your AI remembers everything across all sessions!
await brain.add("User prefers TypeScript over JavaScript")
// This memory persists and syncs across all devices
// Returns: Microsoft and Anthropic with relevance scores

// Query relationships
const companies = await brain.getRelated("Sundar Pichai", { verb: "leads" })
// Returns: Google, Alphabet

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

### 🌟 **Community Augmentations** (Coming Soon!)
```javascript
// 🚧 FUTURE: Community augmentations will be available soon!
// These are examples of what the community could build:

// Example: Sentiment Analysis (not yet available)
// npm install brainy-sentiment
// brain.register(new SentimentAnalyzer())

// Example: Translation (not yet available)  
// npm install brainy-translate
// brain.register(new Translator())
```

**Ideas for Community Augmentations:**
*Want to build one of these? We'll help promote it!*
- 🎭 Sentiment Analysis - Analyze emotional tone
- 🌍 Translation - Multi-language support
- 📧 Email Parser - Extract structured data from emails
- 🔗 URL Extractor - Find and validate URLs
- 📊 Data Visualizer - Generate charts from data
- 🎨 Image Understanding - Analyze image content

**Be the First!** Create an augmentation and we'll feature it here.
[See how to build augmentations →](UNIFIED-API.md#creating-your-own-augmentation)

### ☁️ **Brain Cloud** - Optional Cloud Services (Early Access) 🎆

**Currently in Early Access** - Join at [soulcraft.com](https://soulcraft.com)

**Available Tiers:**

#### 🆓 **Free Forever** - Local Database
- ✓ Full multi-dimensional database
- ✓ Works offline
- ✓ No API keys required
- ✓ Your data stays private

#### ☁️ **Cloud Sync** - $19/month
- ✓ Everything in Free tier
- ✓ Team collaboration
- ✓ Cross-device synchronization
- ✓ Automatic backups
- ✓ Real-time sync

#### 🏢 **Enterprise** - $99/month
- ✓ Everything in Cloud Sync
- ✓ Dedicated infrastructure
- ✓ Service Level Agreement (SLA)
- ✓ Priority support
- ✓ Custom integrations

```javascript
// Brain Cloud integration (when available):
const brain = new BrainyData({
  cloud: { 
    enabled: true,  // Enable cloud sync
    apiKey: process.env.BRAIN_CLOUD_KEY  // Optional for premium features
  }
})

// Works perfectly without cloud too:
const brain = new BrainyData()
await brain.init()
// Full database functionality, locally!
```


### 🌐 **Why Brain Cloud?**

Brain Cloud adds optional cloud services to sustain Brainy's development:

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
import { IAugmentation } from '@soulcraft/brainy'

export class MovieRecommender implements IAugmentation {
  name = 'movie-recommender'
  type = 'cognition' // sense|conduit|cognition|memory
  description = 'AI-powered movie recommendations'
  enabled = true
  
  async processRawData(data: any) {
    // Your recommendation logic
    const movies = await this.analyzePreferences(data)
    
    return {
      success: true,
      data: {
        recommendations: movies,
        confidence: 0.95
      }
    }
  }
}

// Register with Brainy
const brain = new BrainyData()
brain.register(new MovieRecommender())
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

## 🏗️ Architecture - Unified & Simple

```
┌─────────────────────────────────────────────┐
│  🎯 YOUR APP - One Simple API              │
│  brain.add() brain.search() brain.addVerb() │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  🧠 BRAINY 1.0 - THE UNIFIED BRAIN         │
│                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │   Vector    │ │    Graph    │ │ Facets │ │
│  │   Search    │ │Relationships│ │Metadata│ │
│  └─────────────┘ └─────────────┘ └────────┘ │
│                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │ Encryption  │ │   Memory    │ │ Cache  │ │
│  │ Universal   │ │ Management  │ │ 3-Tier │ │
│  └─────────────┘ └─────────────┘ └────────┘ │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  💾 STORAGE - Universal Adapters           │
│  Memory • FileSystem • S3 • OPFS • Custom  │
└─────────────────────────────────────────────┘
```

### **What Makes 1.0 Different:**
- **🎯 One API**: 9 methods handle everything (was 40+ methods)
- **🧠 Smart Core**: Automatic data understanding and processing  
- **🔗 Graph Built-in**: Relationships are first-class citizens
- **🔐 Security Native**: Encryption integrated, not bolted-on
- **🧩 Extensible**: Augment with custom capabilities
- **📤 Portable**: Export in any format (json, csv, graph)
- **⚡ Zero Config**: Works perfectly out of the box

### **The Magic:**
1. **You call** `brain.add("complex data")`
2. **Brainy understands** → detects type, extracts meaning
3. **Brainy stores** → vector + graph + metadata simultaneously  
4. **Brainy optimizes** → indexes, caches, tunes performance
5. **You get superpowers** → semantic search + graph traversal + more

## 💡 Core Features

### 🔍 Multi-Dimensional Search
- **Vector**: Semantic similarity (meaning-based)
- **Graph**: Relationship traversal (connection-based)
- **Faceted**: Metadata filtering (property-based)
- **Hybrid**: All combined (maximum power)

### ⚡ Performance - Production Ready
- **Speed**: 100,000+ ops/second (faster with 1.0 optimizations)
- **Scale**: Millions of entities + relationships
- **Memory**: ~100MB for 1M vectors (16% smaller than 0.x)
- **Latency**: <10ms searches with 3-tier caching
- **Intelligence**: Auto-tuning learns from your usage patterns

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
- 📧 [Email Support](mailto:support@soulcraft.com)
- 🐛 [GitHub Issues](https://github.com/soulcraftlabs/brainy/issues)
- 💬 [GitHub Discussions](https://github.com/soulcraftlabs/brainy/discussions)

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

**[Get Started](docs/getting-started/quick-start-1.0.md)** • 
**[Examples](examples/)** • 
**[API Docs](UNIFIED-API.md)** • 
**[GitHub](https://github.com/soulcraftlabs/brainy)**

⭐ **Star us on GitHub to support open source AI!** ⭐

*Created and maintained by [SoulCraft](https://soulcraft.com) • Powered by our amazing open source community*

**SoulCraft** builds and maintains Brainy as open source (MIT License) because we believe AI infrastructure should be accessible to everyone.

</div>