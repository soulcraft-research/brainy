/**
 * Emergency test to verify high-volume buffering activates correctly
 * Simulates the exact bluesky-package scenario
 */

const { BrainyData } = await import('../dist/index.js')

console.log('🧪 Testing high-volume buffering activation...')

// Create Brainy with memory storage for testing
const brainy = new BrainyData({
  dimensions: 384,
  storage: { 
    type: 'memory' 
  }
})

console.log('📊 Starting rapid fire operations (simulating bluesky firehose)...')

// Simulate the exact pattern that's failing
let operationCount = 0
const startTime = Date.now()

// Fire off 1000 operations without awaiting (like bluesky firehose)
const promises = []
for (let i = 0; i < 1000; i++) {
  const promise = brainy.add({
    id: `firehose-${i}`,
    data: {
      type: 'bluesky_post',
      content: `Message ${i} from firehose`,
      timestamp: Date.now()
    },
    metadata: {
      source: 'bluesky',
      batch: Math.floor(i / 100)
    }
  }).catch(error => {
    console.error(`Failed to add item ${i}:`, error.message)
    return null
  })
  
  promises.push(promise)
  operationCount++
  
  // Log every 100 operations
  if (i > 0 && i % 100 === 0) {
    console.log(`📈 Fired ${i} operations (not awaited)`)
    // Small delay to allow buffer detection
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}

console.log(`🚀 All ${operationCount} operations fired! Now waiting for completion...`)

// Wait for all operations to complete
const results = await Promise.all(promises)
const successful = results.filter(r => r !== null).length
const failed = results.filter(r => r === null).length

const duration = Date.now() - startTime
console.log(`\n✅ Test completed in ${duration}ms`)
console.log(`   Successful: ${successful}/${operationCount}`)
console.log(`   Failed: ${failed}/${operationCount}`)

if (successful < operationCount * 0.9) {
  console.error('❌ Test failed - too many operations failed')
  process.exit(1)
} else {
  console.log('✅ Test passed - high-volume operations completed successfully')
}

// Check if we have data
const searchResults = await brainy.search('bluesky', { k: 5 })
console.log(`🔍 Search results: ${searchResults.length} items found`)

console.log('\n🎯 Key things to check in logs:')
console.log('   1. "🚨 HIGH-VOLUME MODE ACTIVATED 🚨" message')
console.log('   2. "📝 BUFFERING: Adding noun/verb to write buffer" messages') 
console.log('   3. "🚀 BATCH FLUSH:" messages showing bulk operations')
console.log('   4. "📈 BUFFER GROWTH:" messages showing buffer accumulation')