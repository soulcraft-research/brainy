/**
 * Example: Using External Augmentation Plugins with Brainy
 * 
 * This example demonstrates how to load and configure external augmentation plugins
 * with the Brainy library. It shows how to use the plugin loader to integrate
 * externally installed augmentation plugins into the Brainy system.
 */

import { 
  BrainyData, 
  configureAndStartPipeline, 
  createSensePluginConfig, 
  createConduitPluginConfig,
  AugmentationType
} from '../dist/index.js';

// Create a new BrainyData instance
const db = new BrainyData();
await db.init();

console.log('BrainyData initialized successfully');

// Configure and start the augmentation pipeline with external plugins
// Note: These are example plugin names. You would need to install these packages via npm first.
const result = await configureAndStartPipeline([
  // Sense augmentations (will be loaded first)
  createSensePluginConfig('@example/text-sense-augmentation', {
    language: 'english',
    enableNER: true
  }),
  createSensePluginConfig('@example/image-sense-augmentation', {
    modelSize: 'medium',
    detectObjects: true
  }),
  
  // Conduit augmentations for two-way synchronization
  createConduitPluginConfig('@example/websocket-conduit', {
    url: 'wss://example.com/sync',
    reconnectInterval: 5000
  }),
  createConduitPluginConfig('@example/webrtc-conduit', {
    iceServers: [{ urls: 'stun:stun.example.com:19302' }],
    peerConfig: { reliable: true }
  }),
  
  // Other augmentation types
  {
    plugin: '@example/memory-augmentation',
    config: { storageType: 'persistent' },
    type: AugmentationType.MEMORY
  }
], {
  // Optional: Customize the loading options
  useDefaultPipeline: true,  // Use the default pipeline instance
  initializeAfterLoading: true,  // Initialize augmentations after loading
  augmentationOrder: [  // Custom order (Sense first, as recommended)
    AugmentationType.SENSE,
    AugmentationType.CONDUIT,
    AugmentationType.MEMORY,
    AugmentationType.COGNITION,
    AugmentationType.PERCEPTION,
    AugmentationType.DIALOG,
    AugmentationType.ACTIVATION
  ]
});

// Check for any errors during loading
if (result.errors.length > 0) {
  console.error('Errors occurred while loading plugins:');
  result.errors.forEach(error => console.error(` - ${error.message}`));
} else {
  console.log('All plugins loaded successfully');
}

// Get the pipeline instance
const { pipeline } = result;

// Get all loaded augmentations by type
console.log('Loaded augmentations:');
for (const [type, augmentations] of result.augmentations.entries()) {
  if (augmentations.length > 0) {
    console.log(`${type}: ${augmentations.map(a => a.name).join(', ')}`);
  }
}

// Example: Using a sense augmentation to process raw data
try {
  const senseResults = await pipeline.executeSensePipeline(
    'processRawData',
    ['This is some example text to process', 'text']
  );
  
  // Process the results
  for (const resultPromise of senseResults) {
    const result = await resultPromise;
    if (result.success) {
      console.log('Processed data:', result.data);
      
      // Insert the extracted nouns and verbs into BrainyData according to graphTypes
      for (const noun of result.data.nouns) {
        await db.add(noun, { type: 'noun' });
      }
      
      for (const verb of result.data.verbs) {
        await db.add(verb, { type: 'verb' });
      }
    } else {
      console.error('Error processing data:', result.error);
    }
  }
} catch (error) {
  console.error('Error executing sense pipeline:', error);
}

// Example: Using a conduit augmentation for two-way synchronization
try {
  // Establish a connection
  const connectionResults = await pipeline.executeConduitPipeline(
    'establishConnection',
    ['external-system', { apiKey: 'your-api-key' }]
  );
  
  // Process the results
  for (const resultPromise of connectionResults) {
    const result = await resultPromise;
    if (result.success) {
      console.log('Connection established:', result.data);
      
      // Read data from the external system
      const readResults = await pipeline.executeConduitPipeline(
        'readData',
        [{ query: 'get-latest-data' }]
      );
      
      // Process the read results
      for (const readResultPromise of readResults) {
        const readResult = await readResultPromise;
        if (readResult.success) {
          console.log('Data read from external system:', readResult.data);
          
          // Write data to the external system
          await pipeline.executeConduitPipeline(
            'writeData',
            [{ updatedData: 'example' }]
          );
        }
      }
    } else {
      console.error('Error establishing connection:', result.error);
    }
  }
} catch (error) {
  console.error('Error executing conduit pipeline:', error);
}

// Shut down the pipeline when done
await pipeline.shutDown();
console.log('Pipeline shut down successfully');
