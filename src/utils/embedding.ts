/**
 * Embedding functions for converting data to vectors
 */

import { EmbeddingFunction, EmbeddingModel, Vector } from '../coreTypes.js'
import { executeInThread } from './workerUtils.js'

/**
 * TensorFlow Universal Sentence Encoder embedding model
 * This model provides high-quality text embeddings using TensorFlow.js
 * The required TensorFlow.js dependencies are automatically installed with this package
 *
 * This implementation attempts to use GPU processing when available for better performance,
 * falling back to CPU processing for compatibility across all environments.
 */
export class UniversalSentenceEncoder implements EmbeddingModel {
  private model: any = null
  private initialized = false
  private tf: any = null
  private use: any = null
  private backend: string = 'cpu' // Default to CPU

  /**
   * Add polyfills and patches for TensorFlow.js compatibility
   * This addresses issues with TensorFlow.js in Node.js environments
   * 
   * Note: The main TensorFlow.js patching is now centralized in textEncoding.ts
   * and applied through setup.ts. This method only adds additional utility functions
   * that might be needed by TensorFlow.js.
   */
  private addNodeCompatibilityPolyfills(): void {
    // Only apply in Node.js environment
    if (
      typeof process === 'undefined' ||
      !process.versions ||
      !process.versions.node
    ) {
      return
    }

    // Add polyfill for isFloat32Array in Node.js 24.4.0
    // This fixes the "Cannot read properties of undefined (reading 'isFloat32Array')" error
    if (typeof global !== 'undefined') {
      try {
        // Ensure the util object exists
        if (!global.util) {
          global.util = {}
        }

        // Add isFloat32Array method if it doesn't exist
        if (!global.util.isFloat32Array) {
          global.util.isFloat32Array = (obj: any) => {
            return !!(
              obj instanceof Float32Array ||
              (obj &&
                Object.prototype.toString.call(obj) === '[object Float32Array]')
            )
          }
        }

        // Add isTypedArray method if it doesn't exist
        if (!global.util.isTypedArray) {
          global.util.isTypedArray = (obj: any) => {
            return !!(ArrayBuffer.isView(obj) && !(obj instanceof DataView))
          }
        }
      } catch (error) {
        console.warn('Failed to add utility polyfills:', error)
      }
    }
  }

  /**
   * Initialize the embedding model
   */
  public async init(): Promise<void> {
    try {
      // Save original console.warn
      const originalWarn = console.warn

      // Override console.warn to suppress TensorFlow.js Node.js backend message
      console.warn = function (message?: any, ...optionalParams: any[]) {
        if (
          message &&
          typeof message === 'string' &&
          message.includes(
            'Hi, looks like you are running TensorFlow.js in Node.js'
          )
        ) {
          return // Suppress the specific warning
        }
        originalWarn(message, ...optionalParams)
      }

      // Add polyfills for TensorFlow.js compatibility
      this.addNodeCompatibilityPolyfills()

      // TensorFlow.js will use its default EPSILON value

      // CRITICAL: First, directly import the setup module to ensure the TensorFlow.js patch is applied
      // This is the most reliable way to ensure the patch is applied before TensorFlow.js is loaded
      try {
        // In Node.js environment, use require() which is synchronous
        if (typeof require !== 'undefined') {
          // First, require the setup module to apply the patch
          require('../setup.js')

          // Now load TensorFlow.js core module
          this.tf = require('@tensorflow/tfjs-core')

          // Load CPU backend (always needed as fallback)
          require('@tensorflow/tfjs-backend-cpu')

          // Try to load WebGL backend for GPU acceleration in browser environments
          if (typeof window !== 'undefined') {
            try {
              require('@tensorflow/tfjs-backend-webgl')
              // Check if WebGL is available
              if (this.tf.setBackend) {
                this.tf.setBackend('webgl')
                this.backend = 'webgl'
                console.log('Using WebGL backend for TensorFlow.js')
              } else {
                console.warn(
                  'tf.setBackend is not available, falling back to CPU'
                )
              }
            } catch (e) {
              console.warn(
                'WebGL backend not available, falling back to CPU:',
                e
              )
              this.backend = 'cpu'
            }
          }

          // Load Universal Sentence Encoder
          this.use = require('@tensorflow-models/universal-sentence-encoder')
        } else {
          // In browser or other environments without require(), use dynamic imports
          // First, dynamically import the setup module to apply the patch
          await import('../setup.js')

          // Now load TensorFlow.js core module
          this.tf = await import('@tensorflow/tfjs-core')

          // Import CPU backend (always needed as fallback)
          await import('@tensorflow/tfjs-backend-cpu')

          // Try to import WebGL backend for GPU acceleration in browser environments
          try {
            if (typeof window !== 'undefined') {
              await import('@tensorflow/tfjs-backend-webgl')
              // Check if WebGL is available
              try {
                if (this.tf.setBackend) {
                  await this.tf.setBackend('webgl')
                  this.backend = 'webgl'
                  console.log('Using WebGL backend for TensorFlow.js')
                } else {
                  console.warn(
                    'tf.setBackend is not available, falling back to CPU'
                  )
                }
              } catch (e) {
                console.warn(
                  'WebGL backend not available, falling back to CPU:',
                  e
                )
                this.backend = 'cpu'
              }
            }
          } catch (error) {
            console.warn(
              'WebGL backend not available, falling back to CPU:',
              error
            )
            this.backend = 'cpu'
          }

          // Load Universal Sentence Encoder
          this.use = await import(
            '@tensorflow-models/universal-sentence-encoder'
          )
        }
      } catch (error) {
        console.error('Failed to initialize TensorFlow.js:', error)
        throw error
      }

      // Set the backend
      if (this.tf.setBackend) {
        await this.tf.setBackend(this.backend)
      }

      // Log the module structure to help with debugging
      console.log(
        'Universal Sentence Encoder module structure in main thread:',
        Object.keys(this.use),
        this.use.default ? Object.keys(this.use.default) : 'No default export'
      )

      // Try to find the load function in different possible module structures
      const loadFunction = findUSELoadFunction(this.use)

      if (!loadFunction) {
        throw new Error(
          'Could not find Universal Sentence Encoder load function'
        )
      }

      // Load the model
      this.model = await loadFunction()
      this.initialized = true

      // Restore original console.warn
      console.warn = originalWarn
    } catch (error) {
      console.error('Failed to initialize Universal Sentence Encoder:', error)
      throw new Error(
        `Failed to initialize Universal Sentence Encoder: ${error}`
      )
    }
  }

  /**
   * Embed text into a vector using Universal Sentence Encoder
   * @param data Text to embed
   */
  public async embed(data: string | string[]): Promise<Vector> {
    if (!this.initialized) {
      await this.init()
    }

    try {
      // Handle different input types
      let textToEmbed: string[]
      if (typeof data === 'string') {
        // Handle empty string case
        if (data.trim() === '') {
          // Return a zero vector of appropriate dimension (512 is the default for USE)
          return new Array(512).fill(0)
        }
        textToEmbed = [data]
      } else if (
        Array.isArray(data) &&
        data.every((item) => typeof item === 'string')
      ) {
        // Handle empty array or array with empty strings
        if (data.length === 0 || data.every((item) => item.trim() === '')) {
          return new Array(512).fill(0)
        }
        // Filter out empty strings
        textToEmbed = data.filter((item) => item.trim() !== '')
        if (textToEmbed.length === 0) {
          return new Array(512).fill(0)
        }
      } else {
        throw new Error(
          'UniversalSentenceEncoder only supports string or string[] data'
        )
      }

      // Get embeddings
      const embeddings = await this.model.embed(textToEmbed)

      // Convert to array and return the first embedding
      const embeddingArray = await embeddings.array()

      // Dispose of the tensor to free memory
      embeddings.dispose()

      return embeddingArray[0]
    } catch (error) {
      console.error(
        'Failed to embed text with Universal Sentence Encoder:',
        error
      )
      throw new Error(
        `Failed to embed text with Universal Sentence Encoder: ${error}`
      )
    }
  }

  /**
   * Embed multiple texts into vectors using Universal Sentence Encoder
   * This is more efficient than calling embed() multiple times
   * @param dataArray Array of texts to embed
   * @returns Array of embedding vectors
   */
  public async embedBatch(dataArray: string[]): Promise<Vector[]> {
    if (!this.initialized) {
      await this.init()
    }

    try {
      // Handle empty array case
      if (dataArray.length === 0) {
        return []
      }

      // Filter out empty strings and handle edge cases
      const textToEmbed = dataArray.filter(
        (text: string) => typeof text === 'string' && text.trim() !== ''
      )

      // If all strings were empty, return appropriate zero vectors
      if (textToEmbed.length === 0) {
        return dataArray.map(() => new Array(512).fill(0))
      }

      // Get embeddings for all texts in a single batch operation
      const embeddings = await this.model.embed(textToEmbed)

      // Convert to array
      const embeddingArray = await embeddings.array()

      // Dispose of the tensor to free memory
      embeddings.dispose()

      // Map the results back to the original array order
      const results: Vector[] = []
      let embeddingIndex = 0

      for (let i = 0; i < dataArray.length; i++) {
        const text = dataArray[i]
        if (typeof text === 'string' && text.trim() !== '') {
          // Use the embedding for non-empty strings
          results.push(embeddingArray[embeddingIndex])
          embeddingIndex++
        } else {
          // Use a zero vector for empty strings
          results.push(new Array(512).fill(0))
        }
      }

      return results
    } catch (error) {
      console.error(
        'Failed to batch embed text with Universal Sentence Encoder:',
        error
      )
      throw new Error(
        `Failed to batch embed text with Universal Sentence Encoder: ${error}`
      )
    }
  }

  /**
   * Dispose of the model resources
   */
  public async dispose(): Promise<void> {
    if (this.model && this.tf) {
      try {
        // Dispose of the model and tensors
        this.model.dispose()
        this.tf.disposeVariables()
        this.initialized = false
      } catch (error) {
        console.error('Failed to dispose Universal Sentence Encoder:', error)
      }
    }
    return Promise.resolve()
  }
}

/**
 * Helper function to load the Universal Sentence Encoder model
 * This tries multiple approaches to find the correct load function
 * @param sentenceEncoderModule The imported module
 * @returns The load function or null if not found
 */
function findUSELoadFunction(
  sentenceEncoderModule: any
): (() => Promise<EmbeddingModel>) | null {
  // Log the module structure for debugging
  console.log(
    'Universal Sentence Encoder module structure:',
    Object.keys(sentenceEncoderModule),
    sentenceEncoderModule.default
      ? Object.keys(sentenceEncoderModule.default)
      : 'No default export'
  )

  let loadFunction = null

  // Try sentenceEncoderModule.load first (direct export)
  if (
    sentenceEncoderModule.load &&
    typeof sentenceEncoderModule.load === 'function'
  ) {
    loadFunction = sentenceEncoderModule.load
    console.log('Using sentenceEncoderModule.load')
  }
  // Then try sentenceEncoderModule.default.load (default export)
  else if (
    sentenceEncoderModule.default &&
    sentenceEncoderModule.default.load &&
    typeof sentenceEncoderModule.default.load === 'function'
  ) {
    loadFunction = sentenceEncoderModule.default.load
    console.log('Using sentenceEncoderModule.default.load')
  }
  // Try sentenceEncoderModule.default directly if it's a function
  else if (
    sentenceEncoderModule.default &&
    typeof sentenceEncoderModule.default === 'function'
  ) {
    loadFunction = sentenceEncoderModule.default
    console.log('Using sentenceEncoderModule.default as function')
  }
  // Try sentenceEncoderModule directly if it's a function
  else if (typeof sentenceEncoderModule === 'function') {
    loadFunction = sentenceEncoderModule
    console.log('Using sentenceEncoderModule as function')
  }
  // Try additional common patterns
  else if (
    sentenceEncoderModule.UniversalSentenceEncoder &&
    typeof sentenceEncoderModule.UniversalSentenceEncoder.load === 'function'
  ) {
    loadFunction = sentenceEncoderModule.UniversalSentenceEncoder.load
    console.log('Using sentenceEncoderModule.UniversalSentenceEncoder.load')
  } else if (
    sentenceEncoderModule.default &&
    sentenceEncoderModule.default.UniversalSentenceEncoder &&
    typeof sentenceEncoderModule.default.UniversalSentenceEncoder.load ===
      'function'
  ) {
    loadFunction = sentenceEncoderModule.default.UniversalSentenceEncoder.load
    console.log(
      'Using sentenceEncoderModule.default.UniversalSentenceEncoder.load'
    )
  }
  // Try to find the load function in the module's properties
  else {
    // Look for any property that might be a load function
    for (const key in sentenceEncoderModule) {
      if (typeof sentenceEncoderModule[key] === 'function') {
        // Check if the function name or key contains 'load'
        const fnName = sentenceEncoderModule[key].name || key
        if (fnName.toLowerCase().includes('load')) {
          loadFunction = sentenceEncoderModule[key]
          console.log(`Using sentenceEncoderModule.${key} as load function`)
          break
        }
      }
      // Also check nested objects
      else if (
        typeof sentenceEncoderModule[key] === 'object' &&
        sentenceEncoderModule[key] !== null
      ) {
        for (const nestedKey in sentenceEncoderModule[key]) {
          if (typeof sentenceEncoderModule[key][nestedKey] === 'function') {
            const fnName =
              sentenceEncoderModule[key][nestedKey].name || nestedKey
            if (fnName.toLowerCase().includes('load')) {
              loadFunction = sentenceEncoderModule[key][nestedKey]
              console.log(
                `Using sentenceEncoderModule.${key}.${nestedKey} as load function`
              )
              break
            }
          }
        }
        if (loadFunction) break
      }
    }
  }

  return loadFunction
}

/**
 * Create an embedding function from an embedding model
 * @param model Embedding model to use
 */
export function createEmbeddingFunction(
  model: EmbeddingModel
): EmbeddingFunction {
  return async (data: any): Promise<Vector> => {
    return await model.embed(data)
  }
}

/**
 * Creates a TensorFlow-based Universal Sentence Encoder embedding function
 * This is the required embedding function for all text embeddings
 * Uses a shared model instance for better performance across multiple calls
 */
// Create a single shared instance of the model that persists across all embedding calls
const sharedModel = new UniversalSentenceEncoder()
let sharedModelInitialized = false

export function createTensorFlowEmbeddingFunction(): EmbeddingFunction {
  return async (data: any): Promise<Vector> => {
    try {
      // Initialize the model if it hasn't been initialized yet
      if (!sharedModelInitialized) {
        await sharedModel.init()
        sharedModelInitialized = true
      }

      return await sharedModel.embed(data)
    } catch (error) {
      console.error('Failed to use TensorFlow embedding:', error)
      throw new Error(
        `Universal Sentence Encoder is required but failed: ${error}`
      )
    }
  }
}

/**
 * Default embedding function
 * Uses UniversalSentenceEncoder for all text embeddings
 * TensorFlow.js is required for this to work
 * Uses CPU for compatibility
 */
export const defaultEmbeddingFunction: EmbeddingFunction =
  createTensorFlowEmbeddingFunction()

/**
 * Default batch embedding function
 * Uses UniversalSentenceEncoder for all text embeddings
 * TensorFlow.js is required for this to work
 * Processes all items in a single batch operation
 * Uses a shared model instance for better performance across multiple calls
 */
// Create a single shared instance of the model that persists across function calls
const sharedBatchModel = new UniversalSentenceEncoder()
let sharedBatchModelInitialized = false

export const defaultBatchEmbeddingFunction: (
  dataArray: string[]
) => Promise<Vector[]> = async (dataArray: string[]): Promise<Vector[]> => {
  try {
    // Initialize the model if it hasn't been initialized yet
    if (!sharedBatchModelInitialized) {
      await sharedBatchModel.init()
      sharedBatchModelInitialized = true
    }

    return await sharedBatchModel.embedBatch(dataArray)
  } catch (error) {
    console.error('Failed to use TensorFlow batch embedding:', error)
    throw new Error(
      `Universal Sentence Encoder batch embedding failed: ${error}`
    )
  }
}

/**
 * Creates an embedding function that runs in a separate thread
 * This is a wrapper around createEmbeddingFunction that uses executeInThread
 * @param model Embedding model to use
 */
export function createThreadedEmbeddingFunction(
  model: EmbeddingModel
): EmbeddingFunction {
  const embeddingFunction = createEmbeddingFunction(model)

  return async (data: any): Promise<Vector> => {
    // Convert the embedding function to a string
    const fnString = embeddingFunction.toString()

    // Execute the embedding function in a "thread" (main thread in this implementation)
    return await executeInThread<Vector>(fnString, data)
  }
}
