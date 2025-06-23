/**
 * Simplified Augmentations Example
 *
 * This example demonstrates how to use the simplified augmentation factory and streamlined pipeline
 * to create, import, and execute augmentations for both static and streaming data.
 */

import {
  // Augmentation factory
  createMemoryAugmentation,
  createConduitAugmentation,
  createSenseAugmentation,
  addWebSocketSupport,
  loadAugmentationModule,

  // Streamlined pipeline
  processStaticData,
  processStreamingData,
  createPipeline,
  createStreamingPipeline,
  executeStreamlined,
  executeByType,
  executeSingle,
  StreamlinedExecutionMode,

  // Core types
  AugmentationType
} from '../src/index.js'

/**
 * Example 1: Creating a simple memory augmentation
 */
async function example1() {
  console.log('Example 1: Creating a simple memory augmentation')

  // Create a memory augmentation with the factory
  const memoryAug = createMemoryAugmentation({
    name: 'simple-memory',
    description: 'A simple in-memory storage augmentation',
    autoRegister: true,
    autoInitialize: true,

    // Implement the required methods
    storeData: async (key, data) => {
      console.log(`Storing data for key: ${key}`)
      // In a real implementation, you would store the data somewhere
      return {
        success: true,
        data: true
      }
    },

    retrieveData: async (key) => {
      console.log(`Retrieving data for key: ${key}`)
      // In a real implementation, you would retrieve the data from storage
      return {
        success: true,
        data: { example: 'data', key }
      }
    }
  })

  // Use the augmentation directly
  const storeResult = await executeSingle(memoryAug, 'storeData', 'test-key', {
    value: 'test-value'
  })
  console.log('Store result:', storeResult)

  const retrieveResult = await executeSingle(
    memoryAug,
    'retrieveData',
    'test-key'
  )
  console.log('Retrieve result:', retrieveResult)

  console.log('-----------------------------------')
}

/**
 * Example 2: Creating a WebSocket-enabled conduit augmentation
 */
async function example2() {
  console.log('Example 2: Creating a WebSocket-enabled conduit augmentation')

  // Create a basic conduit augmentation
  const conduitAug = createConduitAugmentation({
    name: 'simple-conduit',
    description: 'A simple conduit augmentation',

    // Implement the required methods
    readData: async (query) => {
      console.log(`Reading data with query:`, query)
      return {
        success: true,
        data: { result: 'some data' }
      }
    },

    writeData: async (data) => {
      console.log(`Writing data:`, data)
      return {
        success: true,
        data: { written: true }
      }
    }
  })

  // Add WebSocket support to the conduit augmentation
  const wsConduitAug = addWebSocketSupport(conduitAug, {
    connectWebSocket: async (url) => {
      console.log(`Connecting to WebSocket at ${url}`)
      // In a real implementation, you would establish a WebSocket connection
      return {
        connectionId: 'ws-1',
        url,
        status: 'connected'
      }
    },

    sendWebSocketMessage: async (connectionId, data) => {
      console.log(`Sending message on connection ${connectionId}:`, data)
      // In a real implementation, you would send the message over the WebSocket
    }
  })

  // Use the WebSocket-enabled augmentation
  const connectResult = await executeSingle(
    wsConduitAug,
    'connectWebSocket',
    'wss://example.com'
  )
  console.log('Connect result:', connectResult)

  await executeSingle(wsConduitAug, 'sendWebSocketMessage', 'ws-1', {
    type: 'hello'
  })

  console.log('-----------------------------------')
}

/**
 * Example 3: Processing static data through a pipeline
 */
async function example3() {
  console.log('Example 3: Processing static data through a pipeline')

  // Create a sense augmentation for processing raw data
  const senseAug = createSenseAugmentation({
    name: 'text-processor',
    description: 'Processes text into nouns and verbs',

    processRawData: (rawData, dataType) => {
      if (dataType !== 'text') {
        return {
          success: false,
          data: { nouns: [], verbs: [] },
          error: `Unsupported data type: ${dataType}`
        }
      }

      const text = rawData.toString()
      console.log(`Processing text: ${text}`)

      // Simple example - in a real implementation, you would use NLP
      const words = text.split(' ')
      const nouns = words.filter((w) => w.length > 4)
      const verbs = words.filter((w) => w.length <= 4)

      return {
        success: true,
        data: { nouns, verbs }
      }
    }
  })

  // Create a perception augmentation for interpreting the processed data
  const perceptionAug = createMemoryAugmentation({
    name: 'text-interpreter',
    description: 'Interprets processed text data',

    storeData: async (key, data) => {
      console.log(`Interpreting data:`, data)

      // Simple example - in a real implementation, you would do more sophisticated interpretation
      return {
        success: true,
        data: {
          interpreted: true,
          nounCount: data.nouns.length,
          verbCount: data.verbs.length,
          summary: `Found ${data.nouns.length} nouns and ${data.verbs.length} verbs`
        }
      }
    }
  })

  // Process static data through a pipeline
  const result = await processStaticData(
    'This is an example text for processing through the pipeline',
    [
      {
        augmentation: senseAug,
        method: 'processRawData',
        transformArgs: (data) => [data, 'text']
      },
      {
        augmentation: perceptionAug,
        method: 'storeData',
        transformArgs: (data) => ['processed-text', data]
      }
    ]
  )

  console.log('Pipeline result:', result)

  // Create a reusable pipeline
  const textPipeline = createPipeline([
    {
      augmentation: senseAug,
      method: 'processRawData',
      transformArgs: (data) => [data, 'text']
    },
    {
      augmentation: perceptionAug,
      method: 'storeData',
      transformArgs: (data) => ['processed-text', data]
    }
  ])

  // Use the reusable pipeline
  const result2 = await textPipeline(
    'Another example text for the reusable pipeline'
  )
  console.log('Reusable pipeline result:', result2)

  console.log('-----------------------------------')
}

/**
 * Example 4: Processing streaming data
 */
async function example4() {
  console.log('Example 4: Processing streaming data')

  // Create a sense augmentation that can listen to a data feed
  const streamingSenseAug = createSenseAugmentation({
    name: 'stream-processor',
    description: 'Processes streaming data',

    listenToFeed: async (feedUrl, callback) => {
      console.log(`Listening to feed at ${feedUrl}`)

      // Simulate streaming data with setInterval
      const interval = setInterval(() => {
        const timestamp = new Date().toISOString()
        console.log(`Received data from feed at ${timestamp}`)

        // Send data to the callback
        callback({
          nouns: [`data-${Date.now()}`, 'stream', 'example'],
          verbs: ['is', 'runs', 'processes']
        })
      }, 2000)

      // In a real implementation, you would return a way to stop the stream
      // For this example, we'll stop after 3 iterations
      setTimeout(() => {
        clearInterval(interval)
        console.log('Stream ended')
      }, 7000)
    }
  })

  // Create a perception augmentation for processing the streaming data
  const streamingPerceptionAug = createMemoryAugmentation({
    name: 'stream-interpreter',
    description: 'Interprets streaming data',

    storeData: async (key, data) => {
      console.log(`Processing streaming data:`, data)

      return {
        success: true,
        data: {
          processed: true,
          timestamp: new Date().toISOString(),
          nounCount: data.nouns.length,
          verbCount: data.verbs.length
        }
      }
    }
  })

  // Set up a streaming pipeline
  await processStreamingData(
    streamingSenseAug,
    'listenToFeed',
    ['http://example.com/data-feed'],
    [
      {
        augmentation: streamingPerceptionAug,
        method: 'storeData',
        transformArgs: (data) => [`stream-${Date.now()}`, data]
      }
    ],
    (result) => {
      console.log('Streaming pipeline result:', result)
    }
  )

  // Wait for the streaming example to complete
  await new Promise((resolve) => setTimeout(resolve, 8000))

  console.log('-----------------------------------')
}

/**
 * Example 5: Dynamic loading of augmentations
 */
async function example5() {
  console.log('Example 5: Dynamic loading of augmentations')

  // Simulate dynamic loading of a module
  // In a real application, you would use dynamic import()
  const mockModulePromise = Promise.resolve({
    dynamicMemoryAug: createMemoryAugmentation({
      name: 'dynamic-memory',
      description: 'Dynamically loaded memory augmentation',

      storeData: async (key, data) => {
        console.log(`[Dynamic] Storing data for key: ${key}`)
        return {
          success: true,
          data: true
        }
      },

      retrieveData: async (key) => {
        console.log(`[Dynamic] Retrieving data for key: ${key}`)
        return {
          success: true,
          data: { dynamic: true, key }
        }
      }
    })
  })

  // Load the augmentations from the module
  const loadedAugmentations = await loadAugmentationModule(mockModulePromise, {
    autoRegister: true,
    autoInitialize: true
  })

  console.log(`Loaded ${loadedAugmentations.length} augmentations dynamically`)

  // Use the dynamically loaded augmentation
  if (loadedAugmentations.length > 0) {
    const dynamicAug = loadedAugmentations[0]
    console.log(`Using dynamically loaded augmentation: ${dynamicAug.name}`)

    const retrieveResult = await executeSingle(
      dynamicAug,
      'retrieveData',
      'dynamic-key'
    )
    console.log('Dynamic retrieve result:', retrieveResult)
  }

  console.log('-----------------------------------')
}

/**
 * Run all demo
 */
async function runExamples() {
  try {
    await example1()
    await example2()
    await example3()
    await example4()
    await example5()

    console.log('All demo completed successfully!')
  } catch (error) {
    console.error('Error running demo:', error)
  }
}

// Run the demo
runExamples()
