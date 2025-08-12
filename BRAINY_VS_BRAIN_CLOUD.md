# 🧠 Brainy vs ☁️ Brain Cloud - Clear Separation

## Core Philosophy
**Brainy is FREE FOREVER. Brain Cloud is optional premium.**

## 🧠 Brainy (100% Free Open Source)

### What's Included (Everything You Need!)
✅ **Full Vector Database**
- HNSW indexing
- Semantic search  
- Metadata filtering
- Graph relationships
- Batch operations
- All distance metrics

✅ **Storage Options**
- FileSystem (Node.js)
- IndexedDB (Browser)
- S3 (with your AWS account)
- Memory
- Custom adapters

✅ **All Core Features**
- Embeddings (local models)
- Augmentation pipeline
- Statistics & monitoring
- Import/Export
- CLI tools
- Full API

### Code Example - Brainy Core
```javascript
// NO LICENSE NEEDED - JUST WORKS!
import { BrainyVectorDB } from '@brainy/vector-db'

const brain = new BrainyVectorDB()
await brain.add('Hello world', { category: 'greeting' })
const results = await brain.search('hi there')
// Full functionality, no limits, no license!
```

### What You CAN'T Do (Without Brain Cloud)
❌ Sync across devices
❌ Team collaboration
❌ Managed cloud hosting
❌ Enterprise connectors (Notion, Salesforce)
❌ Multi-agent coordination
❌ Automatic backups to cloud

---

## ☁️ Brain Cloud (Optional Premium Service)

### What It Is
A **managed service** that adds cloud capabilities to Brainy.
Think of it like GitHub vs Git - Brainy is Git (free tool), Brain Cloud is GitHub (paid service).

### Premium Features
🌟 **Cloud Sync**
- Your brain in the cloud
- Access from anywhere
- Automatic backups

🌟 **Team Features**
- Share knowledge bases
- Real-time collaboration
- Access controls

🌟 **Enterprise Connectors**
```javascript
// These require Brain Cloud subscription
import { NotionSync, SalesforceConnect } from '@soulcraft/brain-cloud'

const notion = new NotionSync({
  apiKey: 'your-brain-cloud-key'  // Premium only
})
```

🌟 **AI Memory**
- Persistent across sessions
- Multi-agent coordination
- Context sharing

### Code Example - Brain Cloud
```javascript
// Everything is in one package
import { BrainyVectorDB } from '@soulcraft/brainy'        // Free core
// Cloud features are in same package, activated by API key

const brain = new BrainyVectorDB()  // Works without cloud!

// Optional: Add cloud sync
const cloud = new CloudSync({
  apiKey: process.env.BRAIN_CLOUD_KEY  // Only if you want cloud
})
brain.enableCloud(cloud)  // Optional enhancement
```

---

## File Organization

### Core Brainy (This Repo)
```
brainy/
├── src/
│   ├── brainyData.ts        # Core (FREE)
│   ├── hnsw/                # Core (FREE)
│   ├── storage/             # Core (FREE)
│   ├── augmentations/       # Core (FREE)
│   └── cli/
│       ├── basic.ts         # Core commands (FREE)
│       └── cloud.ts         # Cloud commands (points to Brain Cloud)
```

### Brain Cloud (Service, not a package)
```
Brain Cloud is a managed service that auto-loads augmentations
based on your subscription when you run `brainy cloud auth`.
No manual package installation required!
```

---

## CLI Commands

### Free Commands (Core Brainy)
```bash
brainy init                  # Setup local database
brainy add <text>            # Add data
brainy search <query>        # Search
brainy export                # Export data
brainy import                # Import data
brainy stats                 # View statistics
```

### Premium Commands (Brain Cloud)
```bash
brainy cloud setup           # Setup cloud sync (requires key)
brainy cloud sync            # Sync with cloud
brainy cloud connect notion  # Connect Notion (premium)
```

---

## Configuration

### Brainy Core (No Config Needed!)
```javascript
// Just works - no environment variables, no config files
const brain = new BrainyVectorDB()
```

### Brain Cloud (Optional Config)
```javascript
// Only if using Brain Cloud features
const cloud = new CloudSync({
  apiKey: 'bc_xxxxx',  // Get from soulcraft.com
  region: 'us-east-1'
})
```

---

## Documentation Structure

### README.md Structure
```markdown
# Brainy - Free Vector Database

## Quick Start (Free, No Setup)
[Simple examples that just work]

## Core Features (All Free)
[Everything included in open source]

## Brain Cloud (Optional Premium)
[Clearly marked as optional add-on]
```

---

## Migration Rules

### ✅ DO
- Keep Brainy 100% functional without any keys
- Put Brain Cloud features in separate package
- Clearly mark premium features as optional
- Use "Brain Cloud" not "premium" or "paid"

### ❌ DON'T  
- Check for license in core Brainy
- Require environment variables for basic use
- Mix cloud features with core documentation
- Make it seem like license is needed

---

## User Journey

### New User (Free)
1. `npm install @brainy/vector-db`
2. Start coding immediately
3. Full functionality
4. Discovers Brain Cloud later (if needed)

### Enterprise User (Paid)
1. Uses Brainy locally first
2. Decides they need cloud sync
3. Signs up for Brain Cloud
4. `npm install @soulcraft/brain-cloud`
5. Adds cloud features to existing code

---

## Summary

**Brainy = SQLite** (Free database)
**Brain Cloud = Supabase** (Managed service)

Keep them separate. Brainy should work perfectly without Brain Cloud.
Brain Cloud should enhance, not gate, functionality.