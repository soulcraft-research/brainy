# Brainy 1.0 Quick Start Guide

Get up and running with Brainy 1.0's unified API in just a few minutes!

## 🎉 What's New in 1.0?

Brainy 1.0 introduces the **unified API** - ONE way to do everything with just **7 core methods**:

```javascript
// 🎯 THE 7 UNIFIED METHODS:
await brain.add("Smart data addition")           // 1. Smart addition
await brain.addNoun("John Doe", NounType.Person) // 2. Typed entities  
await brain.addVerb(id1, id2, VerbType.CreatedBy) // 3. Relationships
await brain.search("smart data", 10)             // 4. Vector search
await brain.import(["data1", "data2"])           // 5. Bulk import
await brain.update(id1, "Updated data")          // 6. Smart updates
await brain.delete(verb)                         // 7. Soft delete
```

## ⚡ The 2-Minute Setup

### 1. Install Brainy 1.0

```bash
# Install the latest release candidate
npm install @soulcraft/brainy@rc
```

### 2. Create Your First Smart Database

```javascript
import { BrainyData } from '@soulcraft/brainy'

// Zero configuration - it just works!
const brain = new BrainyData()
await brain.init()

// Smart data addition - automatically detects and processes
const id1 = await brain.add("Elon Musk founded SpaceX in 2002")
const id2 = await brain.add({ company: "Tesla", ceo: "Elon Musk", founded: 2003 })

// Search naturally
const results = await brain.search("companies founded by Elon", 5)
console.log('Found:', results)
```

🎉 **Congratulations!** You now have Brainy 1.0 running with:
- ✅ Automatic data understanding
- ✅ Smart semantic search  
- ✅ Graph relationships
- ✅ Zero configuration

## 🎯 Choose Your Scenario

### Scenario 1: Smart Data Management (NEW 1.0 API!)

```javascript
import { BrainyData, NounType, VerbType } from '@soulcraft/brainy'

const brain = new BrainyData()
await brain.init()

// Create typed entities with the new addNoun() method
const sarahId = await brain.addNoun("Sarah Thompson", NounType.Person)
const projectId = await brain.addNoun("Project Apollo", NounType.Project)

// Create relationships with metadata using addVerb()
await brain.addVerb(sarahId, projectId, VerbType.WorksWith, {
  role: "Lead Designer",
  allocation: "75%",
  startDate: "2024-01-15"
})

// Query complex relationships with graph traversal
const sarahData = await brain.getNounWithVerbs(sarahId)
console.log('Sarah\'s relationships:', sarahData)
```

### Scenario 2: Bulk Data Import

```javascript
import { BrainyData } from '@soulcraft/brainy'

const brain = new BrainyData()
await brain.init()

// Bulk import with the new import() method
const documents = [
  "Climate change affects global weather patterns",
  "Machine learning models can predict weather", 
  "Solar panels reduce carbon emissions"
]

const ids = await brain.import(documents)
console.log(`Imported ${ids.length} documents`)

// Search across all imported data
const results = await brain.search("environmental sustainability", 3)
```

### Scenario 3: Data Updates and Management

```javascript
import { BrainyData } from '@soulcraft/brainy'

const brain = new BrainyData()
await brain.init()

// Add initial data
const docId = await brain.add("Initial document about AI")

// Update with smart synchronization
await brain.update(docId, "Updated document about artificial intelligence and machine learning")

// Soft delete (preserves indexes, better performance)
await brain.delete(docId) // Soft delete by default
```

### Scenario 4: Production with Encryption

```javascript
import { BrainyData } from '@soulcraft/brainy'

const brain = new BrainyData()
await brain.init()

// Set encrypted configuration
await brain.setConfig('api_key', 'secret-key-123', { encrypt: true })

// Add encrypted sensitive data
const sensitiveId = await brain.add("Confidential customer data", {
  encrypted: true,
  classification: "sensitive"
})

// Retrieve encrypted config
const apiKey = await brain.getConfig('api_key') // Automatically decrypted
```

## 🧠 What Makes 1.0 Special?

### 🎯 **Smart by Default**
- `add()` automatically detects data types and processes intelligently
- No need to choose between different methods - one method handles everything

### 🔗 **Graph Intelligence Built-in**  
- `addNoun()` and `addVerb()` create rich knowledge graphs
- `getNounWithVerbs()` provides complete relationship views
- Metadata embedding for searchable relationships

### ⚡ **Performance Optimized**
- Soft delete by default (no reindexing needed)
- 16% smaller package despite major features
- All scaling optimizations preserved

### 🔐 **Security Enhanced**
- Universal encryption system built-in
- Works across Browser, Node.js, and Serverless
- Per-item and configuration encryption

## 📋 Complete Migration Example

### Migrating from 0.x to 1.0

```javascript
// ❌ OLD (0.x) - Multiple methods, complex API
import { createAutoBrainy } from '@soulcraft/brainy'

const brainy = createAutoBrainy()
await brainy.addVector({ id: '1', vector: [0.1, 0.2, 0.3], text: 'Hello' })
await brainy.addSmart("Smart data")
const results = await brainy.searchSimilar("query", 10)

// ✅ NEW (1.0) - Unified API, smart defaults
import { BrainyData } from '@soulcraft/brainy'

const brain = new BrainyData()
await brain.init()
await brain.add("Hello world")           // Smart by default!
await brain.add("Smart data")            // Same intelligence, cleaner API
const results = await brain.search("query", 10)  // Same power, unified method
```

### CLI Migration

```bash
# ❌ OLD (0.x)
brainy add-smart "data"
brainy search-similar "query"  
brainy add-vector --literal "text"

# ✅ NEW (1.0) 
brainy add "data"              # Smart by default!
brainy search "query"          # Unified search
brainy add "text" --literal    # Explicit modes available
```

## 🚀 Next Steps

### Learn Advanced Features
- **[Graph Operations](../api-reference/graph-operations.md)** - Master noun/verb relationships
- **[Search & Metadata Guide](../user-guides/SEARCH_AND_METADATA_GUIDE.md)** - Advanced search techniques
- **[Migration Guide](../../MIGRATION.md)** - Complete upgrade guide from 0.x

### Production Deployment
- **[Encryption Guide](../user-guides/encryption.md)** - Secure your data
- **[Container Deployment](../deployment/containers.md)** - Docker and Kubernetes
- **[Performance Optimization](../optimization-guides/large-scale-optimizations.md)** - Scale to millions

### Get Help
- **[GitHub Issues](https://github.com/soulcraftlabs/brainy/issues)** - Bug reports and feature requests
- **[GitHub Discussions](https://github.com/soulcraftlabs/brainy/discussions)** - Community support
- **[Examples](../examples/)** - Real-world usage patterns

## 💡 Pro Tips for 1.0

1. **Start with add()** - It's smart by default, handles everything automatically
2. **Use typed entities** - `addNoun()` with `NounType` creates structured data  
3. **Leverage relationships** - `addVerb()` with metadata creates rich connections
4. **Enable encryption** - Built-in security with zero complexity
5. **Embrace soft delete** - Better performance, no reindexing needed

**Ready to build something amazing with Brainy 1.0?** 🚀

---

*This guide covers Brainy 1.0's unified API. For legacy 0.x documentation, see [Legacy Quick Start](quick-start-legacy.md).*