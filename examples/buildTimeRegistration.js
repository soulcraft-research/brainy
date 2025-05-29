/**
 * Example: Registering Augmentations at Build Time
 * 
 * This example demonstrates how to register custom augmentations at build time
 * using the Brainy library's augmentation registry system.
 */

// Import the augmentation registry and types from Brainy
import { 
  registerAugmentation, 
  AugmentationType,
  BrainyAugmentations
} from '../dist/index.js';

// Define a custom sense augmentation
class CustomTextSenseAugmentation {
  constructor() {
    this.name = 'CustomTextSenseAugmentation';
    this.enabled = true;
    this.type = AugmentationType.SENSE;
  }

  // Required IAugmentation methods
  async initialize() {
    console.log('Initializing CustomTextSenseAugmentation');
    return true;
  }

  async shutDown() {
    console.log('Shutting down CustomTextSenseAugmentation');
    return true;
  }

  getStatus() {
    return {
      name: this.name,
      enabled: this.enabled,
      type: this.type,
      status: 'ready'
    };
  }

  // ISenseAugmentation methods
  async processRawData(rawData, dataType) {
    console.log(`Processing ${dataType} data: ${rawData.substring(0, 50)}...`);
    
    // Simple implementation to extract nouns and verbs
    const words = rawData.split(' ');
    const nouns = words.filter(word => word.length > 4);
    const verbs = words.filter(word => word.endsWith('ing'));
    
    return {
      success: true,
      data: { nouns, verbs }
    };
  }

  async listenToFeed(feedUrl, callback) {
    console.log(`Listening to feed at ${feedUrl}`);
    
    // In a real implementation, this would set up a listener
    // For this example, we'll just call the callback once
    setTimeout(() => {
      callback({
        success: true,
        data: { message: 'Feed update received' }
      });
    }, 1000);
    
    return {
      success: true,
      data: { feedId: 'example-feed-1' }
    };
  }
}

// Define a custom memory augmentation
class CustomMemoryAugmentation {
  constructor() {
    this.name = 'CustomMemoryAugmentation';
    this.enabled = true;
    this.type = AugmentationType.MEMORY;
    this.storage = new Map();
  }

  // Required IAugmentation methods
  async initialize() {
    console.log('Initializing CustomMemoryAugmentation');
    return true;
  }

  async shutDown() {
    console.log('Shutting down CustomMemoryAugmentation');
    this.storage.clear();
    return true;
  }

  getStatus() {
    return {
      name: this.name,
      enabled: this.enabled,
      type: this.type,
      status: 'ready',
      itemCount: this.storage.size
    };
  }

  // IMemoryAugmentation methods
  async storeData(key, data, options = {}) {
    console.log(`Storing data with key: ${key}`);
    this.storage.set(key, data);
    
    return {
      success: true,
      data: { key }
    };
  }

  async retrieveData(key, options = {}) {
    console.log(`Retrieving data with key: ${key}`);
    const data = this.storage.get(key);
    
    return {
      success: !!data,
      data: data || null,
      error: !data ? 'Key not found' : undefined
    };
  }

  async updateData(key, data, options = {}) {
    console.log(`Updating data with key: ${key}`);
    
    if (!this.storage.has(key)) {
      return {
        success: false,
        data: null,
        error: 'Key not found'
      };
    }
    
    this.storage.set(key, data);
    
    return {
      success: true,
      data: { key }
    };
  }

  async deleteData(key, options = {}) {
    console.log(`Deleting data with key: ${key}`);
    
    const existed = this.storage.has(key);
    this.storage.delete(key);
    
    return {
      success: existed,
      data: { deleted: existed },
      error: !existed ? 'Key not found' : undefined
    };
  }

  async listDataKeys(pattern = '*', options = {}) {
    console.log(`Listing data keys with pattern: ${pattern}`);
    
    // Simple implementation that returns all keys
    // A real implementation would filter by pattern
    const keys = Array.from(this.storage.keys());
    
    return {
      success: true,
      data: { keys }
    };
  }
}

// Register the augmentations with the registry
// This will make them available to the Brainy library at runtime
const textSenseAugmentation = registerAugmentation(new CustomTextSenseAugmentation());
const memoryAugmentation = registerAugmentation(new CustomMemoryAugmentation());

console.log('Custom augmentations registered successfully');

// Export the registered augmentations for use in the application
export { textSenseAugmentation, memoryAugmentation };
