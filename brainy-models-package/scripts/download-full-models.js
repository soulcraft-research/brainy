#!/usr/bin/env node

/* eslint-env node */
/* eslint-disable no-console */

/**
 * Download Full Models Script for @soulcraft/brainy-models
 * 
 * This script downloads the complete Universal Sentence Encoder model
 * and saves it locally for offline use, providing maximum reliability.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as tf from '@tensorflow/tfjs-node'
import * as use from '@tensorflow-models/universal-sentence-encoder'
import https from 'https'
import { promisify } from 'util'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MODELS_DIR = path.join(__dirname, '..', 'models')
const USE_MODEL_DIR = path.join(MODELS_DIR, 'universal-sentence-encoder')

// Ensure directories exist
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true })
}

if (!fs.existsSync(USE_MODEL_DIR)) {
  fs.mkdirSync(USE_MODEL_DIR, { recursive: true })
}

console.log('🚀 Starting full model download for @soulcraft/brainy-models...')
console.log('This will download the complete Universal Sentence Encoder model (~25MB)')
console.log('for offline use and maximum reliability.\n')

/**
 * Download a file from URL to local path
 */
async function downloadFile(url, filePath, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath)
    
    const handleRequest = (requestUrl, redirectCount = 0) => {
      https.get(requestUrl, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400) {
          if (redirectCount >= maxRedirects) {
            reject(new Error(`Too many redirects (${redirectCount}) for ${url}`))
            return
          }
          
          const location = response.headers.location
          if (!location) {
            reject(new Error(`Redirect response without location header for ${url}`))
            return
          }
          
          // Handle relative redirects
          const redirectUrl = location.startsWith('http') ? location : new URL(location, requestUrl).href
          console.log(`📍 Following redirect ${redirectCount + 1}: ${redirectUrl}`)
          
          // Close the current file stream and start over with the redirect URL
          file.close()
          fs.unlink(filePath, () => {}) // Delete partial file
          
          // Recursively handle the redirect
          return downloadFile(redirectUrl, filePath, maxRedirects).then(resolve).catch(reject)
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: ${response.statusCode}`))
          return
        }
        
        const totalSize = parseInt(response.headers['content-length'] || '0')
        let downloadedSize = 0
        
        response.on('data', (chunk) => {
          downloadedSize += chunk.length
          if (totalSize > 0) {
            const progress = ((downloadedSize / totalSize) * 100).toFixed(1)
            process.stdout.write(`\r📥 Downloading: ${progress}% (${downloadedSize}/${totalSize} bytes)`)
          }
        })
        
        response.pipe(file)
        
        file.on('finish', () => {
          file.close()
          console.log(`\n✅ Downloaded: ${path.basename(filePath)}`)
          resolve()
        })
        
        file.on('error', (err) => {
          fs.unlink(filePath, () => {}) // Delete partial file
          reject(err)
        })
      }).on('error', reject)
    }
    
    handleRequest(url)
  })
}

/**
 * Download the complete Universal Sentence Encoder model
 */
async function downloadFullModel() {
  try {
    console.log('🔍 Loading model to get download URLs...')
    
    // Load the model to get access to its internal structure
    const model = await use.load()
    console.log('✅ Model loaded successfully')
    
    // Test the model to ensure it works
    console.log('🧪 Testing model functionality...')
    const testEmbedding = await model.embed(['Hello world'])
    const testArray = await testEmbedding.array()
    console.log(`✅ Model test passed - embedding dimensions: ${testArray[0].length}`)
    testEmbedding.dispose()
    
    // The Universal Sentence Encoder model URL (using Google Cloud Storage which still works)
    const modelBaseUrl = 'https://storage.googleapis.com/tfjs-models/savedmodel/universal_sentence_encoder'
    
    console.log('📦 Downloading model files...')
    console.log('Using Google Cloud Storage URLs (TensorFlow Hub URLs are deprecated)...')
    
    // Download model.json
    const modelJsonUrl = `${modelBaseUrl}/model.json`
    const modelJsonPath = path.join(USE_MODEL_DIR, 'model.json')
    await downloadFile(modelJsonUrl, modelJsonPath)
    
    // Read the model.json to get the weights manifest
    const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'))
    
    // Add the required "format" field for TensorFlow.js compatibility
    if (!modelJson.format) {
      modelJson.format = 'tfjs-graph-model'
      fs.writeFileSync(modelJsonPath, JSON.stringify(modelJson, null, 2))
      console.log('✅ Added "format" field to model.json for TensorFlow.js compatibility')
    }
    
    // Download all weight files
    if (modelJson.weightsManifest) {
      for (const manifest of modelJson.weightsManifest) {
        for (const weightFile of manifest.paths) {
          const weightUrl = `${modelBaseUrl}/${weightFile}`
          const weightPath = path.join(USE_MODEL_DIR, weightFile)
          await downloadFile(weightUrl, weightPath)
        }
      }
    }
    
    // Create metadata for the bundled model
    const metadata = {
      name: 'universal-sentence-encoder',
      version: '1.0.0',
      description: 'Complete Universal Sentence Encoder model bundled for offline use',
      dimensions: 512,
      downloadDate: new Date().toISOString(),
      source: 'tensorflow-models/universal-sentence-encoder',
      approach: 'full-bundle',
      modelUrl: modelBaseUrl,
      bundledLocally: true,
      reliability: 'maximum'
    }
    
    fs.writeFileSync(
      path.join(USE_MODEL_DIR, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    )
    
    // Verify all files exist and calculate total size
    const modelFiles = fs.readdirSync(USE_MODEL_DIR)
    let totalSize = 0
    
    console.log('\n📋 Downloaded files:')
    for (const file of modelFiles) {
      const filePath = path.join(USE_MODEL_DIR, file)
      const stats = fs.statSync(filePath)
      totalSize += stats.size
      console.log(`  ✅ ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
    }
    
    console.log(`\n🎉 Model download complete!`)
    console.log(`📊 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`📁 Location: ${USE_MODEL_DIR}`)
    console.log(`🔒 Reliability: Maximum (fully offline)`)
    
    // Test loading the downloaded model
    console.log('\n🧪 Testing downloaded model...')
    const offlineModel = await tf.loadGraphModel(`file://${path.join(USE_MODEL_DIR, 'model.json')}`)
    console.log('✅ Offline model loads successfully')
    
    // Clean up
    offlineModel.dispose()
    
    console.log('\n✨ Full model bundling completed successfully!')
    console.log('The model is now available for offline use with maximum reliability.')
    
  } catch (error) {
    console.error('❌ Error downloading full model:', error)
    process.exit(1)
  }
}

// Run the download
downloadFullModel().catch(console.error)
