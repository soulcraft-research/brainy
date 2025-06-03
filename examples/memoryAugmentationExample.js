/**
 * Example: Using Memory Augmentations for Data Storage
 *
 * This example demonstrates how to use the different memory augmentation implementations
 * for storing and retrieving data in Brainy.
 *
 * The example shows:
 * 1. Using the default memory augmentation (auto-selected based on environment)
 * 2. Using specific storage types (Memory, FileSystem, OPFS)
 */

import {
  registerAugmentation,
  initializeAugmentationPipeline,
  createMemoryAugmentation
} from '../dist/index.js'

// Example 1: Using the default memory augmentation
async function useDefaultMemoryAugmentation() {
  console.log('Setting up default memory augmentation...')

  // Create the memory augmentation with automatic storage selection
  const memoryAug = await createMemoryAugmentation('brainy-default-memory')

  // Register the augmentation
  registerAugmentation(memoryAug)

  // Initialize the augmentation pipeline
  initializeAugmentationPipeline()

  // Initialize the augmentation
  await memoryAug.initialize()

  console.log('Default memory augmentation initialized successfully')
  console.log('Storage type:', await getStorageType(memoryAug))

  // Store some data
  await storeAndRetrieveData(memoryAug)

  return memoryAug
}

// Example 2: Using in-memory storage explicitly
async function useInMemoryStorage() {
  console.log('Setting up in-memory storage...')

  // Create the memory augmentation with in-memory storage
  const memoryAug = await createMemoryAugmentation('brainy-memory-storage', {
    storageType: 'memory'
  })

  // Register the augmentation
  registerAugmentation(memoryAug)

  // Initialize the augmentation
  await memoryAug.initialize()

  console.log('In-memory storage initialized successfully')

  // Store some data
  await storeAndRetrieveData(memoryAug)

  return memoryAug
}

// Example 3: Using file system storage (Node.js environments)
async function useFileSystemStorage() {
  console.log('Setting up file system storage...')

  try {
    // Create the memory augmentation with file system storage
    const memoryAug = await createMemoryAugmentation('brainy-filesystem-storage', {
      storageType: 'filesystem',
      rootDirectory: './data' // Store data in a 'data' directory
    })

    // Register the augmentation
    registerAugmentation(memoryAug)

    // Initialize the augmentation
    await memoryAug.initialize()

    console.log('File system storage initialized successfully')

    // Store some data
    await storeAndRetrieveData(memoryAug)

    return memoryAug
  } catch (error) {
    console.error('Failed to initialize file system storage:', error)
    console.log('This might be because you are not in a Node.js environment')
    return null
  }
}

// Example 4: Using OPFS storage (browser environments)
async function useOPFSStorage() {
  console.log('Setting up OPFS storage...')

  try {
    // Create the memory augmentation with OPFS storage
    const memoryAug = await createMemoryAugmentation('brainy-opfs-storage', {
      storageType: 'opfs',
      requestPersistentStorage: true
    })

    // Register the augmentation
    registerAugmentation(memoryAug)

    // Initialize the augmentation
    await memoryAug.initialize()

    console.log('OPFS storage initialized successfully')

    // Store some data
    await storeAndRetrieveData(memoryAug)

    return memoryAug
  } catch (error) {
    console.error('Failed to initialize OPFS storage:', error)
    console.log('This might be because you are not in a browser environment or OPFS is not supported')
    return null
  }
}

// Helper function to store and retrieve data
async function storeAndRetrieveData(memoryAug) {
  console.log('Storing and retrieving data...')

  // Store data
  const userData = {
    name: 'John Doe',
    email: 'john@example.com',
    preferences: {
      theme: 'dark',
      fontSize: 14,
      notifications: true
    },
    // Add a vector for search testing
    vector: [0.1, 0.2, 0.3, 0.4, 0.5]
  }

  const storeResponse = await memoryAug.storeData('user-1', userData)
  console.log('Store response:', storeResponse)

  // Store more data with vectors for search testing
  await memoryAug.storeData('user-2', {
    name: 'Jane Smith',
    email: 'jane@example.com',
    preferences: {
      theme: 'light',
      fontSize: 16,
      notifications: false
    },
    vector: [0.2, 0.3, 0.4, 0.5, 0.6]
  })

  await memoryAug.storeData('user-3', {
    name: 'Bob Johnson',
    email: 'bob@example.com',
    preferences: {
      theme: 'dark',
      fontSize: 12,
      notifications: true
    },
    vector: [0.3, 0.4, 0.5, 0.6, 0.7]
  })

  // Retrieve data
  const retrieveResponse = await memoryAug.retrieveData('user-1')
  console.log('Retrieve response:', retrieveResponse)

  // Update data
  const updateResponse = await memoryAug.updateData('user-1', {
    ...userData,
    preferences: {
      ...userData.preferences,
      theme: 'light'
    }
  })
  console.log('Update response:', updateResponse)

  // Retrieve updated data
  const retrieveUpdatedResponse = await memoryAug.retrieveData('user-1')
  console.log('Retrieved updated data:', retrieveUpdatedResponse)

  // Test search functionality
  await searchData(memoryAug)

  // Delete data
  const deleteResponse = await memoryAug.deleteData('user-1')
  console.log('Delete response:', deleteResponse)
  await memoryAug.deleteData('user-2')
  await memoryAug.deleteData('user-3')

  // Verify deletion
  const retrieveAfterDeleteResponse = await memoryAug.retrieveData('user-1')
  console.log('Retrieve after delete response:', retrieveAfterDeleteResponse)
}

// Helper function to test search functionality
async function searchData(memoryAug) {
  console.log('\nTesting search functionality...')

  // Create a query vector
  const queryVector = [0.2, 0.3, 0.4, 0.5, 0.6]

  try {
    // Search for similar vectors
    console.log('Searching for similar vectors...')
    const searchResponse = await memoryAug.search(queryVector, 2)

    if (searchResponse.success) {
      console.log('Search results:')
      for (const result of searchResponse.data) {
        console.log(`- ID: ${result.id}, Score: ${result.score.toFixed(4)}`)
        if (result.data) {
          console.log(`  Name: ${result.data.name}, Email: ${result.data.email}`)
        }
      }
    } else {
      console.error('Search failed:', searchResponse.error)
    }
  } catch (error) {
    console.error('Error during search:', error)
  }
}

// Helper function to get storage type
async function getStorageType(memoryAug) {
  // This is a bit of a hack to determine the storage type
  // In a real application, you might want to add a method to the augmentation
  // to return the storage type directly
  const constructorName = memoryAug.constructor.name
  return constructorName
}

// Run the examples
async function runExamples() {
  console.log('Running memory augmentation examples...')

  // Example 1: Default memory augmentation
  const defaultMemory = await useDefaultMemoryAugmentation()
  await defaultMemory.shutDown()

  // Example 2: In-memory storage
  const inMemoryStorage = await useInMemoryStorage()
  await inMemoryStorage.shutDown()

  // Example 3: File system storage
  const fileSystemStorage = await useFileSystemStorage()
  if (fileSystemStorage) {
    await fileSystemStorage.shutDown()
  }

  // Example 4: OPFS storage
  const opfsStorage = await useOPFSStorage()
  if (opfsStorage) {
    await opfsStorage.shutDown()
  }

  console.log('All examples completed')
}

// Run the examples
runExamples().catch(error => {
  console.error('Error running examples:', error)
})
