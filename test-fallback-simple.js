// Test script to verify that the function string format works with the fallback mechanism
import { executeInThread } from './dist/unified.js'

// Define a compute-intensive function using a simple anonymous function expression
const computeIntensiveFunction = `function(data) {
  console.log('Worker/Fallback: Starting computation...');

  // Simulate a compute-intensive task
  const start = Date.now();
  let result = 0;
  for (let i = 0; i < data.iterations; i++) {
    result += Math.sqrt(i) * Math.sin(i);
  }

  const duration = Date.now() - start;
  console.log('Worker/Fallback: Computation completed in ' + duration + 'ms');

  return {
    result,
    duration,
    iterations: data.iterations
  };
}`

// Test with different environments
async function runTests() {
  try {
    console.log('Testing executeInThread with fallback...')
    
    // Disable Web Workers to force fallback
    const originalWorker = globalThis.Worker
    globalThis.Worker = function() {
      throw new Error('Worker constructor disabled for testing')
    }
    
    try {
      // Execute the function in fallback mode
      const result = await executeInThread(computeIntensiveFunction, {
        iterations: 1000000
      })
      console.log('Fallback result:', result)
      console.log('Test passed!')
    } finally {
      // Restore Web Workers
      globalThis.Worker = originalWorker
    }
  } catch (error) {
    console.error('Test failed:', error)
  }
}

runTests()
