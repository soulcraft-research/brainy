// Test script to verify the TextEncoder fix
import { applyTensorFlowPatch } from './dist/utils/textEncoding.js'

console.log('Testing TextEncoder fix...')

// Apply the TensorFlow.js platform patch
applyTensorFlowPatch()

// Check if PlatformNode is defined in the global object
if (typeof global.PlatformNode === 'function') {
  console.log('PlatformNode is defined in the global object')

  // Create an instance of PlatformNode
  try {
    const platform = new global.PlatformNode()
    console.log('Successfully created PlatformNode instance')

    // Check if textEncoder is defined
    if (platform.textEncoder) {
      console.log('textEncoder is defined')

      // Test encoding a string
      const testString = 'Hello, world! 👋'
      const encoded = platform.textEncoder.encode(testString)
      console.log(`Successfully encoded string: ${testString}`)
      console.log(`Encoded: [${encoded}]`)

      // Test decoding
      const decoded = platform.textDecoder.decode(encoded)
      console.log(`Successfully decoded back to: ${decoded}`)

      if (testString === decoded) {
        console.log('✅ TextEncoder/TextDecoder test passed!')
      } else {
        console.error('❌ TextEncoder/TextDecoder test failed!')
      }
    } else {
      console.error('textEncoder is not defined in the platform instance')
    }
  } catch (error) {
    console.error('Error creating PlatformNode instance:', error)
  }
} else {
  console.error('PlatformNode is not defined in the global object')
}

console.log('Test completed')
