// Configuration Test Script
// This script tests the automatic configuration detection features of the library

const { BrainyData } = require('../dist/index.js');

async function testDefaultConfiguration() {
  console.log('Testing default configuration...');
  
  // Create a database with no configuration
  const db = new BrainyData();
  await db.init();
  
  // Add a test vector
  const id = await db.add('This is a test vector', { test: true });
  console.log(`Added test vector with ID: ${id}`);
  
  // Get the vector back
  const vector = await db.get(id);
  console.log('Retrieved vector:', vector.metadata);
  
  // Get storage status
  const status = await db.status();
  console.log('Storage status:', status);
  
  // Clean up
  await db.clear();
  console.log('Database cleared');
  
  console.log('Default configuration test completed successfully!');
}

async function testStorageConfiguration() {
  console.log('\nTesting storage configuration...');
  
  // Create a database with storage configuration
  const db = new BrainyData({
    storage: {
      // Force in-memory storage for testing
      forceMemoryStorage: true
    }
  });
  await db.init();
  
  // Add a test vector
  const id = await db.add('This is a test vector with storage config', { test: true });
  console.log(`Added test vector with ID: ${id}`);
  
  // Get the vector back
  const vector = await db.get(id);
  console.log('Retrieved vector:', vector.metadata);
  
  // Get storage status
  const status = await db.status();
  console.log('Storage status:', status);
  
  // Clean up
  await db.clear();
  console.log('Database cleared');
  
  console.log('Storage configuration test completed successfully!');
}

async function runTests() {
  try {
    await testDefaultConfiguration();
    await testStorageConfiguration();
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests();
