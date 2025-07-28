/**
 * Example script demonstrating how to use the flushStatistics method
 * to ensure statistics are up-to-date after inserting data.
 */

import { BrainyData } from '@soulcraft/brainy';

// Create a new BrainyData instance
const brainyDb = new BrainyData({
  dimensions: 384,
  storage: 'memory' // Use memory storage for this example
});

// Initialize the database
await brainyDb.init();

// Function to display statistics
async function displayStats() {
  const stats = await brainyDb.getStatistics();
  console.log('Statistics:');
  console.log(`- Noun count: ${stats.nounCount}`);
  console.log(`- Verb count: ${stats.verbCount}`);
  console.log(`- Metadata count: ${stats.metadataCount}`);
  console.log(`- HNSW index size: ${stats.hnswIndexSize}`);
  console.log('');
}

// Display initial statistics
console.log('Initial statistics:');
await displayStats();

// Insert some data
console.log('Inserting data...');
const vectors = [];
for (let i = 0; i < 100; i++) {
  // Create a random vector
  const vector = Array.from({ length: 384 }, () => Math.random());
  vectors.push({
    vectorOrData: vector,
    metadata: { id: `item-${i}`, name: `Item ${i}` }
  });
}

// Add the vectors in batch
await brainyDb.addBatch(vectors);
console.log('Data inserted.');

// Display statistics without flushing
console.log('Statistics after insertion (without flushing):');
await displayStats();

// Flush statistics to ensure they're up-to-date
console.log('Flushing statistics...');
await brainyDb.flushStatistics();
console.log('Statistics flushed.');

// Display statistics after flushing
console.log('Statistics after flushing:');
await displayStats();

// Shut down the database (this will also flush statistics)
console.log('Shutting down database...');
await brainyDb.shutDown();
console.log('Database shut down.');

/**
 * Expected output:
 * 
 * Initial statistics:
 * Statistics:
 * - Noun count: 0
 * - Verb count: 0
 * - Metadata count: 0
 * - HNSW index size: 0
 * 
 * Inserting data...
 * Data inserted.
 * 
 * Statistics after insertion (without flushing):
 * Statistics:
 * - Noun count: 100
 * - Verb count: 0
 * - Metadata count: 100
 * - HNSW index size: 100
 * 
 * Flushing statistics...
 * Statistics flushed.
 * 
 * Statistics after flushing:
 * Statistics:
 * - Noun count: 100
 * - Verb count: 0
 * - Metadata count: 100
 * - HNSW index size: 100
 * 
 * Shutting down database...
 * Database shut down.
 */