// Node.js test script for @soulcraft/brainy

// CRITICAL: First, directly apply the TensorFlow.js patch
// This is the most reliable way to ensure the patch is applied before TensorFlow.js is loaded
import { TextEncoder, TextDecoder } from 'util'

// Make TextEncoder and TextDecoder available globally
if (typeof global !== 'undefined') {
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// Import the library
import * as brainy from './dist/unified.js'

async function runNodeTest() {
  console.log('\n=== Testing @soulcraft/brainy in Node.js environment ===\n')

  try {
    // Test environment detection
    console.log('Environment Detection:')
    console.log(`- isBrowser: ${brainy.isBrowser()}`)
    console.log(`- isNode: ${brainy.isNode()}`)
    console.log(`- isWebWorker: ${brainy.isWebWorker()}`)
    console.log(`- areWebWorkersAvailable: ${brainy.areWebWorkersAvailable()}`)
    console.log(`- isThreadingAvailable: ${brainy.isThreadingAvailable()}`)
    console.log(
      `- areWorkerThreadsAvailableSync: ${brainy.areWorkerThreadsAvailableSync()}`
    )

    // Test TensorFlow functionality
    console.log('\nTesting TensorFlow functionality...')

    // Create a simple BrainyData instance
    const data = new brainy.BrainyData({
      dimensions: 2,
      metric: 'euclidean'
    })

    console.log('Successfully created BrainyData instance')

    // Initialize the database
    console.log('Initializing database...')
    await data.init()

    // Add a simple vector
    await data.add([1, 2], { id: 'test1', text: 'Test item' })
    console.log('Successfully added item to BrainyData')

    // Search for similar vectors
    const results = await data.search([1, 2], 1)
    console.log('Search results:', results)

    // Test embedding functionality (which uses TensorFlow)
    console.log('\nTesting embedding functionality...')
    const embeddingFunction = brainy.createEmbeddingFunction()
    const embedding = await embeddingFunction('This is a test sentence')
    console.log(
      `Successfully created embedding with length: ${embedding.length}`
    )

    console.log('\n✅ All Node.js tests passed successfully!')
    return true
  } catch (error) {
    console.error('❌ Node.js test failed:', error)
    return false
  }
}

// Run the test
runNodeTest().then((success) => {
  if (!success) {
    process.exit(1)
  }
})
