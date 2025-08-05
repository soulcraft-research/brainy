#!/usr/bin/env node

/**
 * Simple script to verify model loading behavior
 * Run with: node tests/verify-model-loading.js
 */

import { BrainyData } from '../dist/unified.js'

console.log('Testing Brainy model loading behavior...\n')

const db = new BrainyData({
  forceMemoryStorage: true,
  dimensions: 512
})

console.log('Initializing BrainyData...')
await db.init()

console.log('\nAttempting to embed text...')
const text = 'This is a test sentence for embedding'
const id = await db.add({ content: text })

console.log(`\n✅ Successfully added text with ID: ${id}`)

// Test search
const results = await db.search('test sentence', 1)
console.log(`\n✅ Search returned ${results.length} result(s)`)

console.log('\n---')
console.log('Model loading test complete!')
console.log('\nNOTE: Check the console output above to see:')
console.log('1. If @soulcraft/brainy-models was found and used (best performance)')
console.log('2. If fallback to URL loading occurred (with warning)')
console.log('3. Verification that the correct model was loaded')

process.exit(0)