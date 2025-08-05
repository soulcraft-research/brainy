#!/usr/bin/env node

/**
 * Simple test to verify model loading priority messages
 */

import { BrainyData } from '../dist/unified.js'

console.log('Testing model loading priority system...\n')

const db = new BrainyData({
  forceMemoryStorage: true,
  dimensions: 512,
  skipEmbeddings: true  // Skip embeddings to avoid model loading for this test
})

console.log('Initializing BrainyData with skipEmbeddings=true...')
await db.init()

console.log('\n✅ BrainyData initialized successfully (embeddings skipped)')

// Now test with embeddings enabled to see the warnings
console.log('\n---')
console.log('Now testing with embeddings enabled to see model loading messages...\n')

const db2 = new BrainyData({
  forceMemoryStorage: true,
  dimensions: 512,
  skipEmbeddings: false
})

try {
  await db2.init()
  console.log('\n✅ Model loaded successfully')
} catch (error) {
  console.log('\n❌ Model loading failed (expected in test environment without actual models)')
  console.log(`   Error: ${error.message.split('\n')[0]}`)
}

console.log('\n---')
console.log('Check the output above to verify:')
console.log('1. "Checking for @soulcraft/brainy-models package..." appears')
console.log('2. Warning about falling back to remote loading appears')
console.log('3. Installation suggestion for @soulcraft/brainy-models appears')

process.exit(0)