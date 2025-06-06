/**
 * Conduit Augmentation Example
 * 
 * This example demonstrates how to use the conduit augmentations to sync Brainy instances:
 * 
 * - WebSocket Conduit: For syncing between browsers and servers, or between servers.
 *   WebSockets cannot be used for direct browser-to-browser communication without a server in the middle.
 * 
 * - WebRTC Conduit: For direct peer-to-peer syncing between browsers.
 *   This is the recommended approach for browser-to-browser communication.
 */

import { 
  BrainyData, 
  augmentationPipeline, 
  createConduitAugmentation,
  NounType,
  VerbType
} from '@soulcraft/brainy';

/**
 * Example of using WebSocket conduit augmentation to sync Brainy instances
 */
async function webSocketSyncExample() {
  console.log('Starting WebSocket sync example...');

  // Create and initialize the database
  const db = new BrainyData();
  await db.init();

  // Create a WebSocket conduit augmentation
  const wsConduit = await createConduitAugmentation('websocket', 'websocket-sync-example');

  // Register the augmentation with the pipeline
  augmentationPipeline.register(wsConduit);

  // Add some data to the local database
  const catId = await db.add("Cats are independent pets", {
    noun: NounType.Thing,
    category: 'animal'
  });

  const dogId = await db.add("Dogs are loyal companions", {
    noun: NounType.Thing,
    category: 'animal'
  });

  // Add a relationship between items
  await db.addVerb(catId, dogId, undefined, {
    type: VerbType.RelatedTo,
    metadata: {
      description: 'Both are common household pets'
    }
  });

  console.log('Added sample data to local database');

  try {
    // Connect to another Brainy instance (server or browser)
    // Note: You need to have a WebSocket server running at this URL
    const connectionResult = await augmentationPipeline.executeConduitPipeline(
      'establishConnection',
      ['wss://your-websocket-server.com/brainy-sync', { protocols: 'brainy-sync' }]
    );

    if (connectionResult[0] && (await connectionResult[0]).success) {
      const connection = (await connectionResult[0]).data;
      console.log('Connected to remote Brainy instance:', connection.url);

      // Read data from the remote instance
      const readResult = await augmentationPipeline.executeConduitPipeline(
        'readData',
        [{ connectionId: connection.connectionId, query: { type: 'getAllNouns' } }]
      );

      // Process and add the received data to the local instance
      if (readResult[0] && (await readResult[0]).success) {
        const remoteNouns = (await readResult[0]).data;
        console.log(`Received ${remoteNouns.length} nouns from remote instance`);

        for (const noun of remoteNouns) {
          await db.add(noun.vector, noun.metadata);
        }

        console.log('Added remote nouns to local database');
      }

      // Set up real-time sync by monitoring the stream
      await wsConduit.monitorStream(connection.connectionId, async (data) => {
        console.log('Received data from stream:', data.type);

        // Handle incoming data (e.g., new nouns, verbs, updates)
        if (data.type === 'newNoun') {
          await db.add(data.vector, data.metadata);
          console.log('Added new noun from remote instance:', data.id);
        } else if (data.type === 'newVerb') {
          await db.addVerb(data.sourceId, data.targetId, data.vector, data.options);
          console.log('Added new verb from remote instance:', data.id);
        }
      });

      // Add a new noun and send it to the remote instance
      const birdId = await db.add("Birds are fascinating creatures", {
        noun: NounType.Thing,
        category: 'animal'
      });

      const birdData = await db.get(birdId);

      // Send the new noun to the remote instance
      await augmentationPipeline.executeConduitPipeline(
        'writeData',
        [
          { 
            connectionId: connection.connectionId, 
            data: { 
              type: 'newNoun',
              id: birdId,
              vector: birdData.vector,
              metadata: birdData.metadata
            } 
          }
        ]
      );

      console.log('Sent new noun to remote instance:', birdId);

      // Close the connection when done
      await wsConduit.closeWebSocket(connection.connectionId);
      console.log('Closed connection to remote instance');
    } else {
      console.error('Failed to connect to remote instance');
    }
  } catch (error) {
    console.error('Error in WebSocket sync example:', error);
  }
}

/**
 * Example of using WebRTC conduit augmentation for peer-to-peer sync
 */
async function webRTCSyncExample() {
  console.log('Starting WebRTC sync example...');

  // Create and initialize the database
  const db = new BrainyData();
  await db.init();

  // Create a WebRTC conduit augmentation
  const webrtcConduit = await createConduitAugmentation('webrtc', 'webrtc-sync-example');

  // Register the augmentation with the pipeline
  augmentationPipeline.register(webrtcConduit);

  try {
    // Connect to a peer using a signaling server
    // Note: You need to have a signaling server running and another peer to connect to
    const connectionResult = await augmentationPipeline.executeConduitPipeline(
      'establishConnection',
      [
        'peer-id-to-connect-to', 
        { 
          signalServerUrl: 'wss://your-signal-server.com',
          localPeerId: 'my-peer-id',
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        }
      ]
    );

    if (connectionResult[0] && (await connectionResult[0]).success) {
      const connection = (await connectionResult[0]).data;
      console.log('Connected to peer:', connection.url);

      // Set up real-time sync by monitoring the stream
      await webrtcConduit.monitorStream(connection.connectionId, async (data) => {
        console.log('Received data from peer:', data.type);

        // Handle incoming data (e.g., new nouns, verbs, updates)
        if (data.type === 'newNoun') {
          await db.add(data.vector, data.metadata);
          console.log('Added new noun from peer:', data.id);
        } else if (data.type === 'newVerb') {
          await db.addVerb(data.sourceId, data.targetId, data.vector, data.options);
          console.log('Added new verb from peer:', data.id);
        }
      });

      // Add a new noun and send it to the peer
      const fishId = await db.add("Fish are aquatic animals", {
        noun: NounType.Thing,
        category: 'animal'
      });

      const fishData = await db.get(fishId);

      // Send the new noun to the peer
      await augmentationPipeline.executeConduitPipeline(
        'writeData',
        [
          { 
            connectionId: connection.connectionId, 
            data: { 
              type: 'newNoun',
              id: fishId,
              vector: fishData.vector,
              metadata: fishData.metadata
            } 
          }
        ]
      );

      console.log('Sent new noun to peer:', fishId);

      // Close the connection when done
      await webrtcConduit.closeWebSocket(connection.connectionId);
      console.log('Closed connection to peer');
    } else {
      console.error('Failed to connect to peer');
    }
  } catch (error) {
    console.error('Error in WebRTC sync example:', error);
  }
}

// Run the examples
async function runExamples() {
  try {
    await webSocketSyncExample();
    console.log('\n-----------------------------------\n');
    await webRTCSyncExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

runExamples();
