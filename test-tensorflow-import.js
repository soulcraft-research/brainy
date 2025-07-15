const { applyTensorFlowPatch } = require('./src/utils/textEncoding.js')

console.log('Before patch:')
console.log('global.TextEncoder:', typeof global.TextEncoder)
console.log('global.__TextEncoder__:', typeof global.__TextEncoder__)

applyTensorFlowPatch()

console.log('After patch:')
console.log('global.TextEncoder:', typeof global.TextEncoder)
console.log('global.__TextEncoder__:', typeof global.__TextEncoder__)

// Try to import tensorflow
async function testTensorFlow() {
  try {
    console.log('Importing TensorFlow...')
    const tf = await import('@tensorflow/tfjs-core')
    console.log('TensorFlow imported successfully:', tf.version)
  } catch (error) {
    console.error('TensorFlow import failed:', error.message)
  }
}

testTensorFlow()
