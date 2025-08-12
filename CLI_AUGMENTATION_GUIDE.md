# 🧠 Brainy CLI - Augmentation Management Guide

## Complete CLI Commands for Augmentations

### Core Commands

```bash
# Initialize Brainy
brainy init

# Basic operations
brainy add "data"           # Add data
brainy search "query"       # Search
brainy chat                 # Interactive chat
```

### Augmentation Management

```bash
# List all augmentations
brainy augment              # Shows installed & available
brainy augment list         # Same as above
brainy augment available    # Shows what can be installed

# Add augmentations
brainy augment add          # Interactive mode
brainy augment add neural-import    # Built-in
brainy augment add brainy-sentiment  # Community (from npm)
brainy augment add ai-memory  # Brain Cloud feature (optional)

# Remove augmentations
brainy augment remove sentiment-analyzer
brainy augment disable neural-import  # Disable but keep installed

# Configure augmentations
brainy augment config neural-import
brainy augment config notion-sync --set apiKey=xxx
```

### Installing Different Types

#### 1. Built-in Augmentations (Free, Always Available)
```bash
# These are included - just enable them
brainy augment enable neural-import
brainy augment enable auto-save
brainy augment enable basic-cache
```

#### 2. Community Augmentations (Free, From npm)
```bash
# Step 1: Install from npm
npm install -g brainy-sentiment

# Step 2: Register with Brainy
brainy augment add brainy-sentiment

# Or in one command (coming soon)
brainy augment install brainy-sentiment  # Auto-installs from npm
```

#### 3. Premium Augmentations (Paid, From @soulcraft/brain-cloud)
```bash
# Step 1: Set license key
export BRAINY_LICENSE_KEY=lic_xxxxxxxxxxxxx

# Step 2: Install premium package
npm install -g @soulcraft/brain-cloud

# Step 3: Add specific augmentations
brainy augment add ai-memory --premium
brainy augment add agent-coordinator --premium
brainy augment add notion-sync --premium

# Or add all premium at once
brainy augment add-premium --all
```

#### 4. Brain Cloud Service (Managed, Everything Included)
```bash
# Connect to Brain Cloud (includes all augmentations)
brainy cloud --connect YOUR_CUSTOMER_ID

# Check status
brainy cloud --status

# Force sync
brainy cloud --sync

# Open dashboard
brainy cloud --dashboard
```

### Working with Different Instances

#### Local Instance
```bash
# Add augmentation to local Brainy
cd my-project
brainy init
brainy augment add neural-import
```

#### Remote Hosted Instance
```bash
# Connect to remote Brainy server
brainy config set server.url https://my-brainy-server.com
brainy config set server.apiKey xxx

# Add augmentation to remote
brainy augment add sentiment-analyzer --remote
```

#### Brain Cloud Instance
```bash
# Everything is managed
brainy cloud --connect CUSTOMER_ID
# All augmentations automatically available
```

### Interactive Mode Examples

#### Adding an Augmentation (No Arguments)
```bash
$ brainy augment add
? What type of augmentation? › 
  Built-in (Free)
  Community (npm)
  Premium (Licensed)
  
? Select augmentation › 
  ✓ neural-import (AI understanding)
  ○ sentiment-analyzer (Emotion detection)
  ○ translator (Multi-language)
  
? Configure now? (Y/n) › 
```

#### Configuring an Augmentation
```bash
$ brainy augment config notion-sync
? Notion API Token › secret_xxxxx
? Sync Mode › 
  ○ Read only
  ● Bidirectional
  ○ Write only
  
? Sync Interval (minutes) › 5
✅ Configuration saved!
```

### CLI Implementation in brainy.js

```javascript
// brainy augment command structure
program
  .command('augment [action] [name]')
  .description('Manage brain augmentations')
  .option('--type <type>', 'Augmentation type (sense|conduit|memory|etc)')
  .option('--premium', 'Premium augmentation')
  .option('--remote', 'Install on remote server')
  .action(async (action, name, options) => {
    if (!action) {
      // List all augmentations
      await listAugmentations()
    } else {
      switch(action) {
        case 'add':
        case 'install':
          await installAugmentation(name, options)
          break
        case 'remove':
          await removeAugmentation(name)
          break
        case 'config':
          await configureAugmentation(name, options)
          break
        case 'list':
          await listAugmentations()
          break
        case 'enable':
          await enableAugmentation(name)
          break
        case 'disable':
          await disableAugmentation(name)
          break
      }
    }
  })
```

### Environment Variables

```bash
# For premium augmentations
export BRAINY_LICENSE_KEY=lic_xxxxxxxxxxxxx

# For Brain Cloud
export BRAIN_CLOUD_KEY=bc_xxxxxxxxxxxxx
export BRAIN_CLOUD_CUSTOMER_ID=cust_xxxxx

# For remote server
export BRAINY_SERVER_URL=https://my-server.com
export BRAINY_SERVER_KEY=xxx
```

### Package.json Scripts

Add these to your project's package.json:

```json
{
  "scripts": {
    "brain:init": "brainy init",
    "brain:augment": "brainy augment",
    "brain:add-sentiment": "brainy augment add brainy-sentiment",
    "brain:add-premium": "brainy augment add ai-memory --premium",
    "brain:cloud": "brainy cloud --connect"
  }
}
```

### Error Messages & Solutions

```bash
# Missing license key
❌ Premium augmentation requires license key
💡 Set BRAINY_LICENSE_KEY or visit soulcraft.com

# Augmentation not found
❌ Augmentation 'xyz' not found
💡 Try: npm install brainy-xyz first

# Remote connection failed
❌ Cannot connect to remote server
💡 Check BRAINY_SERVER_URL and network connection

# Incompatible version
❌ Augmentation requires Brainy v0.62+
💡 Update: npm update @soulcraft/brainy
```

## Summary

The CLI provides a unified interface for managing all augmentation types:
- **Built-in**: Always available, just enable
- **Community**: Install from npm, then add
- **Premium**: Need license, install from @soulcraft/brain-cloud
- **Brain Cloud**: Everything managed, just connect

The key is making it simple for beginners (interactive mode) while powerful for experts (direct commands).