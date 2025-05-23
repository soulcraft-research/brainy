/**
 * Example demonstrating how to use the FileSystemStorage adapter with a custom directory
 */

import { BrainyData } from '../brainyData.js'
import { FileSystemStorage } from '../storage/fileSystemStorage.js'
import path from 'path'

// Example data - word embeddings
const wordEmbeddings = {
  'cat': [0.2, 0.3, 0.4, 0.1],
  'dog': [0.3, 0.2, 0.4, 0.2],
  'fish': [0.1, 0.1, 0.8, 0.2]
}

// Example metadata
const metadata: {
  [key: string]: { type: string; [key]: boolean } | undefined | null
} = {
  'cat': { type: 'mammal', domesticated: true },
  'dog': { type: 'mammal', domesticated: true },
  'fish': { type: 'fish', domesticated: false }
}

/**
 * Run the example
 */
async function runExample() {
  console.log('Initializing vector database with custom storage location...')

  // Create a custom storage adapter with a specific directory
  // This will store data in ./custom-data directory relative to the current working directory
  const customStoragePath = path.join(process.cwd(), 'custom-data')
  const storageAdapter = new FileSystemStorage(customStoragePath)

  // Create a new vector database with the custom storage adapter
  const db = new BrainyData({
    storageAdapter
  })

  await db.init()

  console.log(`Using custom storage location: ${customStoragePath}`)
  console.log('Adding vectors to the database...')

  // Add vectors to the database
  const ids: Record<string, string> = {}
  for (const [word, vector] of Object.entries(wordEmbeddings)) {
    ids[word] = await db.add(vector, metadata[word])
    console.log(`Added "${word}" with ID: ${ids[word]}`)
  }

  console.log('\nDatabase size:', db.size())

  // Search for similar vectors
  console.log('\nSearching for vectors similar to "cat"...')
  const catResults = await db.search(wordEmbeddings['cat'], 2)
  console.log('Results:')
  for (const result of catResults) {
    const word = Object.entries(ids).find(([_, id]) => id === result.id)?.[0] || 'unknown'
    console.log(`- ${word} (score: ${result.score.toFixed(4)}, metadata:`, result.metadata, ')')
  }

  console.log('\nExample completed successfully!')
  console.log(`Data has been stored in: ${customStoragePath}`)
  console.log('You can restart this example to verify that data persists between runs.')
}

// Only run in Node.js environment
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  runExample().catch(error => {
    console.error('Error running example:', error)
  })
} else {
  console.error('This example is designed to run in Node.js environments only.')
}
