/**
 * Sequential Pipeline Example
 * 
 * This example demonstrates how to use the sequential pipeline to process data
 * through a sequence of augmentations: ISense -> IMemory -> ICognition -> IConduit -> IActivation -> IPerception
 */

import {
  sequentialPipeline,
  registerAugmentation,
  initializeAugmentationPipeline,
  createMemoryAugmentation
} from '../dist/index.js';

// Create a simple ISense augmentation
const senseAugmentation = {
  name: 'SimpleSense',
  description: 'A simple sense augmentation for testing',
  enabled: true,
  
  async initialize() {},
  async shutDown() {},
  async getStatus() { return 'active'; },
  
  processRawData(rawData, dataType) {
    console.log(`[SimpleSense] Processing ${dataType} data: ${rawData}`);
    return {
      success: true,
      data: {
        nouns: ['example', 'test', 'data'],
        verbs: ['process', 'analyze', 'test']
      }
    };
  },
  
  async listenToFeed(feedUrl, callback) {
    console.log(`[SimpleSense] Listening to feed: ${feedUrl}`);
  }
};

// Create a simple ICognition augmentation
const cognitionAugmentation = {
  name: 'SimpleCognition',
  description: 'A simple cognition augmentation for testing',
  enabled: true,
  
  async initialize() {},
  async shutDown() {},
  async getStatus() { return 'active'; },
  
  reason(query, context) {
    console.log(`[SimpleCognition] Reasoning about: ${query}`);
    console.log(`[SimpleCognition] Context:`, context);
    return {
      success: true,
      data: {
        inference: 'This is test data that needs to be processed',
        confidence: 0.85
      }
    };
  },
  
  infer(dataSubset) {
    return {
      success: true,
      data: { result: 'inferred data' }
    };
  },
  
  executeLogic(ruleId, input) {
    return {
      success: true,
      data: true
    };
  }
};

// Create a simple IConduit augmentation
const conduitAugmentation = {
  name: 'SimpleConduit',
  description: 'A simple conduit augmentation for testing',
  enabled: true,
  
  async initialize() {},
  async shutDown() {},
  async getStatus() { return 'active'; },
  
  establishConnection(targetSystemId, config) {
    console.log(`[SimpleConduit] Establishing connection to: ${targetSystemId}`);
    return {
      success: true,
      data: { connectionId: 'test-connection' }
    };
  },
  
  readData(query, options) {
    return {
      success: true,
      data: { result: 'read data' }
    };
  },
  
  writeData(data, options) {
    console.log(`[SimpleConduit] Writing data:`, data);
    return {
      success: true,
      data: { written: true }
    };
  },
  
  async monitorStream(streamId, callback) {
    console.log(`[SimpleConduit] Monitoring stream: ${streamId}`);
  }
};

// Create a simple IActivation augmentation
const activationAugmentation = {
  name: 'SimpleActivation',
  description: 'A simple activation augmentation for testing',
  enabled: true,
  
  async initialize() {},
  async shutDown() {},
  async getStatus() { return 'active'; },
  
  triggerAction(actionName, parameters) {
    console.log(`[SimpleActivation] Triggering action: ${actionName}`);
    console.log(`[SimpleActivation] Parameters:`, parameters);
    return {
      success: true,
      data: { triggered: true }
    };
  },
  
  generateOutput(knowledgeId, format) {
    return {
      success: true,
      data: 'Generated output'
    };
  },
  
  interactExternal(systemId, payload) {
    return {
      success: true,
      data: { result: 'external interaction' }
    };
  }
};

// Create a simple IPerception augmentation
const perceptionAugmentation = {
  name: 'SimplePerception',
  description: 'A simple perception augmentation for testing',
  enabled: true,
  
  async initialize() {},
  async shutDown() {},
  async getStatus() { return 'active'; },
  
  interpret(nouns, verbs, context) {
    console.log(`[SimplePerception] Interpreting nouns:`, nouns);
    console.log(`[SimplePerception] Interpreting verbs:`, verbs);
    console.log(`[SimplePerception] Context:`, context);
    return {
      success: true,
      data: {
        interpretation: 'This is a test data sample that needs processing and analysis',
        confidence: 0.9
      }
    };
  },
  
  organize(data, criteria) {
    return {
      success: true,
      data: { organized: true }
    };
  },
  
  generateVisualization(data, visualizationType) {
    return {
      success: true,
      data: 'Visualization data'
    };
  }
};

async function runExample() {
  try {
    // Register augmentations
    registerAugmentation(senseAugmentation);
    registerAugmentation(cognitionAugmentation);
    registerAugmentation(conduitAugmentation);
    registerAugmentation(activationAugmentation);
    registerAugmentation(perceptionAugmentation);
    
    // Create and register a memory augmentation
    const memoryAugmentation = await createMemoryAugmentation('SimpleMemory', { storageType: 'memory' });
    registerAugmentation(memoryAugmentation);
    
    // Initialize the augmentation pipeline
    initializeAugmentationPipeline();
    
    // Initialize the sequential pipeline
    await sequentialPipeline.initialize();
    
    console.log('Processing data through the sequential pipeline...');
    
    // Process data through the sequential pipeline
    const result = await sequentialPipeline.processData(
      'This is a test message',
      'text'
    );
    
    console.log('\nPipeline execution result:');
    console.log('Success:', result.success);
    console.log('Data:', result.data);
    
    if (result.error) {
      console.log('Error:', result.error);
    }
    
    console.log('\nStage results:');
    for (const stage in result.stageResults) {
      console.log(`${stage}:`, result.stageResults[stage].success);
    }
    
    console.log('\nExample completed successfully!');
  } catch (error) {
    console.error('Error running example:', error);
  }
}

// Run the example
runExample();
