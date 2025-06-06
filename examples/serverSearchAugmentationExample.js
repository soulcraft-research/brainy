/**
 * Server Search Augmentation Example
 * 
 * This example demonstrates how to use the ServerSearchConduitAugmentation and
 * ServerSearchActivationAugmentation to search a server-hosted Brainy instance,
 * store results locally, and perform further searches against the local instance.
 */

import { 
  BrainyData, 
  augmentationPipeline,
  AugmentationType,
  NounType
} from '@soulcraft/brainy'

// Import the server search augmentations
import { 
  ServerSearchConduitAugmentation,
  ServerSearchActivationAugmentation,
  createServerSearchAugmentations
} from '../src/augmentations/serverSearchAugmentations.js'

/**
 * Example 1: Using the factory function
 * 
 * This is the simplest way to use the server search augmentations.
 * The factory function creates both augmentations, links them together,
 * and connects to the server.
 */
async function example1() {
  console.log('Example 1: Using the factory function')
  
  try {
    // Create the augmentations and connect to the server
    const { conduit, activation, connection } = await createServerSearchAugmentations(
      'wss://your-brainy-server.com/ws',
      { protocols: 'brainy-sync' }
    )
    
    // Register the augmentations with the pipeline
    augmentationPipeline.register(conduit)
    augmentationPipeline.register(activation)
    
    console.log('Connected to server with connection ID:', connection.connectionId)
    
    // Search the server and store results locally
    console.log('Searching server for "machine learning"...')
    const serverSearchResult = await conduit.searchServer(
      connection.connectionId,
      'machine learning',
      5
    )
    
    if (serverSearchResult.success) {
      console.log('Server search results:', serverSearchResult.data)
    } else {
      console.error('Server search failed:', serverSearchResult.error)
    }
    
    // Now search locally - this should return the results we just stored
    console.log('Searching local database for "machine learning"...')
    const localSearchResult = await conduit.searchLocal('machine learning', 5)
    
    if (localSearchResult.success) {
      console.log('Local search results:', localSearchResult.data)
    } else {
      console.error('Local search failed:', localSearchResult.error)
    }
    
    // Perform a combined search
    console.log('Performing combined search for "neural networks"...')
    const combinedSearchResult = await conduit.searchCombined(
      connection.connectionId,
      'neural networks',
      5
    )
    
    if (combinedSearchResult.success) {
      console.log('Combined search results:', combinedSearchResult.data)
    } else {
      console.error('Combined search failed:', combinedSearchResult.error)
    }
    
    // Add data to both local and server
    console.log('Adding data to both local and server...')
    const addResult = await conduit.addToBoth(
      connection.connectionId,
      'Deep learning is a subset of machine learning',
      {
        noun: NounType.Concept,
        category: 'AI',
        tags: ['deep learning', 'neural networks']
      }
    )
    
    if (addResult.success) {
      console.log('Added data with ID:', addResult.data)
    } else {
      console.error('Failed to add data:', addResult.error)
    }
    
  } catch (error) {
    console.error('Example 1 failed:', error)
  }
}

/**
 * Example 2: Using the activation augmentation
 * 
 * This example demonstrates how to use the activation augmentation
 * to trigger actions related to server search.
 */
async function example2() {
  console.log('\nExample 2: Using the activation augmentation')
  
  try {
    // Create the augmentations and connect to the server
    const { conduit, activation, connection } = await createServerSearchAugmentations(
      'wss://your-brainy-server.com/ws',
      { protocols: 'brainy-sync' }
    )
    
    // Register the augmentations with the pipeline
    augmentationPipeline.register(conduit)
    augmentationPipeline.register(activation)
    
    console.log('Connected to server with connection ID:', connection.connectionId)
    
    // Use the activation augmentation to search the server
    console.log('Using activation to search server for "machine learning"...')
    const serverSearchAction = activation.triggerAction('searchServer', {
      connectionId: connection.connectionId,
      query: 'machine learning',
      limit: 5
    })
    
    if (serverSearchAction.success) {
      // The data property contains a promise that will resolve to the search results
      const serverSearchResult = await serverSearchAction.data
      console.log('Server search results:', serverSearchResult)
    } else {
      console.error('Server search action failed:', serverSearchAction.error)
    }
    
    // Use the activation augmentation to search locally
    console.log('Using activation to search local database for "machine learning"...')
    const localSearchAction = activation.triggerAction('searchLocal', {
      query: 'machine learning',
      limit: 5
    })
    
    if (localSearchAction.success) {
      const localSearchResult = await localSearchAction.data
      console.log('Local search results:', localSearchResult)
    } else {
      console.error('Local search action failed:', localSearchAction.error)
    }
    
    // Use the activation augmentation to perform a combined search
    console.log('Using activation to perform combined search for "neural networks"...')
    const combinedSearchAction = activation.triggerAction('searchCombined', {
      connectionId: connection.connectionId,
      query: 'neural networks',
      limit: 5
    })
    
    if (combinedSearchAction.success) {
      const combinedSearchResult = await combinedSearchAction.data
      console.log('Combined search results:', combinedSearchResult)
    } else {
      console.error('Combined search action failed:', combinedSearchAction.error)
    }
    
    // Use the activation augmentation to add data to both local and server
    console.log('Using activation to add data to both local and server...')
    const addAction = activation.triggerAction('addToBoth', {
      connectionId: connection.connectionId,
      data: 'Deep learning is a subset of machine learning',
      metadata: {
        noun: NounType.Concept,
        category: 'AI',
        tags: ['deep learning', 'neural networks']
      }
    })
    
    if (addAction.success) {
      const addResult = await addAction.data
      console.log('Added data with ID:', addResult)
    } else {
      console.error('Add action failed:', addAction.error)
    }
    
  } catch (error) {
    console.error('Example 2 failed:', error)
  }
}

/**
 * Example 3: Using the augmentation pipeline
 * 
 * This example demonstrates how to use the augmentation pipeline
 * to execute the conduit and activation augmentations.
 */
async function example3() {
  console.log('\nExample 3: Using the augmentation pipeline')
  
  try {
    // Create the augmentations and connect to the server
    const { conduit, activation, connection } = await createServerSearchAugmentations(
      'wss://your-brainy-server.com/ws',
      { protocols: 'brainy-sync' }
    )
    
    // Register the augmentations with the pipeline
    augmentationPipeline.register(conduit)
    augmentationPipeline.register(activation)
    
    console.log('Connected to server with connection ID:', connection.connectionId)
    
    // Use the augmentation pipeline to search the server
    console.log('Using pipeline to search server...')
    const conduitResults = await augmentationPipeline.executeConduitPipeline(
      'searchServer',
      [connection.connectionId, 'machine learning', 5]
    )
    
    if (conduitResults.length > 0 && (await conduitResults[0]).success) {
      console.log('Server search results:', (await conduitResults[0]).data)
    } else {
      console.error('Server search failed')
    }
    
    // Use the augmentation pipeline to trigger the search action
    console.log('Using pipeline to trigger search action...')
    const activationResults = await augmentationPipeline.executeActivationPipeline(
      'triggerAction',
      ['searchLocal', { query: 'machine learning', limit: 5 }]
    )
    
    if (activationResults.length > 0 && (await activationResults[0]).success) {
      const actionResult = (await activationResults[0]).data
      if (actionResult.success) {
        const searchResult = await actionResult.data
        console.log('Local search results:', searchResult)
      }
    } else {
      console.error('Search action failed')
    }
    
  } catch (error) {
    console.error('Example 3 failed:', error)
  }
}

/**
 * Example 4: Creating and using the augmentations manually
 * 
 * This example demonstrates how to create and use the augmentations
 * without using the factory function.
 */
async function example4() {
  console.log('\nExample 4: Creating and using the augmentations manually')
  
  try {
    // Create a local Brainy instance
    const localDb = new BrainyData()
    await localDb.init()
    
    // Create the conduit augmentation
    const conduit = new ServerSearchConduitAugmentation('manual-server-search-conduit')
    conduit.setLocalDb(localDb)
    await conduit.initialize()
    
    // Create the activation augmentation
    const activation = new ServerSearchActivationAugmentation('manual-server-search-activation')
    activation.setConduitAugmentation(conduit)
    await activation.initialize()
    
    // Register the augmentations with the pipeline
    augmentationPipeline.register(conduit)
    augmentationPipeline.register(activation)
    
    // Connect to the server
    console.log('Connecting to server...')
    const connectionResult = await conduit.establishConnection(
      'wss://your-brainy-server.com/ws',
      { protocols: 'brainy-sync' }
    )
    
    if (!connectionResult.success || !connectionResult.data) {
      throw new Error(`Failed to connect to server: ${connectionResult.error}`)
    }
    
    const connection = connectionResult.data
    console.log('Connected to server with connection ID:', connection.connectionId)
    
    // Store the connection in the activation augmentation
    activation.storeConnection(connection.connectionId, connection)
    
    // Search the server
    console.log('Searching server for "machine learning"...')
    const serverSearchResult = await conduit.searchServer(
      connection.connectionId,
      'machine learning',
      5
    )
    
    if (serverSearchResult.success) {
      console.log('Server search results:', serverSearchResult.data)
    } else {
      console.error('Server search failed:', serverSearchResult.error)
    }
    
  } catch (error) {
    console.error('Example 4 failed:', error)
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  // Initialize the augmentation pipeline
  await augmentationPipeline.initialize()
  
  // Run the examples
  await example1()
  await example2()
  await example3()
  await example4()
  
  // Shut down the augmentation pipeline
  await augmentationPipeline.shutDown()
}

// Run the examples
// runExamples().catch(console.error)

// Export for use in other modules
export { 
  example1, 
  example2, 
  example3, 
  example4, 
  runExamples 
}
