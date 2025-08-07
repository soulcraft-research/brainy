#!/usr/bin/env node

/**
 * Write-Only Mode with Direct Reads Demo
 * 
 * This example demonstrates the new allowDirectReads feature that enables
 * direct storage operations in write-only mode for efficient deduplication
 * without loading expensive search indexes.
 */

import { BrainyData } from '../dist/index.js'

// Simulate external API calls
const mockBlueskyAPI = {
  async getProfile(did) {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 100))
    return {
      did,
      handle: `user-${did.split(':')[2]}`,
      displayName: `User ${did.split(':')[2]}`,
      followersCount: Math.floor(Math.random() * 1000),
      postsCount: Math.floor(Math.random() * 500),
      createdAt: new Date().toISOString()
    }
  }
}

async function demonstrateWriteOnlyDirectReads() {
  console.log('🚀 Write-Only Mode with Direct Reads Demo\n')

  // Create instances with different configurations
  console.log('📝 Creating BrainyData instances...')
  
  const writerOnlyService = new BrainyData({
    writeOnly: true,
    allowDirectReads: false
  })
  
  const writerWithReadsService = new BrainyData({
    writeOnly: true,
    allowDirectReads: true
  })
  
  const fullService = new BrainyData({
    writeOnly: false
  })

  await writerOnlyService.init()
  await writerWithReadsService.init()
  await fullService.init()

  console.log('✅ All instances initialized\n')

  // Demonstrate the problem with write-only mode without direct reads
  console.log('❌ Problem: Write-only mode without direct reads')
  console.log('   - Cannot check for existing data')
  console.log('   - Must make redundant API calls')
  console.log('   - No efficient deduplication possible\n')

  // Simulate Bluesky service with write-only + direct reads
  console.log('✅ Solution: Write-only mode WITH direct reads')
  
  const processMessage = async (did, messageData) => {
    console.log(`   Processing message from ${did}...`)
    
    // Check if profile already exists (direct storage lookup)
    const existingProfile = await writerWithReadsService.get(did)
    
    if (!existingProfile) {
      console.log(`   📡 Making API call for new DID: ${did}`)
      // Simulate API call
      const profileData = await mockBlueskyAPI.getProfile(did)
      
      // Store the profile
      const profileVector = new Array(384).fill(Math.random() * 0.1)
      await writerWithReadsService.add(profileVector, profileData, { id: did })
      
      return { action: 'created', profile: profileData, apiCall: true }
    } else {
      console.log(`   ⚡ Using cached profile for: ${did}`)
      // Profile exists, skip API call
      return { action: 'existing', profile: existingProfile.metadata, apiCall: false }
    }
  }

  // Test deduplication efficiency
  console.log('\n🔄 Testing deduplication efficiency...')
  
  const testDIDs = [
    'did:plc:user123',
    'did:plc:user456', 
    'did:plc:user123', // Duplicate
    'did:plc:user789',
    'did:plc:user123', // Another duplicate
    'did:plc:user456'  // Another duplicate
  ]

  let apiCallCount = 0
  const results = []

  console.log(`\n📊 Processing ${testDIDs.length} messages...`)
  
  for (const did of testDIDs) {
    const result = await processMessage(did, { text: `Message from ${did}` })
    results.push(result)
    if (result.apiCall) apiCallCount++
  }

  console.log(`\n📈 Results:`)
  console.log(`   • Total messages processed: ${testDIDs.length}`)
  console.log(`   • Unique profiles: ${new Set(testDIDs).size}`)
  console.log(`   • API calls made: ${apiCallCount}`)
  console.log(`   • API calls saved: ${testDIDs.length - apiCallCount}`)
  console.log(`   • Efficiency: ${Math.round((1 - apiCallCount / testDIDs.length) * 100)}% reduction in API calls`)

  // Demonstrate direct read operations
  console.log('\n🔍 Testing direct read operations...')
  
  const testDID = 'did:plc:user123'
  
  console.log(`   • get('${testDID}'): ${await writerWithReadsService.get(testDID) ? '✅ Found' : '❌ Not found'}`)
  console.log(`   • has('${testDID}'): ${await writerWithReadsService.has(testDID) ? '✅ Exists' : '❌ Missing'}`)
  console.log(`   • exists('${testDID}'): ${await writerWithReadsService.exists(testDID) ? '✅ Exists' : '❌ Missing'}`)
  
  const metadata = await writerWithReadsService.getMetadata(testDID)
  console.log(`   • getMetadata('${testDID}'): ${metadata ? `✅ ${metadata.handle}` : '❌ No metadata'}`)
  
  const batchResults = await writerWithReadsService.getBatch([
    'did:plc:user123', 
    'did:plc:user456', 
    'did:plc:nonexistent'
  ])
  console.log(`   • getBatch([3 items]): ${batchResults.filter(r => r !== null).length}/3 found`)

  // Demonstrate that search operations are still blocked
  console.log('\n🚫 Confirming search operations are blocked...')
  
  try {
    await writerWithReadsService.search('test')
    console.log('   ❌ ERROR: Search should have failed!')
  } catch (error) {
    console.log('   ✅ search() correctly blocked:', error.message.split('.')[0])
  }

  // Performance comparison
  console.log('\n⚡ Performance Benefits:')
  console.log('   • No search index loading in memory')
  console.log('   • Fast direct storage lookups')
  console.log('   • Reduced memory footprint')
  console.log('   • Optimal for high-throughput data ingestion')
  console.log('   • Perfect for microservices with specific roles')

  // Configuration examples
  console.log('\n⚙️  Configuration Examples:')
  console.log(`
   // Writer service with deduplication
   const writerService = new BrainyData({
     writeOnly: true,           // No search index
     allowDirectReads: true     // Enable direct ID lookups
   })

   // Pure writer service (no reads)
   const pureWriter = new BrainyData({
     writeOnly: true,           // No search index
     allowDirectReads: false    // No read operations
   })

   // Full-featured service
   const readerService = new BrainyData({
     writeOnly: false           // Full search capabilities
   })
  `)

  // Cleanup
  console.log('🧹 Cleaning up...')
  await writerOnlyService.cleanup?.()
  await writerWithReadsService.cleanup?.()
  await fullService.cleanup?.()
  
  console.log('✨ Demo completed successfully!')
}

// Run the demo
demonstrateWriteOnlyDirectReads().catch(console.error)