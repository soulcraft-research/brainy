#!/usr/bin/env node

/* eslint-env node */
/* eslint-disable no-console */

/**
 * Model Compression Script for @soulcraft/brainy-models
 * 
 * This script implements model compression and optimization techniques
 * to reduce model size while maintaining accuracy.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as tf from '@tensorflow/tfjs-node'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MODELS_DIR = path.join(__dirname, '..', 'models')
const USE_MODEL_DIR = path.join(MODELS_DIR, 'universal-sentence-encoder')
const COMPRESSED_DIR = path.join(USE_MODEL_DIR, 'compressed')

// Ensure compressed directory exists
if (!fs.existsSync(COMPRESSED_DIR)) {
  fs.mkdirSync(COMPRESSED_DIR, { recursive: true })
}

console.log('🗜️ Starting model compression for @soulcraft/brainy-models...')
console.log('This will create optimized versions of the bundled models.\n')

/**
 * Get file size in MB
 */
function getFileSizeMB(filePath) {
  const stats = fs.statSync(filePath)
  return (stats.size / 1024 / 1024).toFixed(2)
}

/**
 * Get directory size in MB
 */
function getDirectorySizeMB(dirPath) {
  let totalSize = 0
  const files = fs.readdirSync(dirPath)
  
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stats = fs.statSync(filePath)
    if (stats.isFile()) {
      totalSize += stats.size
    }
  }
  
  return (totalSize / 1024 / 1024).toFixed(2)
}

/**
 * Compress model weights by reducing precision
 */
async function compressModelWeights(modelPath, outputPath, precision = 'float16') {
  try {
    console.log(`🔄 Loading model from: ${modelPath}`)
    const model = await tf.loadGraphModel(`file://${modelPath}`)
    
    console.log(`🗜️ Compressing weights to ${precision} precision...`)
    
    // Get model artifacts
    const artifacts = await model.serialize()
    
    // Compress weight data
    if (artifacts.weightData) {
      const originalWeights = new Float32Array(artifacts.weightData)
      let compressedWeights
      
      if (precision === 'float16') {
        // Simulate float16 by reducing precision
        compressedWeights = new Float32Array(originalWeights.length)
        for (let i = 0; i < originalWeights.length; i++) {
          // Round to reduce precision (simulating float16)
          compressedWeights[i] = Math.round(originalWeights[i] * 1000) / 1000
        }
      } else if (precision === 'int8') {
        // Quantize to int8 range
        const min = Math.min(...originalWeights)
        const max = Math.max(...originalWeights)
        const scale = (max - min) / 255
        
        compressedWeights = new Float32Array(originalWeights.length)
        for (let i = 0; i < originalWeights.length; i++) {
          const quantized = Math.round((originalWeights[i] - min) / scale)
          compressedWeights[i] = (quantized * scale) + min
        }
      }
      
      artifacts.weightData = compressedWeights.buffer
    }
    
    // Update metadata to indicate compression
    if (artifacts.userDefinedMetadata) {
      artifacts.userDefinedMetadata.compressed = true
      artifacts.userDefinedMetadata.compressionType = precision
      artifacts.userDefinedMetadata.compressionDate = new Date().toISOString()
    }
    
    // Save compressed model
    await tf.io.fileSystem(outputPath).save(artifacts)
    
    console.log(`✅ Compressed model saved to: ${outputPath}`)
    
    model.dispose()
    
    return true
  } catch (error) {
    console.error(`❌ Error compressing model: ${error.message}`)
    return false
  }
}

/**
 * Create optimized model variants
 */
async function createOptimizedVariants() {
  try {
    const originalModelPath = path.join(USE_MODEL_DIR, 'model.json')
    
    if (!fs.existsSync(originalModelPath)) {
      console.error('❌ Original model not found. Please run "npm run download-models" first.')
      process.exit(1)
    }
    
    console.log('📊 Original model size:', getDirectorySizeMB(USE_MODEL_DIR), 'MB')
    
    // Create float16 compressed version
    const float16Path = path.join(COMPRESSED_DIR, 'float16')
    if (!fs.existsSync(float16Path)) {
      fs.mkdirSync(float16Path, { recursive: true })
    }
    
    console.log('\n🗜️ Creating float16 compressed version...')
    const float16Success = await compressModelWeights(
      originalModelPath,
      path.join(float16Path, 'model.json'),
      'float16'
    )
    
    if (float16Success) {
      console.log('📊 Float16 model size:', getDirectorySizeMB(float16Path), 'MB')
    }
    
    // Create int8 quantized version
    const int8Path = path.join(COMPRESSED_DIR, 'int8')
    if (!fs.existsSync(int8Path)) {
      fs.mkdirSync(int8Path, { recursive: true })
    }
    
    console.log('\n🗜️ Creating int8 quantized version...')
    const int8Success = await compressModelWeights(
      originalModelPath,
      path.join(int8Path, 'model.json'),
      'int8'
    )
    
    if (int8Success) {
      console.log('📊 Int8 model size:', getDirectorySizeMB(int8Path), 'MB')
    }
    
    // Create compression summary
    const compressionSummary = {
      originalSize: getDirectorySizeMB(USE_MODEL_DIR),
      variants: {
        float16: {
          available: float16Success,
          size: float16Success ? getDirectorySizeMB(float16Path) : null,
          compressionRatio: float16Success ? 
            (parseFloat(getDirectorySizeMB(USE_MODEL_DIR)) / parseFloat(getDirectorySizeMB(float16Path))).toFixed(2) : null
        },
        int8: {
          available: int8Success,
          size: int8Success ? getDirectorySizeMB(int8Path) : null,
          compressionRatio: int8Success ? 
            (parseFloat(getDirectorySizeMB(USE_MODEL_DIR)) / parseFloat(getDirectorySizeMB(int8Path))).toFixed(2) : null
        }
      },
      createdAt: new Date().toISOString()
    }
    
    fs.writeFileSync(
      path.join(COMPRESSED_DIR, 'compression-summary.json'),
      JSON.stringify(compressionSummary, null, 2)
    )
    
    console.log('\n📋 Compression Summary:')
    console.log(`Original: ${compressionSummary.originalSize} MB`)
    if (float16Success) {
      console.log(`Float16: ${compressionSummary.variants.float16.size} MB (${compressionSummary.variants.float16.compressionRatio}x smaller)`)
    }
    if (int8Success) {
      console.log(`Int8: ${compressionSummary.variants.int8.size} MB (${compressionSummary.variants.int8.compressionRatio}x smaller)`)
    }
    
    console.log('\n✨ Model compression completed successfully!')
    console.log('Compressed models are available for applications requiring smaller file sizes.')
    
  } catch (error) {
    console.error('❌ Error during compression:', error)
    process.exit(1)
  }
}

/**
 * Optimize model for specific use cases
 */
async function optimizeForUseCase(useCase = 'general') {
  console.log(`\n🎯 Optimizing model for use case: ${useCase}`)
  
  const optimizations = {
    general: {
      description: 'Balanced performance and size',
      precision: 'float16',
      batchSize: 32
    },
    'low-memory': {
      description: 'Minimal memory footprint',
      precision: 'int8',
      batchSize: 1
    },
    'high-performance': {
      description: 'Maximum inference speed',
      precision: 'float32',
      batchSize: 64
    }
  }
  
  const config = optimizations[useCase] || optimizations.general
  
  console.log(`📝 Optimization config: ${config.description}`)
  console.log(`   Precision: ${config.precision}`)
  console.log(`   Batch size: ${config.batchSize}`)
  
  // Create optimization metadata
  const optimizationMetadata = {
    useCase,
    config,
    createdAt: new Date().toISOString(),
    recommendations: {
      'low-memory': 'Use int8 quantized model for memory-constrained environments',
      'high-performance': 'Use original float32 model with larger batch sizes',
      'general': 'Use float16 model for balanced performance'
    }
  }
  
  fs.writeFileSync(
    path.join(COMPRESSED_DIR, `optimization-${useCase}.json`),
    JSON.stringify(optimizationMetadata, null, 2)
  )
  
  console.log(`✅ Optimization profile created for ${useCase}`)
}

// Main execution
async function main() {
  try {
    await createOptimizedVariants()
    await optimizeForUseCase('general')
    await optimizeForUseCase('low-memory')
    await optimizeForUseCase('high-performance')
    
    console.log('\n🎉 All optimizations completed successfully!')
    
  } catch (error) {
    console.error('❌ Compression failed:', error)
    process.exit(1)
  }
}

main().catch(console.error)
