# Migration Guide: Brainy 0.x → 1.0

This guide will help you upgrade from Brainy 0.x to 1.0.0-rc.1. While there are breaking changes, most functionality has been simplified and improved.

## 🎯 **Quick Migration Checklist**

- [ ] Update package: `npm install @soulcraft/brainy@rc`
- [ ] Update CLI commands (see mapping below)
- [ ] Replace `addSmart()` with `add()`
- [ ] Update any pipeline imports
- [ ] Test functionality with new API
- [ ] Enable new features (encryption, soft delete)

## 📦 **Package Installation**

```bash
# Install the release candidate
npm install @soulcraft/brainy@rc

# Or with yarn
yarn add @soulcraft/brainy@rc
```

## 🔄 **API Method Changes**

### Core Data Operations

| **0.x Method** | **1.0 Method** | **Notes** |
|----------------|----------------|-----------|
| `addSmart(data, metadata)` | `add(data, metadata)` | Smart by default now |
| `add(data, metadata)` | `add(data, metadata, { process: 'literal' })` | Use literal option for old behavior |
| `searchSimilar(query, k)` | `search(query, k)` | Same functionality, cleaner name |
| `searchByMetadata(filter)` | `search('', k, { metadata: filter })` | Unified search interface |
| `searchConnected(id, k)` | `search('', k, { searchConnectedNouns: true })` | Part of unified search |

### NEW Methods in 1.0

```javascript
// New methods available
await brainy.import([data1, data2, data3])           // Bulk import
await brainy.addNoun(data, NounType.Person)          // Explicit typing
await brainy.update(id, newData, newMetadata)        // Smart updates
await brainy.delete(id)                               // Soft delete by default
await brainy.delete(id, { soft: false })            // Hard delete if needed
```

## 🖥️ **CLI Command Changes**

### Command Mapping

| **0.x Command** | **1.0 Command** | **Notes** |
|-----------------|-----------------|-----------|
| `brainy add-smart "data"` | `brainy add "data"` | Smart by default |
| `brainy add-literal "data"` | `brainy add "data" --literal` | Use literal flag |
| `brainy search-similar "query"` | `brainy search "query"` | Cleaner naming |
| `brainy search-metadata '{"type":"person"}'` | `brainy search "" --filter '{"type":"person"}'` | Unified search |
| `brainy list-stats` | `brainy status` | Enhanced status command |
| Multiple config commands | `brainy config <action>` | Unified config management |

### NEW CLI Commands

```bash
brainy init --encryption          # Initialize with encryption
brainy update <id> --data "new"   # Update existing data
brainy delete <id>                # Soft delete (default)
brainy delete <id> --hard         # Hard delete
brainy import data.json           # Bulk import
```

### Removed CLI Commands

These commands have been consolidated:
- `brainy add-smart` → `brainy add`
- `brainy add-literal` → `brainy add --literal`
- `brainy search-similar` → `brainy search`
- `brainy search-metadata` → `brainy search --filter`
- Various config commands → `brainy config`

## 🏗️ **Architecture Changes**

### Pipeline/Cortex Changes

```javascript
// OLD - Multiple pipeline classes
import { 
  SequentialPipeline, 
  ParallelPipeline, 
  StreamlinedPipeline 
} from '@soulcraft/brainy'

// NEW - One unified Cortex class
import { Pipeline, Cortex } from '@soulcraft/brainy'

// Both Pipeline and Cortex are the same class
const pipeline = new Pipeline()  // or new Cortex()
```

### Import Path Changes

Most imports remain the same, but some internal imports may have changed:

```javascript
// These should still work
import { BrainyData, NounType, VerbType } from '@soulcraft/brainy'

// Check these if you were using internal APIs
// (Most users won't need to change anything)
```

## 🔐 **New Encryption Features**

1.0 introduces comprehensive encryption support:

```javascript
// Initialize with encryption
const brainy = new BrainyData()
await brainy.init()

// Encrypt configuration
await brainy.setConfig('api-key', 'secret-key', { encrypt: true })

// Encrypt individual data items
await brainy.add("sensitive data", {}, { encrypt: true })

// CLI encryption
brainy init --encryption
brainy add "sensitive data" --encrypt
```

## 📊 **Soft Delete by Default**

The new `delete()` method uses soft delete by default:

```javascript
// Soft delete (preserves indexes, better performance)
await brainy.delete(id)  // Default behavior

// Hard delete (removes from indexes)
await brainy.delete(id, { soft: false })

// Cascade delete (deletes related verbs)
await brainy.delete(id, { cascade: true })
```

Search automatically excludes soft-deleted items.

## 🐳 **Container Deployment**

New container-optimized features:

```javascript
// Preload models for containers
await BrainyData.preloadModel({
  model: 'Xenova/all-MiniLM-L6-v2',
  cacheDir: './models'
})

// Container-optimized initialization
const brainy = await BrainyData.warmup({
  storage: { forceMemoryStorage: true }
}, {
  preloadModel: true
})
```

## 🧪 **Testing Your Migration**

### Basic Functionality Test

```javascript
import { BrainyData } from '@soulcraft/brainy'

async function testMigration() {
  const brainy = new BrainyData()
  await brainy.init()
  
  // Test core functionality
  const id = await brainy.add("Test migration data")
  const results = await brainy.search("migration", 5)
  await brainy.update(id, "Updated data")
  await brainy.delete(id) // Soft delete
  
  console.log("✅ Migration successful!")
}

testMigration()
```

### CLI Test

```bash
# Test CLI functionality
brainy add "Test data"
brainy search "test"
brainy status
brainy --help
```

## ⚠️ **Breaking Changes Summary**

### Definite Breaking Changes
1. **CLI commands renamed** - Most commands have new names
2. **`addSmart()` method removed** - Use `add()` instead
3. **Pipeline classes consolidated** - Multiple classes → one Cortex
4. **Some internal import paths** - Check if using internal APIs

### Likely Compatible
1. **Core API methods** - `add()`, `search()` largely the same
2. **Storage adapters** - All existing adapters work
3. **Configuration** - Existing configs should work
4. **Data format** - Your existing data is compatible

## 🆘 **Getting Help**

If you encounter issues during migration:

1. **Check the examples** in this guide
2. **Test with a small dataset** first
3. **File an issue** with the `migration` label
4. **Join discussions** for community help

### Common Migration Issues

**Issue**: `addSmart is not a function`
```javascript
// Fix: Use add() instead
await brainy.add(data, metadata)  // Smart by default
```

**Issue**: CLI command not found
```bash
# Fix: Check command mapping above
brainy search "query"  # Not search-similar
```

**Issue**: Pipeline import error
```javascript
// Fix: Use unified import
import { Pipeline } from '@soulcraft/brainy'
```

## 🎉 **New Features to Explore**

After migration, try these new features:

```javascript
// Bulk import
const ids = await brainy.import([data1, data2, data3])

// Explicit noun typing
await brainy.addNoun(personData, NounType.Person)

// Encrypted storage
await brainy.add(sensitiveData, {}, { encrypt: true })

// Smart updates
await brainy.update(id, newData, { cascade: true })
```

```bash
# New CLI features
brainy init --encryption --storage s3
brainy import large-dataset.json
brainy delete old-id --cascade
brainy chat "Tell me about my data"
```

## 📞 **Support**

- **📚 Documentation**: Updated for 1.0 API
- **🐛 Issues**: [GitHub Issues](https://github.com/soulcraftlabs/brainy/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/soulcraftlabs/brainy/discussions)
- **🏷️ Tags**: Use `migration`, `1.0-rc.1`, `breaking-change` tags

**We're here to help make your migration smooth!** 🚀