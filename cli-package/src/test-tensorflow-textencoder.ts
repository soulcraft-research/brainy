/**
 * CLI Test for TensorFlow.js and TextEncoder
 *
 * This script tests TensorFlow.js and TextEncoder functionality in the CLI environment.
 */

import {
  getTextEncoder,
  getTextDecoder
} from '@soulcraft/brainy/dist/utils/textEncoding.js'
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-cpu'

export async function testTensorFlowAndTextEncoder(): Promise<boolean> {
  console.log('Testing TensorFlow.js and TextEncoder in CLI environment...')

  try {
    // TensorFlow patch is automatically applied by the main package
    console.log('Using TensorFlow with automatic patching')

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

// This function can be called from the CLI
export async function runTest(): Promise<void> {
  const success = await testTensorFlowAndTextEncoder()
  if (success) {
    console.log(
      'TensorFlow.js and TextEncoder verification completed successfully!'
    )
    process.exit(0)
  } else {
    console.error('TensorFlow.js and TextEncoder verification failed!')
    process.exit(1)
  }
}

// If this file is run directly
if (typeof require !== 'undefined' && require.main === module) {
  runTest()
}
