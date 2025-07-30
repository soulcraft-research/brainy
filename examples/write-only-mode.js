/**
 * Example demonstrating the write-only mode in BrainyData
 * 
 * This mode is useful for data ingestion scenarios where you only need to insert data
 * and don't need to perform any search operations. It significantly reduces memory usage
 * by not loading the index into memory.
 */

import { BrainyData } from '../dist/index.js'

// eslint-disable-next-line no-undef
const console = globalThis.console

async function demonstrateWriteOnlyMode() {
  console.log('Demonstrating write-only mode in BrainyData')
  
  // Create a BrainyData instance in write-only mode
  const db = new BrainyData({
    writeOnly: true,
    storage: {
      // Use file system storage for persistence
      forceFileSystemStorage: true
    }
  })
  
  // Initialize the database
  // This will skip loading the index into memory, saving memory and startup time
  await db.init()
  
  console.log('Database initialized in write-only mode')
  console.log('Is write-only:', db.isWriteOnly()) // Should print true
  
  // Add some data
  // This works normally even in write-only mode
  const id1 = await db.add('This is a test document', { title: 'Test Document 1' })
  const id2 = await db.add('Another test document with different content', { title: 'Test Document 2' })
  
  console.log(`Added documents with IDs: ${id1}, ${id2}`)
  
  // Try to search (this will throw an error in write-only mode)
  try {
    await db.search('test', 5)
  } catch (error) {
    console.log('Search error (expected):', error.message)
  }
  
  // Switch to normal mode to perform searches
  console.log('Switching to normal mode...')
  db.setWriteOnly(false)
  
  // Re-initialize to load the index
  await db.init()
  
  console.log('Database reinitialized in normal mode')
  console.log('Is write-only:', db.isWriteOnly()) // Should print false
  
  // Now search works
  const results = await db.search('test', 5)
  console.log('Search results:', results.map(r => ({ id: r.id, score: r.score, title: r.metadata?.title })))
  
  // Clean up
  await db.shutDown()
}

// Run the example
demonstrateWriteOnlyMode().catch(error => {
  console.error('Error in write-only mode example:', error)
})
