/**
 * Read-Only Mode Test
 * 
 * This example demonstrates how to use the read-only mode feature of BrainyData.
 */

import { BrainyData } from '../dist/index.js';

async function testReadOnlyMode() {
  console.log('Testing read-only mode...');
  
  // Test 1: Create a database in read-only mode
  console.log('\nTest 1: Create a database in read-only mode');
  const readOnlyDb = new BrainyData({ readOnly: true });
  await readOnlyDb.init();
  
  console.log('Database initialized in read-only mode');
  console.log('Is read-only:', readOnlyDb.isReadOnly());
  
  // Try to add data (should throw an error)
  try {
    console.log('Attempting to add data to read-only database...');
    await readOnlyDb.add([0.1, 0.2, 0.3], { name: 'test' });
    console.log('ERROR: Add operation succeeded but should have failed!');
  } catch (error) {
    console.log('Expected error caught:', error.message);
  }
  
  // Test 2: Toggle read-only mode at runtime
  console.log('\nTest 2: Toggle read-only mode at runtime');
  const db = new BrainyData();
  await db.init();
  
  console.log('Database initialized in writable mode');
  console.log('Is read-only:', db.isReadOnly());
  
  // Add data while writable
  console.log('Adding data while writable...');
  const itemId = await db.add([0.1, 0.2, 0.3], { name: 'test' });
  console.log('Added item with ID:', itemId);
  
  // Set to read-only mode
  console.log('Setting database to read-only mode');
  db.setReadOnly(true);
  console.log('Is read-only:', db.isReadOnly());
  
  // Try to delete data (should throw an error)
  try {
    console.log('Attempting to delete data from read-only database...');
    await db.delete(itemId);
    console.log('ERROR: Delete operation succeeded but should have failed!');
  } catch (error) {
    console.log('Expected error caught:', error.message);
  }
  
  // Set back to writable mode
  console.log('Setting database back to writable mode');
  db.setReadOnly(false);
  console.log('Is read-only:', db.isReadOnly());
  
  // Delete data (should succeed)
  console.log('Deleting data while writable...');
  const deleteResult = await db.delete(itemId);
  console.log('Delete result:', deleteResult);
  
  console.log('\nAll tests completed successfully!');
}

// Run the tests
testReadOnlyMode().catch(error => {
  console.error('Test failed:', error);
});
