#!/usr/bin/env node
/**
 * Example: GPU Acceleration in Brainy
 * 
 * This example demonstrates how to use GPU acceleration for embeddings
 * while keeping optimized CPU processing for distance calculations.
 */

import { BrainyData, TransformerEmbedding } from '@soulcraft/brainy'

async function demonstrateGPUAcceleration() {
  console.log('🚀 Brainy GPU Acceleration Demo\n')

  // 1. Auto-detect best device (default behavior)
  console.log('1. Creating database with auto GPU detection...')
  const db = new BrainyData({
    embedding: {
      type: 'transformers', 
      options: { 
        device: 'auto',  // Automatically detects and uses best available device
        verbose: true    // Show device selection and performance info
      }
    }
  })
  await db.init()

  // 2. Add some sample data (embeddings will use GPU if available)
  console.log('\n2. Adding sample data with GPU-accelerated embeddings...')
  await db.add({ text: 'The quick brown fox jumps over the lazy dog' })
  await db.add({ text: 'Machine learning is revolutionizing technology' })
  await db.add({ text: 'Vector databases enable semantic search capabilities' })

  // 3. Search (distance calculations use optimized CPU)
  console.log('\n3. Searching with optimized CPU distance calculations...')
  const results = await db.search('artificial intelligence and ML', { k: 2 })
  
  console.log('Search results:')
  results.forEach((result, i) => {
    console.log(`   ${i + 1}. "${result.data.text}" (distance: ${result.distance.toFixed(4)})`)
  })

  // 4. Demonstrate explicit device selection
  console.log('\n4. Creating explicit CPU-only embedder for comparison...')
  const cpuEmbedder = new TransformerEmbedding({ 
    device: 'cpu',
    verbose: true 
  })

  const start = Date.now()
  const embedding = await cpuEmbedder.embed('This will use CPU-only processing')
  const duration = Date.now() - start

  console.log(`   CPU embedding completed in ${duration}ms (${embedding.length} dimensions)`)

  // 5. Show configuration options
  console.log('\n5. Available device options:')
  console.log('   • "auto" - Automatically detect best device (recommended)')
  console.log('   • "cpu" - Force CPU processing')
  console.log('   • "webgpu" - Use WebGPU in browsers (if supported)')
  console.log('   • "cuda" - Use CUDA in Node.js (if available)')
  console.log('   • "gpu" - Generic GPU (resolves to best available)')

  console.log('\n6. Performance characteristics:')
  console.log('   ✅ GPU Accelerated: Embedding generation (3-5x faster for batches)')
  console.log('   ✅ CPU Optimized: Distance calculations (faster for small vectors)')
  console.log('   ✅ Automatic Fallback: CPU fallback if GPU initialization fails')

  // Cleanup
  await cpuEmbedder.dispose()
  console.log('\n🎉 Demo completed! Brainy automatically optimizes for your hardware.')
}

demonstrateGPUAcceleration().catch(console.error)