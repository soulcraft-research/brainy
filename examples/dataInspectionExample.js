/**
 * Data Inspection Example
 * 
 * This example demonstrates how to view and inspect the data stored in Brainy
 * to verify it's working correctly.
 */

import { BrainyData, createSimpleEmbeddingFunction } from '../dist/index.js';

async function runExample() {
  try {
    console.log('Brainy Data Inspection Example');
    console.log('==============================\n');

    // Create a new Brainy database with a simple embedding function
    console.log('Creating and initializing Brainy database...');
    const simpleEmbedding = createSimpleEmbeddingFunction();
    const db = new BrainyData({
      embeddingFunction: simpleEmbedding
    });
    await db.init();
    console.log('Database initialized successfully!\n');

    // Add sample data - using text that will be automatically embedded to vectors
    console.log('Adding sample data to the database...');
    const catId = await db.add("Cat is a small domesticated carnivorous mammal", { type: 'mammal', name: 'cat' });
    const dogId = await db.add("Dog is a domesticated carnivore of the family Canidae", { type: 'mammal', name: 'dog' });
    const fishId = await db.add("Fish are aquatic animals that live in water", { type: 'fish', name: 'fish' });

    // Add more text data
    const lionDescId = await db.add("Lions are large cats with a golden mane", { type: 'mammal', name: 'lion' });
    const tigerDescId = await db.add("Tigers are large cats with striped fur", { type: 'mammal', name: 'tiger' });

    // Add an edge between cat and lion (they're related)
    const edgeId = await db.addEdge(catId, lionDescId, undefined, { 
      type: 'related', 
      weight: 0.8,
      metadata: { relationship: 'same family' }
    });

    console.log('Sample data added successfully!\n');

    // Method 1: Check database status
    console.log('Method 1: Check Database Status');
    console.log('-------------------------------');
    const status = await db.status();
    console.log('Storage Type:', status.type);
    console.log('Used Space:', status.used, 'bytes');
    console.log('Storage Quota:', status.quota, 'bytes');
    console.log('Number of Items:', db.size());
    console.log('Additional Details:', JSON.stringify(status.details, null, 2));
    console.log();

    // Method 2: Retrieve specific items by ID
    console.log('Method 2: Retrieve Specific Items by ID');
    console.log('--------------------------------------');
    const cat = await db.get(catId);
    console.log('Cat Item:');
    console.log('- ID:', cat.id);
    console.log('- Vector:', cat.vector);
    console.log('- Metadata:', JSON.stringify(cat.metadata, null, 2));
    console.log();

    // Method 3: Search for similar items
    console.log('Method 3: Search for Similar Items');
    console.log('----------------------------------');
    const searchResults = await db.search("cat", 3);
    console.log('Search Results:');
    searchResults.forEach((result, index) => {
      console.log(`Result ${index + 1}:`);
      console.log('- ID:', result.id);
      console.log('- Score:', result.score);
      console.log('- Metadata:', JSON.stringify(result.metadata, null, 2));
    });
    console.log();

    // Method 4: Text search
    console.log('Method 4: Text Search');
    console.log('--------------------');
    const textResults = await db.searchText('cat', 2);
    console.log('Text Search Results:');
    textResults.forEach((result, index) => {
      console.log(`Result ${index + 1}:`);
      console.log('- ID:', result.id);
      console.log('- Score:', result.score);
      console.log('- Metadata:', JSON.stringify(result.metadata, null, 2));
    });
    console.log();

    // Method 5: Get all edges
    console.log('Method 5: Get All Edges');
    console.log('----------------------');
    const allEdges = await db.getAllEdges();
    console.log('All Edges:');
    allEdges.forEach((edge, index) => {
      console.log(`Edge ${index + 1}:`);
      console.log('- ID:', edge.id);
      console.log('- Source ID:', edge.sourceId);
      console.log('- Target ID:', edge.targetId);
      console.log('- Type:', edge.type);
      console.log('- Weight:', edge.weight);
      console.log('- Metadata:', JSON.stringify(edge.metadata, null, 2));
    });
    console.log();

    // Method 6: Get edges by source
    console.log('Method 6: Get Edges by Source');
    console.log('----------------------------');
    const catEdges = await db.getEdgesBySource(catId);
    console.log(`Edges from Cat (${catId}):`);
    catEdges.forEach((edge, index) => {
      console.log(`Edge ${index + 1}:`);
      console.log('- ID:', edge.id);
      console.log('- Target ID:', edge.targetId);
      console.log('- Type:', edge.type);
    });
    console.log();

    // Method 7: Advanced search with noun types and verbs
    console.log('Method 7: Advanced Search with Noun Types and Verbs');
    console.log('--------------------------------------------------');
    const advancedResults = await db.search("cat", 3, {
      nounTypes: ['mammal'],
      includeVerbs: true
    });
    console.log('Advanced Search Results:');
    advancedResults.forEach((result, index) => {
      console.log(`Result ${index + 1}:`);
      console.log('- ID:', result.id);
      console.log('- Score:', result.score);
      console.log('- Metadata:', JSON.stringify(result.metadata, null, 2));
      if (result.metadata && result.metadata.associatedVerbs) {
        console.log('- Associated Verbs:', result.metadata.associatedVerbs.length);
      }
    });
    console.log();

    console.log('Example completed successfully!');
  } catch (error) {
    console.error('Error running example:', error);
  }
}

// Run the example
runExample();
