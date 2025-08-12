# Model Loading Strategy

## Problem
- 86MB model file in repo
- GitHub complains
- Slow clones
- Not everyone needs models

## Recommended Solution: Three-Tier Approach

### Tier 1: Core Package (Lightweight)
```json
// package.json
{
  "name": "@brainy/vector-db",
  "files": ["dist", "!models"],  // Exclude models
  "optionalDependencies": {
    "@brainy/models": "^1.0.0"  // Optional
  }
}
```

### Tier 2: Model Package (Separate)
```json
// packages/models/package.json
{
  "name": "@brainy/models",
  "files": ["models/*.onnx"],
  "description": "Pre-trained models for Brainy (86MB)"
}
```

### Tier 3: Runtime Download (Fallback)
```javascript
class ModelLoader {
  async load(name: string) {
    // 1. Try local models (if @brainy/models installed)
    try {
      return require(`@brainy/models/${name}`)
    } catch {}
    
    // 2. Try cache
    const cached = await this.getCached(name)
    if (cached) return cached
    
    // 3. Download (with user permission)
    if (await this.shouldDownload()) {
      return await this.download(name)
    }
    
    // 4. Use basic embeddings (reduced quality)
    console.warn('Using basic embeddings (install @brainy/models for better quality)')
    return this.generateBasicEmbeddings()
  }
  
  async shouldDownload(): Promise<boolean> {
    // Auto-download in development
    if (process.env.NODE_ENV === 'development') return true
    
    // Ask in production
    if (process.stdout.isTTY) {
      return await prompt('Download 86MB model for better search? (y/n)')
    }
    
    // Don't download in CI/production without permission
    return false
  }
}
```

## Benefits
- **npm install @brainy/vector-db** = 2MB (fast!)
- **npm install @brainy/vector-db @brainy/models** = 88MB (full features)
- Works offline (if models installed)
- Works online (can download)
- Works without models (basic mode)

## Migration
```bash
# Before: Everything bundled
npm install @brainy/vector-db  # 88MB

# After: Choose what you need
npm install @brainy/vector-db  # 2MB core
npm install @brainy/vector-db @brainy/models  # 88MB with models
```