# Optional Model Bundling Package

## Overview

The `@soulcraft/brainy-models` package provides pre-bundled TensorFlow models for maximum reliability with the Brainy
vector database. This optional package eliminates network dependencies and ensures consistent performance by including
the complete Universal Sentence Encoder model (~25MB) locally.

## When to Use

### Use the Optional Model Bundling Package When:

- ✅ **Maximum Reliability Required**: Production applications that cannot tolerate network failures
- ✅ **Offline Environments**: Air-gapped systems or environments without internet access
- ✅ **Strict SLA Requirements**: Applications with stringent uptime and performance requirements
- ✅ **Edge Computing**: IoT devices and edge deployments with limited connectivity
- ✅ **Development Stability**: Development environments with unreliable internet connections

### Use Standard Online Loading When:

- ✅ **Package Size Matters**: Applications where the additional ~25MB is significant
- ✅ **Prototyping**: Quick development and testing scenarios
- ✅ **Reliable Internet**: Environments with consistent, fast internet connectivity
- ✅ **Infrequent Usage**: Applications that rarely generate embeddings

## Installation

```bash
# Install the optional model bundling package
npm install @soulcraft/brainy-models
```

## Quick Start

### Basic Usage with Brainy

```typescript
import Brainy from '@soulcraft/brainy'
import { BundledUniversalSentenceEncoder } from '@soulcraft/brainy-models'

// Create and load the bundled encoder
const bundledEncoder = new BundledUniversalSentenceEncoder({
  verbose: true,
  preferCompressed: false
})

await bundledEncoder.load()

// Use with Brainy
const brainy = new Brainy({
  // Configure Brainy to use the bundled encoder
  customEmbedding: async (texts) => {
    return await bundledEncoder.embedToArrays(texts)
  }
})

// Now use Brainy as normal - it will use the bundled model
await brainy.addDocument('doc1', 'This is a sample document')
const results = await brainy.search('sample text', { limit: 5 })

console.log('Search results:', results)

// Clean up
bundledEncoder.dispose()
```

### Advanced Configuration

```typescript
import { BundledUniversalSentenceEncoder } from '@soulcraft/brainy-models'

// High-reliability configuration
const encoder = new BundledUniversalSentenceEncoder({
  verbose: true,
  preferCompressed: false  // Use full model for maximum accuracy
})

// Memory-optimized configuration
const memoryOptimizedEncoder = new BundledUniversalSentenceEncoder({
  verbose: true,
  preferCompressed: true  // Use compressed model to save memory
})
```

## Comparison: Online vs Bundled Models

| Feature              | Online Loading     | Bundled Models |
|----------------------|--------------------|----------------|
| **Reliability**      | Network dependent  | 100% offline   |
| **First load time**  | 30-60 seconds      | < 1 second     |
| **Subsequent loads** | Cached (~1 second) | < 1 second     |
| **Package size**     | ~3KB               | ~25MB          |
| **Network required** | Yes (first time)   | No             |
| **Offline support**  | Limited            | Complete       |
| **Memory usage**     | Standard           | Configurable   |
| **Startup time**     | Variable           | Consistent     |

## Model Variants

The bundled package includes multiple optimized variants:

### Original (Float32)

- **Size**: ~25MB
- **Accuracy**: Maximum
- **Memory**: High
- **Speed**: Fast
- **Use case**: Production applications requiring highest accuracy

### Float16 Compressed

- **Size**: ~12-15MB
- **Accuracy**: Very High (minimal loss)
- **Memory**: Medium
- **Speed**: Fast
- **Use case**: Balanced performance and size

### Int8 Quantized

- **Size**: ~6-8MB
- **Accuracy**: High (some loss acceptable)
- **Memory**: Low
- **Speed**: Medium
- **Use case**: Memory-constrained environments

## Integration Patterns

### Pattern 1: Direct Replacement

Replace the standard embedding approach with bundled models:

```typescript
// Before (online loading)
import Brainy from '@soulcraft/brainy'
const brainyOnline = new Brainy()

// After (bundled models)
import Brainy from '@soulcraft/brainy'
import { BundledUniversalSentenceEncoder } from '@soulcraft/brainy-models'

const bundledEncoder = new BundledUniversalSentenceEncoder()
await bundledEncoder.load()

const brainyBundled = new Brainy({
  customEmbedding: async (texts) => await bundledEncoder.embedToArrays(texts)
})
```

### Pattern 2: Fallback Strategy

Use bundled models as a fallback when online loading fails:

```typescript
import Brainy from '@soulcraft/brainy'
import { BundledUniversalSentenceEncoder } from '@soulcraft/brainy-models'

async function createReliableBrainy() {
  try {
    // Try online loading first
    const brainy = new Brainy()
    await brainy.initialize() // This might fail due to network issues
    return brainy
  } catch (error) {
    console.log('Online loading failed, using bundled models:', error.message)
    
    // Fallback to bundled models
    const encoder = new BundledUniversalSentenceEncoder({ verbose: true })
    await encoder.load()
    
    return new Brainy({
      customEmbedding: async (texts) => await encoder.embedToArrays(texts)
    })
  }
}

const brainy = await createReliableBrainy()
```

### Pattern 3: Environment-Based Selection

Choose the approach based on the environment:

```typescript
import Brainy from '@soulcraft/brainy'
import { BundledUniversalSentenceEncoder } from '@soulcraft/brainy-models'

async function createEnvironmentOptimizedBrainy() {
  const isProduction = process.env.NODE_ENV === 'production'
  const isOffline = !navigator.onLine // Browser only
  const requiresReliability = process.env.REQUIRE_MAX_RELIABILITY === 'true'
  
  if (isProduction || isOffline || requiresReliability) {
    // Use bundled models for maximum reliability
    const encoder = new BundledUniversalSentenceEncoder({
      verbose: !isProduction,
      preferCompressed: process.env.MEMORY_CONSTRAINED === 'true'
    })
    await encoder.load()
    
    return new Brainy({
      customEmbedding: async (texts) => await encoder.embedToArrays(texts)
    })
  } else {
    // Use online loading for development
    return new Brainy()
  }
}
```

## Performance Optimization

### Memory Management

```typescript
import { BundledUniversalSentenceEncoder } from '@soulcraft/brainy-models'

// For memory-constrained environments
const encoder = new BundledUniversalSentenceEncoder({
  preferCompressed: true  // Uses int8 quantized model
})

// Always dispose when done
encoder.dispose()
```

### Batch Processing

```typescript
// Process texts in batches for optimal performance
async function processLargeDataset(texts: string[]) {
  const encoder = new BundledUniversalSentenceEncoder()
  await encoder.load()
  
  const batchSize = 32
  const results = []
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const embeddings = await encoder.embedToArrays(batch)
    results.push(...embeddings)
  }
  
  encoder.dispose()
  return results
}
```

## Troubleshooting

### Common Issues

#### Package Size Concerns

**Issue**: The bundled package is large (~25MB)
**Solutions**:

- Use compressed models: `preferCompressed: true`
- Consider if your use case truly requires maximum reliability
- Use online loading for development, bundled for production

#### Memory Usage

**Issue**: High memory usage with bundled models
**Solutions**:

- Use int8 quantized models
- Dispose of encoder instances when not needed
- Process data in smaller batches

#### Model Loading Errors

**Issue**: "Bundled model not found" error
**Solutions**:

```bash
# Navigate to the package directory and download models
cd node_modules/@soulcraft/brainy-models
npm run download-models
```

### Performance Tuning

For optimal performance:

1. **Choose the right variant**:
    - Production: Original float32 model
    - Balanced: Float16 compressed model
    - Memory-limited: Int8 quantized model

2. **Manage memory properly**:
    - Always call `dispose()` when done
    - Use appropriate batch sizes
    - Monitor memory usage in production

3. **Optimize for your use case**:
    - High-throughput: Use original model with larger batches
    - Low-memory: Use int8 model with smaller batches
    - Balanced: Use float16 model with medium batches

## Migration Guide

### From Online Loading to Bundled Models

1. **Install the package**:
   ```bash
   npm install @soulcraft/brainy-models
   ```

2. **Update your code**:
   ```typescript
   // Before
   import Brainy from '@soulcraft/brainy'
   const originalBrainy = new Brainy()
   
   // After
   import Brainy from '@soulcraft/brainy'
   import { BundledUniversalSentenceEncoder } from '@soulcraft/brainy-models'
   
   const modelEncoder = new BundledUniversalSentenceEncoder()
   await modelEncoder.load()
   
   const reliableBrainy = new Brainy({
     customEmbedding: async (texts) => await modelEncoder.embedToArrays(texts)
   })
   ```

3. **Test thoroughly**:
    - Verify embeddings are generated correctly
    - Check memory usage
    - Test offline functionality

4. **Deploy with confidence**:
    - No network dependencies
    - Consistent performance
    - Maximum reliability

## Best Practices

1. **Choose the Right Approach**:
    - Use bundled models for production and critical applications
    - Use online loading for development and prototyping

2. **Memory Management**:
    - Always dispose of encoder instances
    - Use compressed models when appropriate
    - Monitor memory usage in production

3. **Error Handling**:
    - Implement proper error handling for model loading
    - Consider fallback strategies
    - Log errors appropriately

4. **Performance**:
    - Use appropriate batch sizes
    - Choose the right model variant for your use case
    - Profile your application to optimize performance

## Support

For issues with the optional model bundling package:

- [GitHub Issues](https://github.com/soulcraftlabs/brainy/issues)
- [Main Documentation](https://github.com/soulcraftlabs/brainy)
- [Model Management Guide](./model-management.md)
