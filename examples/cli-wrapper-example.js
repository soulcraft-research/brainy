#!/usr/bin/env node

/**
 * Example CLI wrapper for Brainy that properly handles TensorFlow.js initialization
 * 
 * This example demonstrates how to create a CLI tool that uses Brainy
 * while ensuring TensorFlow.js is properly initialized in Node.js environments.
 * 
 * Usage:
 *   node cli-wrapper-example.js
 */

// CRITICAL: Apply the TensorFlow.js patch before any other imports
// This prevents the "TextEncoder is not a constructor" error
try {
  // For CommonJS environments
  if (typeof require === 'function') {
    // First require the setup module to apply the patch
    require('../dist/setup.js');
    console.log('Applied TensorFlow.js patch via CommonJS require');
  }
} catch (error) {
  console.warn('Failed to apply TensorFlow.js patch via require:', error);
}

// ES Modules approach - this will be used if the above fails or if using ES modules
import('../dist/setup.js')
  .then(() => {
    console.log('Applied TensorFlow.js patch via ES modules import');
    return import('../dist/unified.js');
  })
  .then((brainy) => {
    // Now it's safe to use Brainy and TensorFlow.js
    console.log('Brainy loaded successfully');
    
    // Example: Create a BrainyData instance
    const db = new brainy.BrainyData({
      name: 'cli-example',
      storage: 'memory'
    });
    
    // Example: Add some data
    db.addItem('Hello world', { id: '1', metadata: { type: 'greeting' } })
      .then(() => {
        console.log('Added item to database');
        
        // Example: Search for similar items
        return db.search('Hello', 1);
      })
      .then((results) => {
        console.log('Search results:', results);
        
        // Clean up
        return db.close();
      })
      .then(() => {
        console.log('Database closed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Error in Brainy operations:', error);
        process.exit(1);
      });
  })
  .catch((error) => {
    console.error('Failed to load Brainy:', error);
    process.exit(1);
  });
