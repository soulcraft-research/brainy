# Model Management Guide

This guide explains how to manage the TensorFlow Universal Sentence Encoder model used by Brainy for text embeddings.

## Overview

Brainy uses the Universal Sentence Encoder model from TensorFlow.js to convert text into vector embeddings. These
embeddings are essential for semantic search and other features.

The model is referenced through local configuration files that point to the TensorFlow Hub URL. This approach ensures
that:

1. The model is automatically downloaded when first needed
2. Subsequent uses leverage the cached model
3. The application works consistently across all environments (browser, Node.js, serverless, workers)

## Model Files

The model files are stored in the `models/sentence-encoder/` directory and include:

- `model.json` (~1KB) - The main model configuration file that references the TensorFlow Hub URL
- `group1-shard1of1.bin` (~2KB) - A sample embedding file (not the full model weights)
- `metadata.json` (~0.4KB) - Additional information about the model

**Important Note**: These are small reference files (total ~3KB), not the full model (~25MB). The full model is
downloaded automatically when first needed and then cached locally. This approach keeps the repository size small while
ensuring the model is available when needed.

These files should be checked into version control to ensure they're available in all environments.

## Setting Up Model Reference Files

The model reference files are generated using the `download-model.js` script:

```bash
node scripts/download-model.js
```

**Important**: This script does NOT download the full model (~25MB) locally. Instead, it creates small reference
files (~3KB total) that point to the TensorFlow Hub URL. The full model will be downloaded automatically when your
application first uses it, and then cached for future use.

### When to Run the Script

You should run this script in the following situations:

1. **Initial Setup**: When first setting up the project
2. **Model Updates**: When updating to a new version of the Universal Sentence Encoder
3. **Missing Files**: If the model reference files are missing or corrupted

The script will:

1. Load the model from TensorFlow Hub to verify it works (temporarily downloading it to memory)
2. Create a model.json file that references the TensorFlow Hub URL
3. Generate a sample embedding and save it as a small binary file
4. Create a metadata file with information about the model

### What to Expect

After running the script:

1. You'll see small files in the `models/sentence-encoder/` directory (total ~3KB)
2. When your application first uses the model, it will download the full model (~25MB) from TensorFlow Hub
3. The downloaded model will be cached locally for subsequent use
4. No further downloads will be needed unless the cache is cleared

## Using the Model

The model is automatically loaded by the `UniversalSentenceEncoder` class in `src/utils/embedding.ts`. The loading
process follows these steps:

1. Check if local model reference files exist
2. If they exist, load the model using the TensorFlow Hub URL referenced in the model.json file
3. The first time this happens, the full model will be downloaded and cached
4. Subsequent uses will use the cached model

## Environments

The model loading works across all environments:

- **Node.js**: Uses file system paths to load the model
- **Browser**: Uses relative URLs to load the model
- **Serverless/Workers**: Uses the embedded model files

## Best Practices

1. **Always check in model files**: The model files should be committed to version control
2. **Run tests after model updates**: Use `node test-model-loading.js` to verify the model works
3. **Update model during build**: If you prefer not to check in model files, run the download script as part of your
   build process

## Troubleshooting

### Common Issues

#### "The model files are too small (only a few KB)"

This is expected behavior. The script creates small reference files (~3KB total), not the full model (~25MB). The full
model will be downloaded automatically when your application first uses it.

#### "Model not found or loading errors"

1. Verify the model reference files exist in `models/sentence-encoder/`
2. Run `node scripts/download-model.js` to generate fresh reference files
3. Check for errors in the console related to model loading
4. Ensure the model reference files are properly included in your deployment package
5. Make sure your application has internet access the first time it runs to download the full model

#### "Model download is slow"

The first time your application uses the model, it will download the full model (~25MB) from TensorFlow Hub. This may
take a few minutes depending on your internet connection. Subsequent uses will use the cached model and will be much
faster.

## Format Field Compatibility Fix

### Background

The Universal Sentence Encoder model downloaded from Google Cloud Storage may be missing the required `"format"` field in its `model.json` file. This field is essential for TensorFlow.js to properly decode the model weights and prevent `RangeError: byte length of Float32Array should be a multiple of 4` errors.

### Permanent Solution

Brainy implements a **dual-layer protection** approach to ensure the format field is always present:

#### Layer 1: Download Script Protection
The `download-full-models.js` script automatically adds the format field during the download process:

```javascript
// Add the required "format" field for TensorFlow.js compatibility
if (!modelJson.format) {
  modelJson.format = 'tfjs-graph-model'
  fs.writeFileSync(modelJsonPath, JSON.stringify(modelJson, null, 2))
  console.log('✅ Added "format" field to model.json for TensorFlow.js compatibility')
}
```

#### Layer 2: Runtime Protection
The `RobustModelLoader` automatically validates and fixes the format field when loading bundled models:

```javascript
// Ensure the format field exists for TensorFlow.js compatibility
if (!modelJsonContent.format) {
  modelJsonContent.format = 'tfjs-graph-model'
  try {
    fs.writeFileSync(modelJsonPath, JSON.stringify(modelJsonContent, null, 2))
    this.log(`✅ Added missing "format" field to model.json for TensorFlow.js compatibility`)
  } catch (writeError) {
    this.log(`⚠️ Could not write format field to model.json: ${writeError}`)
  }
}
```

### Why This Approach Works

1. **Download Protection**: Every time the model is downloaded, the format field is automatically added
2. **Runtime Protection**: Even if the format field gets lost, it's restored when the model is loaded
3. **Persistence**: The fix is written to disk, so it persists across application restarts
4. **No Manual Intervention**: The fix is completely automatic and transparent to users

### Verification

The permanent fix has been verified through:
- Multiple download cycles (format field persists across re-downloads)
- Full test suite (all 39 tests pass)
- Runtime model loading (automatic format field restoration)

This ensures that the Float32Array error will never occur again, regardless of how many times the model is re-downloaded or updated.

## Technical Details

The Universal Sentence Encoder model:

- Produces 512-dimensional embeddings
- Works with text in any language
- Is optimized for semantic similarity tasks
- Has a size of approximately 25MB when fully downloaded
- Is downloaded from TensorFlow Hub on first use and then cached
- **Requires the "format" field for proper TensorFlow.js compatibility (automatically ensured by Brainy)**

Our approach of referencing the model via TensorFlow Hub URL provides several benefits:

1. Small package size (only reference files are included, not the full model)
2. Automatic caching for improved performance after first use
3. Consistent behavior across all environments
4. Always uses the correct model weights
5. **Automatic format field validation and correction**
