#!/usr/bin/env node

/**
 * Example Brainy application for Docker deployment
 * Demonstrates custom models path usage
 */

import { BrainyData } from '@soulcraft/brainy'

async function main() {
  console.log('🚀 Starting Brainy Docker Example App...')
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Models Path: ${process.env.BRAINY_MODELS_PATH || 'default (node_modules)'}`)
  
  const db = new BrainyData({
    forceMemoryStorage: true,
    dimensions: 512,
    // Don't skip embeddings - let it try to load models
    skipEmbeddings: false
  })

  try {
    console.log('\n📊 Initializing BrainyData...')
    await db.init()
    console.log('✅ BrainyData initialized successfully!')

    // Add some test data
    console.log('\n📝 Adding test data...')
    const testItems = [
      'Artificial intelligence is transforming the world',
      'Machine learning enables computers to learn without being explicitly programmed',
      'Docker containers provide a consistent environment for applications',
      'Cloud deployment makes applications scalable and reliable'
    ]

    const ids = []
    for (const text of testItems) {
      const id = await db.add({ content: text })
      ids.push(id)
      console.log(`   Added: "${text}" (ID: ${id})`)
    }

    // Search for similar content
    console.log('\n🔍 Searching for AI-related content...')
    const searchResults = await db.search('artificial intelligence and machine learning', 2)
    
    console.log(`Found ${searchResults.length} results:`)
    searchResults.forEach((result, index) => {
      console.log(`   ${index + 1}. "${result.content}" (Score: ${result.similarity?.toFixed(3)})`)
    })

    // Get database statistics
    console.log('\n📈 Database Statistics:')
    const stats = await db.getStatistics()
    console.log(`   Total items: ${stats.totalVectors}`)
    console.log(`   Storage type: ${stats.storageType}`)
    console.log(`   Index type: ${stats.indexType}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\n💡 Troubleshooting tips:')
    console.error('   1. Ensure models are available in BRAINY_MODELS_PATH')
    console.error('   2. Check that @soulcraft/brainy-models is installed')
    console.error('   3. Verify network connectivity for remote model loading')
    process.exit(1)
  }

  console.log('\n🎉 Example completed successfully!')
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n👋 Received SIGTERM, shutting down...')
  process.exit(0)
})

// Run the example
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})