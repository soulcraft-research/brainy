/**
 * Example: Using the FirestoreSync Conduit Augmentation
 *
 * This example demonstrates how to use the FirestoreSync augmentation
 * to sync data between Brainy and Firestore in both one-way and two-way modes.
 *
 * Prerequisites:
 * 1. Install Firebase: npm install firebase
 * 2. Set up a Firebase project and enable Firestore
 * 3. Get your Firebase configuration from the Firebase console
 */

import {
  registerAugmentation,
  initializeAugmentationPipeline,
  BrainyGraph
} from '../dist/index.js'

import {
  createFirestoreSyncAugmentation,
  FirestoreSyncConfig
} from '../dist/augmentations/firestoreSyncAugmentation.js'

// Your Firebase configuration
// Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: 'your-api-key',
  authDomain: 'your-project-id.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project-id.appspot.com',
  messagingSenderId: 'your-messaging-sender-id',
  appId: 'your-app-id'
}

// Example 1: One-way sync (Brainy -> Firestore)
async function setupOneWaySync() {
  console.log('Setting up one-way sync from Brainy to Firestore...')

  // Create the FirestoreSync augmentation with one-way sync configuration
  const oneWaySyncConfig = {
    firebaseConfig,
    nodesCollection: 'brainy_nodes',
    edgesCollection: 'brainy_edges',
    metadataCollection: 'brainy_metadata',
    syncMode: 'one-way'
  }

  // Create and register the augmentation
  const oneWaySync = createFirestoreSyncAugmentation(
    'brainy-firestore-one-way-sync',
    oneWaySyncConfig
  )

  registerAugmentation(oneWaySync)

  // Initialize the augmentation pipeline
  initializeAugmentationPipeline()

  // Initialize the augmentation
  await oneWaySync.initialize()

  console.log('One-way sync augmentation initialized successfully')

  return oneWaySync
}

// Example 2: Two-way sync (Bidirectional between Brainy and Firestore)
async function setupTwoWaySync() {
  console.log('Setting up two-way sync between Brainy and Firestore...')

  // Create the FirestoreSync augmentation with two-way sync configuration
  const twoWaySyncConfig = {
    firebaseConfig,
    nodesCollection: 'brainy_nodes',
    edgesCollection: 'brainy_edges',
    metadataCollection: 'brainy_metadata',
    syncMode: 'two-way',
    syncInterval: 30000  // Sync every 30 seconds
  }

  // Create and register the augmentation
  const twoWaySync = createFirestoreSyncAugmentation(
    'brainy-firestore-two-way-sync',
    twoWaySyncConfig
  )

  registerAugmentation(twoWaySync)

  // Initialize the augmentation pipeline
  initializeAugmentationPipeline()

  // Initialize the augmentation
  await twoWaySync.initialize()

  console.log('Two-way sync augmentation initialized successfully')

  return twoWaySync
}

// Example 3: Using the FirestoreSync augmentation with a Brainy graph
async function syncGraphToFirestore() {
  console.log('Creating a Brainy graph and syncing it to Firestore...')

  // Set up the one-way sync augmentation
  const syncAugmentation = await setupOneWaySync()

  // Create a Brainy graph
  const graph = new BrainyGraph()
  await graph.initialize()

  // Add some nodes and edges to the graph
  const node1 = await graph.addNode({
    vector: [0.1, 0.2, 0.3],
    metadata: { name: 'Node 1', description: 'First test node' }
  })

  const node2 = await graph.addNode({
    vector: [0.4, 0.5, 0.6],
    metadata: { name: 'Node 2', description: 'Second test node' }
  })

  const edge = await graph.addEdge({
    sourceId: node1.id,
    targetId: node2.id,
    type: 'related',
    weight: 0.75,
    metadata: { description: 'Test relationship' }
  })

  // Sync the nodes and edge to Firestore
  await syncAugmentation.syncNodeToFirestore(node1)
  await syncAugmentation.syncNodeToFirestore(node2)
  await syncAugmentation.syncEdgeToFirestore(edge)

  console.log('Graph data synced to Firestore successfully')

  // Clean up
  await syncAugmentation.shutDown()
  await graph.close()
}

// Example 4: Reading data from Firestore
async function readFromFirestore() {
  console.log('Reading data from Firestore...')

  // Set up the one-way sync augmentation
  const syncAugmentation = await setupOneWaySync()

  // Read all nodes from Firestore
  const nodesResponse = await syncAugmentation.readData({
    collection: 'brainy_nodes'
  })

  if (nodesResponse.success) {
    console.log(`Found ${nodesResponse.data.length} nodes in Firestore`)
    console.log('First node:', nodesResponse.data[0])
  } else {
    console.error('Failed to read nodes:', nodesResponse.error)
  }

  // Read a specific edge by ID
  const edgeResponse = await syncAugmentation.readData({
    collection: 'brainy_edges',
    id: 'some-edge-id'  // Replace with an actual edge ID
  })

  if (edgeResponse.success) {
    console.log('Edge data:', edgeResponse.data)
  } else {
    console.error('Failed to read edge:', edgeResponse.error)
  }

  // Clean up
  await syncAugmentation.shutDown()
}

// Example 5: Writing data to Firestore
async function writeToFirestore() {
  console.log('Writing data to Firestore...')

  // Set up the one-way sync augmentation
  const syncAugmentation = await setupOneWaySync()

  // Write a custom document to Firestore
  const writeResponse = await syncAugmentation.writeData({
    collection: 'custom_collection',
    id: 'custom-doc-1',
    document: {
      name: 'Custom Document',
      timestamp: new Date(),
      values: [1, 2, 3, 4, 5],
      nested: {
        field1: 'value1',
        field2: 'value2'
      }
    }
  })

  if (writeResponse.success) {
    console.log('Document written successfully:', writeResponse.data)
  } else {
    console.error('Failed to write document:', writeResponse.error)
  }

  // Clean up
  await syncAugmentation.shutDown()
}

// Example 6: Monitoring changes in Firestore
async function monitorFirestore() {
  console.log('Monitoring changes in Firestore...')

  // Set up the two-way sync augmentation
  const syncAugmentation = await setupTwoWaySync()

  // Monitor changes in the nodes collection
  await syncAugmentation.monitorStream('brainy_nodes', (data) => {
    console.log('Node change detected:', data)
  })

  console.log('Monitoring started. Changes will be logged as they occur.')
  console.log('Press Ctrl+C to stop monitoring.')

  // Keep the process running
  // In a real application, you would integrate this with your application lifecycle
  process.on('SIGINT', async () => {
    console.log('Stopping monitoring...')
    await syncAugmentation.shutDown()
    process.exit(0)
  })
}

// Run the examples
async function runExamples() {
  try {
    // Uncomment the example you want to run
    // await syncGraphToFirestore();
    // await readFromFirestore();
    // await writeToFirestore();
    // await monitorFirestore();

    console.log('Example completed successfully')
  } catch (error) {
    console.error('Error running example:', error)
  }
}

runExamples()
