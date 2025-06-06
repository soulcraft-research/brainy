// Browser-Server Search Example
// This example demonstrates how to use Brainy in a browser, call a server-hosted version for search,
// store the results locally, and then perform further searches against the local instance.

import { 
  BrainyData, 
  augmentationPipeline, 
  createConduitAugmentation,
  NounType
} from '@soulcraft/brainy';

/**
 * BrainyServerSearch class
 * Provides functionality to search a server-hosted Brainy instance and store results locally
 */
class BrainyServerSearch {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.localDb = null;
    this.wsConduit = null;
    this.connection = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the local Brainy instance and connect to the server
   */
  async init() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize local Brainy instance
      this.localDb = new BrainyData();
      await this.localDb.init();
      
      // Create a WebSocket conduit augmentation
      this.wsConduit = await createConduitAugmentation('websocket', 'server-search-conduit');
      
      // Register the augmentation with the pipeline
      augmentationPipeline.register(this.wsConduit);
      
      // Connect to the server
      const connectionResult = await augmentationPipeline.executeConduitPipeline(
        'establishConnection',
        [this.serverUrl, { protocols: 'brainy-sync' }]
      );
      
      if (connectionResult[0] && (await connectionResult[0]).success) {
        this.connection = (await connectionResult[0]).data;
        console.log('Connected to server:', this.serverUrl);
        this.isInitialized = true;
      } else {
        throw new Error('Failed to connect to server');
      }
    } catch (error) {
      console.error('Failed to initialize BrainyServerSearch:', error);
      throw error;
    }
  }

  /**
   * Search the server-hosted Brainy instance, store results locally, and return them
   * @param {string} query - The search query
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Array>} - Search results
   */
  async searchServer(query, limit = 10) {
    await this.ensureInitialized();
    
    try {
      // Create a search request
      const readResult = await augmentationPipeline.executeConduitPipeline(
        'readData',
        [{
          connectionId: this.connection.connectionId,
          query: {
            type: 'search',
            query: query,
            limit: limit
          }
        }]
      );
      
      if (readResult[0] && (await readResult[0]).success) {
        const searchResults = (await readResult[0]).data;
        
        // Store the results in the local Brainy instance
        for (const result of searchResults) {
          // Check if the noun already exists in the local database
          const existingNoun = await this.localDb.get(result.id);
          
          if (!existingNoun) {
            // Add the noun to the local database
            await this.localDb.add(result.vector, result.metadata);
          }
        }
        
        return searchResults;
      } else {
        const error = readResult[0] ? (await readResult[0]).error : 'Unknown error';
        throw new Error(`Failed to search server: ${error}`);
      }
    } catch (error) {
      console.error('Error searching server:', error);
      throw error;
    }
  }

  /**
   * Search the local Brainy instance
   * @param {string} query - The search query
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Array>} - Search results
   */
  async searchLocal(query, limit = 10) {
    await this.ensureInitialized();
    
    try {
      return await this.localDb.searchText(query, limit);
    } catch (error) {
      console.error('Error searching local database:', error);
      throw error;
    }
  }

  /**
   * Search both server and local instances, combine results, and store server results locally
   * @param {string} query - The search query
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Array>} - Combined search results
   */
  async searchCombined(query, limit = 10) {
    await this.ensureInitialized();
    
    try {
      // Search local first
      const localResults = await this.searchLocal(query, limit);
      
      // If we have enough local results, return them
      if (localResults.length >= limit) {
        return localResults;
      }
      
      // Otherwise, search server for additional results
      const serverResults = await this.searchServer(query, limit - localResults.length);
      
      // Combine results, removing duplicates
      const combinedResults = [...localResults];
      const localIds = new Set(localResults.map(r => r.id));
      
      for (const result of serverResults) {
        if (!localIds.has(result.id)) {
          combinedResults.push(result);
        }
      }
      
      return combinedResults;
    } catch (error) {
      console.error('Error performing combined search:', error);
      throw error;
    }
  }

  /**
   * Add data to both local and server instances
   * @param {string|Array} data - Text or vector to add
   * @param {Object} metadata - Metadata for the data
   * @returns {Promise<string>} - ID of the added data
   */
  async add(data, metadata = {}) {
    await this.ensureInitialized();
    
    try {
      // Add to local first
      const id = await this.localDb.add(data, metadata);
      
      // Get the vector and metadata
      const noun = await this.localDb.get(id);
      
      // Add to server
      await augmentationPipeline.executeConduitPipeline(
        'writeData',
        [{
          connectionId: this.connection.connectionId,
          data: {
            type: 'addNoun',
            vector: noun.vector,
            metadata: noun.metadata
          }
        }]
      );
      
      return id;
    } catch (error) {
      console.error('Error adding data:', error);
      throw error;
    }
  }

  /**
   * Ensure the instance is initialized
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  /**
   * Close the connection to the server
   */
  async close() {
    if (this.connection) {
      try {
        await this.wsConduit.closeWebSocket(this.connection.connectionId);
        this.connection = null;
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
    
    this.isInitialized = false;
  }
}

// Example usage
async function runExample() {
  // Create a BrainyServerSearch instance
  const brainySearch = new BrainyServerSearch('wss://your-brainy-server.com/ws');
  
  try {
    // Initialize
    await brainySearch.init();
    
    // Search the server and store results locally
    console.log('Searching server for "machine learning"...');
    const serverResults = await brainySearch.searchServer('machine learning', 5);
    console.log('Server results:', serverResults);
    
    // Now search locally - this should return the results we just stored
    console.log('Searching local database for "machine learning"...');
    const localResults = await brainySearch.searchLocal('machine learning', 5);
    console.log('Local results:', localResults);
    
    // Search for something related but different
    console.log('Searching local database for "artificial intelligence"...');
    const aiResults = await brainySearch.searchLocal('artificial intelligence', 5);
    console.log('AI results:', aiResults);
    
    // Perform a combined search
    console.log('Performing combined search for "neural networks"...');
    const combinedResults = await brainySearch.searchCombined('neural networks', 5);
    console.log('Combined results:', combinedResults);
    
    // Add new data to both local and server
    console.log('Adding new data...');
    const id = await brainySearch.add('Deep learning is a subset of machine learning', {
      noun: NounType.Concept,
      category: 'AI',
      tags: ['deep learning', 'neural networks']
    });
    console.log('Added data with ID:', id);
    
    // Close the connection
    await brainySearch.close();
    
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// In a browser environment, you would call this when the page loads
// runExample();

// Export for use in other modules
export { BrainyServerSearch };
