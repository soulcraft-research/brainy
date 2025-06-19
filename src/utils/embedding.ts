/**
 * Embedding functions for converting data to vectors
 */

import { EmbeddingFunction, EmbeddingModel, Vector } from '../coreTypes.js'

/**
 * TensorFlow Universal Sentence Encoder embedding model
 * This model provides high-quality text embeddings using TensorFlow.js
 * The required TensorFlow.js dependencies are automatically installed with this package
 */
export class UniversalSentenceEncoder implements EmbeddingModel {
  private model: any = null
  private initialized = false
  private tf: any = null
  private use: any = null

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

      // Define EPSILON flag before TensorFlow.js is loaded
      // This prevents the "Cannot evaluate flag 'EPSILON': no evaluation function found" error
      if (typeof window !== 'undefined') {
        ;(window as any).EPSILON = 1e-7
        // Define the flag with an evaluation function for TensorFlow.js
        ;(window as any).ENV = (window as any).ENV || {}
        ;(window as any).ENV.flagRegistry =
          (window as any).ENV.flagRegistry || {}
        ;(window as any).ENV.flagRegistry.EPSILON = {
          evaluationFn: () => 1e-7
        }
      } else if (typeof global !== 'undefined') {
        ;(global as any).EPSILON = 1e-7
        // Define the flag with an evaluation function for TensorFlow.js
        ;(global as any).ENV = (global as any).ENV || {}
        ;(global as any).ENV.flagRegistry =
          (global as any).ENV.flagRegistry || {}
        ;(global as any).ENV.flagRegistry.EPSILON = {
          evaluationFn: () => 1e-7
        }
      }

      // Dynamically import TensorFlow.js and Universal Sentence Encoder
      // Use type assertions to tell TypeScript these modules exist
      this.tf = await import('@tensorflow/tfjs')
      this.use = await import('@tensorflow-models/universal-sentence-encoder')

      // Load the model
      this.model = await this.use.load()
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
 */
export function createTensorFlowEmbeddingFunction(): EmbeddingFunction {
  // Create a single shared instance of the model
  const model = new UniversalSentenceEncoder()
  let modelInitialized = false

  return async (data: any): Promise<Vector> => {
    try {
      // Initialize the model if it hasn't been initialized yet
      if (!modelInitialized) {
        await model.init()
        modelInitialized = true
      }

      return await model.embed(data)
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
 */
export const defaultEmbeddingFunction: EmbeddingFunction =
  createTensorFlowEmbeddingFunction()
