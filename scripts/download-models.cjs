#!/usr/bin/env node
/**
 * Download and bundle models for offline usage
 */

const fs = require('fs').promises
const path = require('path')

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2'
const OUTPUT_DIR = './models'

async function downloadModels() {
  // Use dynamic import for ES modules in CommonJS
  const { pipeline, env } = await import('@huggingface/transformers')
  
  // Configure transformers.js to use local cache
  env.cacheDir = './models-cache'
  env.allowRemoteModels = true
  try {
    console.log('🔄 Downloading all-MiniLM-L6-v2 model for offline bundling...')
    console.log(`   Model: ${MODEL_NAME}`)
    console.log(`   Cache: ${env.cacheDir}`)
    
    // Create output directory
    await fs.mkdir(OUTPUT_DIR, { recursive: true })
    
    // Load the model to force download
    console.log('📥 Loading model pipeline...')
    const extractor = await pipeline('feature-extraction', MODEL_NAME)
    
    // Test the model to make sure it works
    console.log('🧪 Testing model...')
    const testResult = await extractor(['Hello world!'], {
      pooling: 'mean',
      normalize: true
    })
    
    console.log(`✅ Model test successful! Embedding dimensions: ${testResult.data.length}`)
    
    // Copy ALL model files from cache to our models directory
    console.log('📋 Copying ALL model files to bundle directory...')
    
    const cacheDir = path.resolve(env.cacheDir)
    const outputDir = path.resolve(OUTPUT_DIR)
    
    console.log(`   From: ${cacheDir}`)
    console.log(`   To: ${outputDir}`)
    
    // Copy the entire cache directory structure to ensure we get ALL files
    // including tokenizer.json, config.json, and all ONNX model files
    const modelCacheDir = path.join(cacheDir, 'Xenova', 'all-MiniLM-L6-v2')
    
    if (await dirExists(modelCacheDir)) {
      const targetModelDir = path.join(outputDir, 'Xenova', 'all-MiniLM-L6-v2')
      console.log(`   Copying complete model: Xenova/all-MiniLM-L6-v2`)
      await copyDirectory(modelCacheDir, targetModelDir)
    } else {
      throw new Error(`Model cache directory not found: ${modelCacheDir}`)
    }
    
    console.log('✅ Model bundling complete!')
    console.log(`   Total size: ${await calculateDirectorySize(outputDir)} MB`)
    console.log(`   Location: ${outputDir}`)
    
    // Create a marker file
    await fs.writeFile(
      path.join(outputDir, '.brainy-models-bundled'),
      JSON.stringify({
        model: MODEL_NAME,
        bundledAt: new Date().toISOString(),
        version: '1.0.0'
      }, null, 2)
    )
    
  } catch (error) {
    console.error('❌ Error downloading models:', error)
    process.exit(1)
  }
}

async function findModelDirectories(baseDir, modelName) {
  const dirs = []
  
  try {
    // Convert model name to expected directory structure
    const modelPath = modelName.replace('/', '--')
    
    async function searchDirectory(currentDir) {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true })
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const fullPath = path.join(currentDir, entry.name)
            
            // Check if this directory contains model files
            if (entry.name.includes(modelPath) || entry.name === 'onnx') {
              const hasModelFiles = await containsModelFiles(fullPath)
              if (hasModelFiles) {
                dirs.push(fullPath)
              }
            }
            
            // Recursively search subdirectories
            await searchDirectory(fullPath)
          }
        }
      } catch (error) {
        // Ignore access errors
      }
    }
    
    await searchDirectory(baseDir)
  } catch (error) {
    console.warn('Warning: Error searching for model directories:', error)
  }
  
  return dirs
}

async function containsModelFiles(dir) {
  try {
    const files = await fs.readdir(dir)
    return files.some(file => 
      file.endsWith('.onnx') || 
      file.endsWith('.json') ||
      file === 'config.json' ||
      file === 'tokenizer.json'
    )
  } catch (error) {
    return false
  }
}

async function dirExists(dir) {
  try {
    const stats = await fs.stat(dir)
    return stats.isDirectory()
  } catch (error) {
    return false
  }
}

async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}

async function calculateDirectorySize(dir) {
  let size = 0
  
  async function calculateSize(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name)
        
        if (entry.isDirectory()) {
          await calculateSize(fullPath)
        } else {
          const stats = await fs.stat(fullPath)
          size += stats.size
        }
      }
    } catch (error) {
      // Ignore access errors
    }
  }
  
  await calculateSize(dir)
  return Math.round(size / (1024 * 1024))
}

// Run the download
downloadModels().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})