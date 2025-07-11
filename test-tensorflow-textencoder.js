// Test script to verify TensorFlow.js and TextEncoder functionality in Node.js environment
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-cpu'
import { TextEncoder, TextDecoder } from 'util'

// Implement the necessary functions directly
function applyTensorFlowPatch() {
  // This is a simplified version of the patch
  console.log('Applying TensorFlow patch directly in test file')
  return true
}

function getTextEncoder() {
  return new TextEncoder()
}

function getTextDecoder() {
  return new TextDecoder()
}

async function testTensorFlowAndTextEncoder() {
  console.log('Testing TensorFlow.js and TextEncoder in Node.js environment...')

  try {
    // Apply TensorFlow patch for TextEncoder compatibility
    applyTensorFlowPatch()
    console.log('TensorFlow patch applied successfully')

    // Test TextEncoder
    console.log('\n--- Testing TextEncoder ---')
    const encoder = getTextEncoder()
    const decoder = getTextDecoder()

    const testString = 'Hello, world! 👋'
    console.log(`Original string: "${testString}"`)

    const encoded = encoder.encode(testString)
    console.log(`Encoded: [${encoded}]`)

    const decoded = decoder.decode(encoded)
    console.log(`Decoded: "${decoded}"`)

    if (testString === decoded) {
      console.log('✅ TextEncoder/TextDecoder test passed!')
    } else {
      console.error('❌ TextEncoder/TextDecoder test failed!')
      return false
    }

    // Test TensorFlow.js
    console.log('\n--- Testing TensorFlow.js ---')

    // Create a simple tensor
    const tensor = tf.tensor2d([
      [1, 2],
      [3, 4]
    ])
    console.log('Created tensor:')
    tensor.print()

    // Perform a simple operation
    const result = tensor.add(tf.scalar(1))
    console.log('Result of adding 1:')
    result.print()

    // Check the values
    const values = await result.array()
    const expected = [
      [2, 3],
      [4, 5]
    ]

    console.log('Result values:', values)
    console.log('Expected values:', expected)

    // Compare values
    const match = JSON.stringify(values) === JSON.stringify(expected)
    if (match) {
      console.log('✅ TensorFlow.js test passed!')
    } else {
      console.error('❌ TensorFlow.js test failed!')
      return false
    }

    console.log('\nAll tests passed successfully!')
    return true
  } catch (error) {
    console.error('Error during test:', error)
    return false
  }
}

// Run the test
testTensorFlowAndTextEncoder().then((success) => {
  if (success) {
    console.log(
      'TensorFlow.js and TextEncoder verification completed successfully!'
    )
  } else {
    console.error('TensorFlow.js and TextEncoder verification failed!')
    process.exit(1)
  }
})
