// Brainy Worker Script
// This script is used by the workerUtils.js file to execute functions in a separate thread

// Note: TensorFlow.js platform patch is applied in setup.ts
// Worker scripts should import setup.ts if they need TensorFlow.js functionality

// Log that the worker has started
console.log('Brainy Worker: Started')

// Define the message handler with proper TypeScript typing
self.onmessage = function (e: MessageEvent): void {
  try {
    console.log(
      'Brainy Worker: Received message',
      e.data ? 'with data' : 'without data'
    )

    if (!e.data || !e.data.fnString) {
      throw new Error('Invalid message: missing function string')
    }

    console.log('Brainy Worker: Creating function from string')
    // Use Function constructor to create a function from the string
    let fn

    try {
      // First try with 'return' prefix
      fn = new Function('return ' + e.data.fnString)()
    } catch (functionError) {
      console.warn(
        'Brainy Worker: Error creating function with return syntax, trying alternative approaches',
        functionError
      )

      try {
        // Try wrapping in parentheses for function expressions
        fn = new Function('return (' + e.data.fnString + ')')()
      } catch (wrapError) {
        console.warn(
          'Brainy Worker: Error creating function with parentheses wrapping',
          wrapError
        )

        try {
          // Try direct approach for named functions
          fn = new Function(e.data.fnString)()
        } catch (directError) {
          console.error(
            'Brainy Worker: All approaches to create function failed',
            directError
          )
          throw new Error(
            'Failed to create function from string: ' +
              (functionError as Error).message
          )
        }
      }
    }

    console.log('Brainy Worker: Executing function with args')
    const result = fn(e.data.args)

    console.log('Brainy Worker: Function executed successfully, posting result')
    self.postMessage({ result: result })
  } catch (error: any) {
    console.error('Brainy Worker: Error executing function', error)
    self.postMessage({
      error: error.message,
      stack: error.stack
    })
  }
}
