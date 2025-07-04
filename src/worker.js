// Brainy Worker Script
// This script is used by the workerUtils.js file to execute functions in a separate thread

// Import text encoding utilities
import { applyTensorFlowPatch } from './utils/textEncoding.js'

// Apply the TensorFlow.js platform patch if needed
applyTensorFlowPatch()

// Log that the worker has started
console.log('Brainy Worker: Started')

self.onmessage = function (e) {
  try {
    console.log('Brainy Worker: Received message', e.data ? 'with data' : 'without data')

    if (!e.data || !e.data.fnString) {
      throw new Error('Invalid message: missing function string')
    }

    console.log('Brainy Worker: Creating function from string')
    const fn = new Function('return ' + e.data.fnString)()

    console.log('Brainy Worker: Executing function with args')
    const result = fn(e.data.args)

    console.log('Brainy Worker: Function executed successfully, posting result')
    self.postMessage({ result: result })
  } catch (error) {
    console.error('Brainy Worker: Error executing function', error)
    self.postMessage({ 
      error: error.message,
      stack: error.stack
    })
  }
}
