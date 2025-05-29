/**
 * Embedding functions for converting data to vectors
 */

import { EmbeddingFunction, EmbeddingModel, Vector } from '../coreTypes.ts'

/**
 * Simple character-based embedding function
 * This is a very basic implementation for demo purposes
 */
export class SimpleEmbedding implements EmbeddingModel {
  private initialized = false

  /**
   * Initialize the embedding model
   */
  public async init(): Promise<void> {
    this.initialized = true
    return Promise.resolve()
  }

  /**
   * Embed text into a vector using character frequencies
   * @param data Text to embed
   */
  public async embed(data: string): Promise<Vector> {
    if (!this.initialized) {
      await this.init()
    }

    // Only handle string data
    if (typeof data !== 'string') {
      throw new Error('SimpleEmbedding only supports string data')
    }

    // Normalize the text
    const normalizedText = data.toLowerCase().trim()

    // Create a simple 4-dimensional vector based on character frequencies
    const vector: Vector = [0, 0, 0, 0]

    // Count vowels, consonants, numbers, and special characters
    for (let i = 0; i < normalizedText.length; i++) {
      const char = normalizedText[i]
      if ('aeiou'.includes(char)) {
        vector[0] += 0.1 // Vowels affect first dimension
      } else if ('bcdfghjklmnpqrstvwxyz'.includes(char)) {
        vector[1] += 0.1 // Consonants affect second dimension
      } else if ('0123456789'.includes(char)) {
        vector[2] += 0.1 // Numbers affect third dimension
      } else {
        vector[3] += 0.1 // Special chars affect fourth dimension
      }
    }

    // Normalize the vector
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    )
    if (magnitude > 0) {
      return vector.map((val) => val / magnitude)
    }

    return vector
  }

  /**
   * Dispose of the model resources
   */
  public async dispose(): Promise<void> {
    this.initialized = false
    return Promise.resolve()
  }
}

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
      // Dynamically import TensorFlow.js and Universal Sentence Encoder
      // Use type assertions to tell TypeScript these modules exist
      this.tf = await import('@tensorflow/tfjs')
      this.use = await import('@tensorflow-models/universal-sentence-encoder')

      // Load the model
      this.model = await this.use.load()
      this.initialized = true
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
        textToEmbed = [data]
      } else if (Array.isArray(data) && data.every(item => typeof item === 'string')) {
        textToEmbed = data
      } else {
        throw new Error('UniversalSentenceEncoder only supports string or string[] data')
      }

      // Get embeddings
      const embeddings = await this.model.embed(textToEmbed)

      // Convert to array and return the first embedding
      const embeddingArray = await embeddings.array()
      return embeddingArray[0]
    } catch (error) {
      console.error('Failed to embed text with Universal Sentence Encoder:', error)
      throw new Error(`Failed to embed text with Universal Sentence Encoder: ${error}`)
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
export function createEmbeddingFunction(model: EmbeddingModel): EmbeddingFunction {
  return async (data: any): Promise<Vector> => {
    return await model.embed(data)
  }
}

/**
 * Creates a TensorFlow-based Universal Sentence Encoder embedding function
 * This is the recommended embedding function for high-quality text embeddings
 */
export function createTensorFlowEmbeddingFunction(): EmbeddingFunction {
  return createEmbeddingFunction(new UniversalSentenceEncoder())
}

/**
 * Simple embedding function using character-based embedding
 * This is a basic implementation that doesn't use TensorFlow
 */
export function createSimpleEmbeddingFunction(): EmbeddingFunction {
  return createEmbeddingFunction(new SimpleEmbedding())
}

/**
 * Default embedding function using UniversalSentenceEncoder
 * This provides high-quality text embeddings using TensorFlow.js
 */
export const defaultEmbeddingFunction: EmbeddingFunction = createTensorFlowEmbeddingFunction()
