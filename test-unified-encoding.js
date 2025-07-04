// Test script to verify the unified text encoding approach works correctly
import { BrainyData } from './dist/unified.js'

async function testUnifiedEncoding() {
  console.log(
    'Testing unified text encoding approach in Node.js environment...'
  )

  try {
    // Initialize BrainyData which should trigger the PlatformNode constructor
    console.log('Creating BrainyData instance...')
    const db = new BrainyData()

    // Initialize the database
    console.log('Initializing database...')
    await db.init()

    console.log('Test successful! Unified text encoding is working correctly.')

    // Get database status to verify everything is working
    const status = await db.status()
    console.log('Database status:', status)

    return true
  } catch (error) {
    console.error('Error during test:', error)
    return false
  }
}

// Run the test
testUnifiedEncoding().then((success) => {
  if (success) {
    console.log('Unified text encoding verification completed successfully!')
  } else {
    console.error('Unified text encoding verification failed!')
    process.exit(1)
  }
})
