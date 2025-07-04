// Test script to verify that the workerUtils functions work correctly after removing eval
import { executeInThread } from './dist/unified.js'

// Test function to execute in a thread
const testFunction = `function(args) {
  return "Hello from " + args.name;
}`

// Test with different environments
async function runTests() {
  try {
    console.log('Testing executeInThread...')
    const result = await executeInThread(testFunction, {
      name: 'Worker Thread'
    })
    console.log('Result:', result)

    console.log('All tests passed!')
  } catch (error) {
    console.error('Test failed:', error)
  }
}

runTests()
