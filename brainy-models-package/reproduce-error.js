#!/usr/bin/env node

/**
 * Reproduction script for the TensorFlow.js isNullOrUndefined error
 */

import * as tf from '@tensorflow/tfjs-node'
import * as use from '@tensorflow-models/universal-sentence-encoder'

console.log('🔍 Loading Universal Sentence Encoder model...')

try {
  const model = await use.load()
  console.log('✅ Model loaded successfully')

  console.log('🧪 Testing model functionality...')
  const testEmbedding = await model.embed(['Hello world'])
  const testArray = await testEmbedding.array()
  console.log(
    `✅ Model test passed - embedding dimensions: ${testArray[0].length}`
  )
  testEmbedding.dispose()
  model.dispose()
} catch (error) {
  console.error('❌ Error:', error)
  console.error('Stack trace:', error.stack)
  process.exit(1)
}
