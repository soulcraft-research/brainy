<div align="center">
<img src="../brainy.png" alt="Brainy Logo" width="200"/>
<br/><br/>

[![License](https://img.shields.io/badge/license-MIT-green.svg)](../LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](../CONTRIBUTING.md)

**Pre-bundled TensorFlow models for maximum reliability with Brainy vector database**

</div>

## ✨ Overview

This package provides offline access to the Universal Sentence Encoder model, eliminating network dependencies and ensuring consistent performance. It's designed as an optional companion to the main `@soulcraft/brainy` package for applications requiring maximum reliability.

### 🚀 Key Features

- 🔒 **Maximum Reliability**: Fully offline model loading with zero network dependencies
- 📦 **Pre-bundled Models**: Complete Universal Sentence Encoder model (~25MB) included
- 🗜️ **Model Compression**: Multiple optimized variants (float16, int8) for different use cases
- ⚡ **Performance Optimized**: Use case-specific optimizations for memory and speed
- 🛠️ **Easy Integration**: Drop-in replacement for online model loading
- 📊 **Comprehensive Metrics**: Detailed model information and performance statistics

## 🔧 Installation

```bash
npm install @soulcraft/brainy-models
```

### Prerequisites

- Node.js >= 18.0.0
- `@soulcraft/brainy` >= 0.33.0

## 🏁 Quick Start

### Basic Usage

```typescript
import { BundledUniversalSentenceEncoder } from '@soulcraft/brainy-models'

// Create encoder instance
const encoder = new BundledUniversalSentenceEncoder({
  verbose: true,
  preferCompressed: false
})

// Load the bundled model
await encoder.load()

// Generate embeddings
const texts = ['Hello world', 'How are you?', 'Machine learning is amazing']
const embeddings = await encoder.embedToArrays(texts)

console.log(`Generated ${embeddings.length} embeddings of ${embeddings[0].length} dimensions`)

// Clean up
encoder.dispose()
```

### Integration with Brainy

```typescript
import Brainy from '@soulcraft/brainy'
import { BundledUniversalSentenceEncoder } from '@soulcraft/brainy-models'

// Create bundled encoder
const bundledEncoder = new BundledUniversalSentenceEncoder({ verbose: true })
await bundledEncoder.load()

// Use with Brainy (custom integration)
const brainy = new Brainy({
  // Configure Brainy to use the bundled encoder
  customEmbedding: async (texts) => {
    return await bundledEncoder.embedToArrays(texts)
  }
})
```

### Using Compressed Models

```typescript
import { BundledUniversalSentenceEncoder } from '@soulcraft/brainy-models'

// Use compressed model for memory-constrained environments
const encoder = new BundledUniversalSentenceEncoder({
  preferCompressed: true,
  verbose: true
})

await encoder.load()

// The encoder will automatically use the most appropriate compressed variant
const embeddings = await encoder.embedToArrays(['Sample text'])
```

## 📚 API Reference

### BundledUniversalSentenceEncoder

Main class for loading and using bundled models.

#### Constructor

```typescript
new BundledUniversalSentenceEncoder(options)
```

**Options:**
- `verbose?: boolean` - Enable detailed logging (default: false)
- `preferCompressed?: boolean` - Prefer compressed model variants (default: false)

#### Methods

##### `load(): Promise<void>`

Load the bundled model from local files.

```typescript
await encoder.load()
```

##### `embed(texts: string[]): Promise<tf.Tensor2D>`

Generate embeddings as TensorFlow tensors.

```typescript
const embeddings = await encoder.embed(['Hello world'])
// Remember to dispose of tensors when done
embeddings.dispose()
```

##### `embedToArrays(texts: string[]): Promise<number[][]>`

Generate embeddings as JavaScript arrays (automatically disposes tensors).

```typescript
const embeddings = await encoder.embedToArrays(['Hello world'])
console.log(embeddings[0].length) // 512
```

##### `getMetadata(): ModelMetadata | null`

Get model metadata information.

```typescript
const metadata = encoder.getMetadata()
console.log(metadata?.dimensions) // 512
```

##### `isLoaded(): boolean`

Check if the model is loaded.

```typescript
if (encoder.isLoaded()) {
  // Model is ready to use
}
```

##### `getModelInfo(): { inputShape: number[], outputShape: number[] } | null`

Get model input/output shape information.

```typescript
const info = encoder.getModelInfo()
console.log(info?.outputShape) // [-1, 512]
```

##### `dispose(): void`

Clean up model resources.

```typescript
encoder.dispose()
```

### ModelCompressor

Utility class for model compression and optimization.

#### Static Methods

##### `quantizeModel(modelPath: string, outputPath: string, options?): Promise<void>`

Compress a model using quantization.

```typescript
import { ModelCompressor } from '@soulcraft/brainy-models'

await ModelCompressor.quantizeModel(
  '/path/to/model.json',
  '/path/to/compressed/model.json',
  { dtype: 'int8' }
)
```

##### `getModelSize(modelPath: string): Promise<ModelSizeInfo>`

Get detailed model size information.

```typescript
const sizeInfo = await ModelCompressor.getModelSize('/path/to/model.json')
console.log(`Total size: ${sizeInfo.totalSize} bytes`)
```

### Utility Functions

#### `utils.checkModelsAvailable(): boolean`

Check if bundled models are available.

```typescript
import { utils } from '@soulcraft/brainy-models'

if (utils.checkModelsAvailable()) {
  console.log('Models are ready to use')
}
```

#### `utils.listAvailableModels(): string[]`

List available bundled models.

```typescript
const models = utils.listAvailableModels()
console.log('Available models:', models)
```

## 🎯 Model Variants

The package includes multiple model variants optimized for different use cases:

### Original (Float32)
- **Size**: ~25MB
- **Use case**: Maximum accuracy
- **Memory**: High
- **Speed**: Fast

### Float16 Compressed
- **Size**: ~12-15MB
- **Use case**: Balanced performance
- **Memory**: Medium
- **Speed**: Fast

### Int8 Quantized
- **Size**: ~6-8MB
- **Use case**: Memory-constrained environments
- **Memory**: Low
- **Speed**: Medium

## ⚙️ Scripts

The package includes several utility scripts:

### Download Models

Download the complete Universal Sentence Encoder model:

```bash
npm run download-models
```

### Compress Models

Create optimized model variants:

```bash
npm run compress-models
```

### Test Models

Verify model functionality:

```bash
npm test
```

## 🔨 Development

### Building the Package

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Creating a Release

```bash
npm run pack
```

## ⚖️ Comparison with Online Loading

| Feature | Online Loading | Bundled Models |
|---------|----------------|----------------|
| **Reliability** | Network dependent | 100% offline |
| **First load time** | 30-60 seconds | < 1 second |
| **Subsequent loads** | Cached (~1 second) | < 1 second |
| **Package size** | ~3KB | ~25MB |
| **Network required** | Yes (first time) | No |
| **Offline support** | Limited | Complete |

## 💡 Use Cases

### When to Use Bundled Models

- ✅ Production applications requiring maximum reliability
- ✅ Offline or air-gapped environments
- ✅ Applications with strict SLA requirements
- ✅ Edge computing and IoT devices
- ✅ Development environments with unreliable internet

### When to Use Online Loading

- ✅ Development and prototyping
- ✅ Applications where package size matters
- ✅ Environments with reliable internet connectivity
- ✅ Applications that rarely use embeddings

## 🔧 Troubleshooting

### Model Not Found Error

```
Error: Bundled model not found. Please run "npm run download-models"
```

**Solution**: Run the download script to fetch the model files:
```bash
cd node_modules/@soulcraft/brainy-models
npm run download-models
```

### Memory Issues

If you encounter memory issues, try using compressed models:

```typescript
const encoder = new BundledUniversalSentenceEncoder({
  preferCompressed: true
})
```

### Performance Optimization

For optimal performance:

1. **Memory-constrained**: Use int8 quantized models
2. **Speed-critical**: Use original float32 models
3. **Balanced**: Use float16 compressed models

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please see the main [Brainy repository](https://github.com/soulcraft-research/brainy) for contribution guidelines.

## 💬 Support

For issues and questions:
- [GitHub Issues](https://github.com/soulcraft-research/brainy/issues)
- [Documentation](https://github.com/soulcraft-research/brainy)
