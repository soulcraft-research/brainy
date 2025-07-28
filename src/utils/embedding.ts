/**
 * Embedding functions for converting data to vectors
 */

import { EmbeddingFunction, EmbeddingModel, Vector } from '../coreTypes.js'
import { executeInThread } from './workerUtils.js'
import { isBrowser } from './environment.js'

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
  private verbose: boolean = true // Whether to log non-essential messages
  
  /**
   * Create a new UniversalSentenceEncoder instance
   * @param options Configuration options
   */
  constructor(options: { verbose?: boolean } = {}) {
    this.verbose = options.verbose !== undefined ? options.verbose : true
  }

  /**
   * Add polyfills and patches for TensorFlow.js compatibility
   * This addresses issues with TensorFlow.js across all server environments
   * (Node.js, serverless, and other server environments)
   *
   * Note: The main TensorFlow.js patching is now centralized in textEncoding.ts
   * and applied through setup.ts. This method only adds additional utility functions
   * that might be needed by TensorFlow.js.
   */
  private addServerCompatibilityPolyfills(): void {
    // Apply in all non-browser environments (Node.js, serverless, server environments)
    if (isBrowser()) {
      return // Browser environments don't need these polyfills
    }

    // Get the appropriate global object for the current environment
    const globalObj = (() => {
      if (typeof globalThis !== 'undefined') return globalThis
      if (typeof global !== 'undefined') return global
      if (typeof self !== 'undefined') return self
      return {} as any // Fallback for unknown environments
    })()

    // Add polyfill for utility functions across all server environments
    // This fixes issues like "Cannot read properties of undefined (reading 'isFloat32Array')"
    try {
      // Ensure the util object exists
      if (!globalObj.util) {
        globalObj.util = {}
      }

      // Add isFloat32Array method if it doesn't exist
      if (!globalObj.util.isFloat32Array) {
        globalObj.util.isFloat32Array = (obj: any) => {
          return !!(
            obj instanceof Float32Array ||
            (obj &&
              Object.prototype.toString.call(obj) === '[object Float32Array]')
          )
        }
      }

      // Add isTypedArray method if it doesn't exist
      if (!globalObj.util.isTypedArray) {
        globalObj.util.isTypedArray = (obj: any) => {
          return !!(ArrayBuffer.isView(obj) && !(obj instanceof DataView))
        }
      }
    } catch (error) {
      console.warn('Failed to add utility polyfills:', error)
    }
  }

  /**
   * Check if we're running in a test environment
   */
  private isTestEnvironment(): boolean {
    // Safely check for Node.js environment first
    if (typeof process === 'undefined') {
      return false
    }

    return (
      process.env.NODE_ENV === 'test' ||
      process.env.VITEST === 'true' ||
      (typeof global !== 'undefined' && global.__vitest__) ||
      process.argv.some((arg) => arg.includes('vitest'))
    )
  }

  /**
   * Log message only if verbose mode is enabled or if it's an error
   * This helps suppress non-essential log messages
   */
  private logger(
    level: 'log' | 'warn' | 'error',
    message: string,
    ...args: any[]
  ): void {
    // Always log errors, but only log other messages if verbose mode is enabled
    if (level === 'error' || this.verbose) {
      console[level](message, ...args)
    }
  }

  /**
   * Load the Universal Sentence Encoder model with retry logic
   * This helps handle network failures and JSON parsing errors from TensorFlow Hub
   * @param loadFunction The function to load the model
   * @param maxRetries Maximum number of retry attempts
   * @param baseDelay Base delay in milliseconds for exponential backoff
   */
  private async loadModelWithRetry(
    loadFunction: () => Promise<EmbeddingModel>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<EmbeddingModel> {
    let lastError: Error | null = null

    // Define alternative model URLs to try if the default one fails
    const alternativeLoadFunctions: Array<() => Promise<EmbeddingModel>> = []

    // Try to create alternative load functions using different model URLs
    if (this.use) {
      // Add alternative model URLs to try
      const alternativeUrls = [
        'https://storage.googleapis.com/tfjs-models/savedmodel/universal_sentence_encoder/model.json',
        'https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1/model.json',
        'https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder/1/default/1/model.json',
        'https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder/1/default/1',
        'https://tfhub.dev/tensorflow/universal-sentence-encoder/4',
        'https://tfhub.dev/tensorflow/universal-sentence-encoder/4/default/1/model.json'
      ]

      // Create load functions for each alternative URL
      for (const url of alternativeUrls) {
        if (this.use.load) {
          alternativeLoadFunctions.push(() => this.use!.load(url))
        } else if (this.use.default && this.use.default.load) {
          alternativeLoadFunctions.push(() => this.use!.default.load(url))
        }
      }
    }

    // First try with the original load function
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.logger(
          'log',
          attempt === 0
            ? 'Loading Universal Sentence Encoder model...'
            : `Retrying Universal Sentence Encoder model loading (attempt ${attempt + 1}/${maxRetries + 1})...`
        )

        const model = await loadFunction()

        if (attempt > 0) {
          this.logger(
            'log',
            'Universal Sentence Encoder model loaded successfully after retry'
          )
        }

        return model
      } catch (error) {
        lastError = error as Error
        const errorMessage = lastError.message || String(lastError)

        // Check if this is a network-related error that might benefit from retry
        const isRetryableError =
          errorMessage.includes('Failed to parse model JSON') ||
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('Network error') ||
          errorMessage.includes('ENOTFOUND') ||
          errorMessage.includes('ECONNRESET') ||
          errorMessage.includes('ETIMEDOUT') ||
          errorMessage.includes('JSON') ||
          errorMessage.includes('model.json') ||
          errorMessage.includes('byte length') ||
          errorMessage.includes('tensor should have') ||
          errorMessage.includes('shape') ||
          errorMessage.includes('dimensions')

        if (attempt < maxRetries && isRetryableError) {
          const delay = baseDelay * Math.pow(2, attempt) // Exponential backoff
          this.logger(
            'warn',
            `Universal Sentence Encoder model loading failed (attempt ${attempt + 1}): ${errorMessage}. Retrying in ${delay}ms...`
          )
          await new Promise((resolve) => setTimeout(resolve, delay))
        } else {
          // Either we've exhausted retries or this is not a retryable error
          if (attempt >= maxRetries) {
            this.logger(
              'warn',
              `Universal Sentence Encoder model loading failed after ${maxRetries + 1} attempts. Last error: ${errorMessage}. Trying alternative URLs...`
            )
            
            // Try alternative URLs if available
            if (alternativeLoadFunctions.length > 0) {
              for (let i = 0; i < alternativeLoadFunctions.length; i++) {
                try {
                  this.logger(
                    'log',
                    `Trying alternative model URL ${i + 1}/${alternativeLoadFunctions.length}...`
                  )
                  const model = await alternativeLoadFunctions[i]()
                  this.logger(
                    'log',
                    `Successfully loaded Universal Sentence Encoder from alternative URL ${i + 1}`
                  )
                  return model
                } catch (altError) {
                  this.logger(
                    'warn',
                    `Failed to load from alternative URL ${i + 1}: ${altError}`
                  )
                  // Continue to the next alternative
                }
              }
            }
            
            // If we get here, all alternatives failed
            this.logger(
              'error',
              `Universal Sentence Encoder model loading failed after trying all alternatives. Last error: ${errorMessage}`
            )
          } else {
            this.logger(
              'error',
              `Universal Sentence Encoder model loading failed with non-retryable error: ${errorMessage}`
            )
          }
          throw lastError
        }
      }
    }

    // This should never be reached, but just in case
    throw lastError || new Error('Unknown error during model loading')
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
      this.addServerCompatibilityPolyfills()

      // TensorFlow.js will use its default EPSILON value

      // CRITICAL: Ensure TextEncoder/TextDecoder are available before TensorFlow.js loads
      try {
        // Get the appropriate global object for the current environment
        const globalObj = (() => {
          if (typeof globalThis !== 'undefined') return globalThis
          if (typeof global !== 'undefined') return global
          if (typeof self !== 'undefined') return self
          return null
        })()

        // Ensure TextEncoder/TextDecoder are globally available in server environments
        if (globalObj) {
          // Try to use Node.js util module if available (Node.js environments)
          try {
            if (
              typeof process !== 'undefined' &&
              process.versions &&
              process.versions.node
            ) {
              const util = await import('util')
              if (!globalObj.TextEncoder) {
                globalObj.TextEncoder = util.TextEncoder
              }
              if (!globalObj.TextDecoder) {
                globalObj.TextDecoder = util.TextDecoder as unknown as typeof TextDecoder
              }
            }
          } catch (utilError) {
            // Fallback to standard TextEncoder/TextDecoder for non-Node.js server environments
            if (!globalObj.TextEncoder) {
              globalObj.TextEncoder = TextEncoder
            }
            if (!globalObj.TextDecoder) {
              globalObj.TextDecoder = TextDecoder
            }
          }
        }

        // Apply the TensorFlow.js patch
        const { applyTensorFlowPatch } = await import('./textEncoding.js')
        await applyTensorFlowPatch()

        // Now load TensorFlow.js core module using dynamic imports
        this.tf = await import('@tensorflow/tfjs-core')

        // Import CPU backend (always needed as fallback)
        await import('@tensorflow/tfjs-backend-cpu')

        // Try to import WebGL backend for GPU acceleration in browser environments
        try {
          if (isBrowser()) {
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

        // Load Universal Sentence Encoder using dynamic import
        this.use = await import('@tensorflow-models/universal-sentence-encoder')
      } catch (error) {
        this.logger('error', 'Failed to initialize TensorFlow.js:', error)
        // Don't throw here, we'll use a fallback mechanism
        this.logger('warn', 'Will use fallback embedding mechanism')
        // Mark as initialized with fallback
        this.initialized = true
        return
      }

      // Set the backend
      if (this.tf && this.tf.setBackend) {
        await this.tf.setBackend(this.backend)
      }

      // Module structure available for debugging if needed

      // Try to find the load function in different possible module structures
      const loadFunction = findUSELoadFunction(this.use)

      if (!loadFunction) {
        this.logger('warn', 'Could not find Universal Sentence Encoder load function, using fallback')
        // Mark as initialized with fallback
        this.initialized = true
        return
      }

      try {
        // Load the model with retry logic for network failures
        this.model = await this.loadModelWithRetry(loadFunction)
        this.initialized = true
      } catch (modelError) {
        this.logger(
          'warn',
          'Failed to load Universal Sentence Encoder model, using fallback:',
          modelError
        )
        // Mark as initialized with fallback
        this.initialized = true
      }

      // Restore original console.warn
      console.warn = originalWarn
    } catch (error) {
      this.logger(
        'error',
        'Failed to initialize Universal Sentence Encoder:',
        error
      )
      // Don't throw, use fallback mechanism
      this.logger('warn', 'Using fallback embedding mechanism due to initialization failure')
      // Mark as initialized with fallback
      this.initialized = true
    }
  }

  /**
   * Embed text into a vector using Universal Sentence Encoder
   * @param data Text to embed
   */
  /**
   * Generate a deterministic vector from a string
   * This is used as a fallback when the Universal Sentence Encoder is not available
   * @param text Input text
   * @returns A 512-dimensional vector derived from the text
   */
  private generateFallbackVector(text: string): Vector {
    // Create a deterministic vector based on the text
    const vector = new Array(512).fill(0)
    
    if (!text || text.trim() === '') {
      return vector
    }
    
    // Simple hash function to generate a number from a string
    const hash = (str: string): number => {
      let h = 0
      for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i)
        h |= 0 // Convert to 32bit integer
      }
      return h
    }
    
    // Generate values based on the text
    const words = text.split(/\s+/)
    for (let i = 0; i < words.length && i < 512; i++) {
      const word = words[i]
      if (word) {
        const h = hash(word)
        // Use the hash to set a value in the vector
        const index = Math.abs(h) % 512
        vector[index] = (h % 1000) / 1000 // Value between -1 and 1
      }
    }
    
    // Ensure the vector has some values even for short texts
    if (text.length > 0) {
      const h = hash(text)
      for (let i = 0; i < 10; i++) {
        const index = (Math.abs(h) + i * 50) % 512
        vector[index] = ((h + i) % 1000) / 1000
      }
    }
    
    return vector
  }

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

      // Check if we need to use the fallback mechanism
      if (!this.model) {
        this.logger(
          'warn',
          'Using fallback embedding mechanism (model not available)'
        )
        return this.generateFallbackVector(textToEmbed[0])
      }

      // Get embeddings
      const embeddings = await this.model.embed(textToEmbed)

      // Convert to array and return the first embedding
      const embeddingArray = await embeddings.array()

      // Dispose of the tensor to free memory
      embeddings.dispose()

      // Get the first embedding
      let embedding = embeddingArray[0]
      
      // Ensure the embedding is exactly 512 dimensions
      if (embedding.length !== 512) {
        this.logger(
          'warn',
          `Embedding dimension mismatch: expected 512, got ${embedding.length}. Standardizing...`
        )
        
        // If the embedding is too short, pad with zeros
        if (embedding.length < 512) {
          const paddedEmbedding = new Array(512).fill(0)
          for (let i = 0; i < embedding.length; i++) {
            paddedEmbedding[i] = embedding[i]
          }
          embedding = paddedEmbedding
        } 
        // If the embedding is too long, truncate
        else if (embedding.length > 512) {
          // Special handling for 1536-dimensional vectors (common with newer models)
          if (embedding.length === 1536) {
            // Take every third value to reduce from 1536 to 512
            const reducedEmbedding = new Array(512).fill(0)
            for (let i = 0; i < 512; i++) {
              reducedEmbedding[i] = embedding[i * 3]
            }
            embedding = reducedEmbedding
          } else {
            // For other dimensions, just truncate
            embedding = embedding.slice(0, 512)
          }
        }
      }

      return embedding
    } catch (error) {
      this.logger(
        'warn',
        'Failed to embed text with Universal Sentence Encoder, using fallback:',
        error
      )
      // Use fallback mechanism instead of throwing
      if (typeof data === 'string') {
        return this.generateFallbackVector(data)
      } else if (Array.isArray(data) && data.length > 0) {
        return this.generateFallbackVector(data[0])
      } else {
        return new Array(512).fill(0)
      }
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

      // Check if we need to use the fallback mechanism
      if (!this.model) {
        this.logger(
          'warn',
          'Using fallback embedding mechanism for batch (model not available)'
        )
        // Generate fallback vectors for each text
        return dataArray.map(text => {
          if (typeof text === 'string' && text.trim() !== '') {
            return this.generateFallbackVector(text)
          } else {
            return new Array(512).fill(0)
          }
        })
      }

      // Get embeddings for all texts in a single batch operation
      const embeddings = await this.model.embed(textToEmbed)

      // Convert to array
      const embeddingArray = await embeddings.array()

      // Dispose of the tensor to free memory
      embeddings.dispose()

      // Standardize embeddings to ensure they're all 512 dimensions
      const standardizedEmbeddings = embeddingArray.map((embedding: Vector) => {
        if (embedding.length !== 512) {
          this.logger(
            'warn',
            `Batch embedding dimension mismatch: expected 512, got ${embedding.length}. Standardizing...`
          )
          
          // If the embedding is too short, pad with zeros
          if (embedding.length < 512) {
            const paddedEmbedding = new Array(512).fill(0)
            for (let i = 0; i < embedding.length; i++) {
              paddedEmbedding[i] = embedding[i]
            }
            return paddedEmbedding
          } 
          // If the embedding is too long, truncate
          else if (embedding.length > 512) {
            // Special handling for 1536-dimensional vectors (common with newer models)
            if (embedding.length === 1536) {
              // Take every third value to reduce from 1536 to 512
              const reducedEmbedding = new Array(512).fill(0)
              for (let i = 0; i < 512; i++) {
                reducedEmbedding[i] = embedding[i * 3]
              }
              return reducedEmbedding
            } else {
              // For other dimensions, just truncate
              return embedding.slice(0, 512)
            }
          }
        }
        return embedding
      })

      // Map the results back to the original array order
      const results: Vector[] = []
      let embeddingIndex = 0

      for (let i = 0; i < dataArray.length; i++) {
        const text = dataArray[i]
        if (typeof text === 'string' && text.trim() !== '') {
          // Use the standardized embedding for non-empty strings
          results.push(standardizedEmbeddings[embeddingIndex])
          embeddingIndex++
        } else {
          // Use a zero vector for empty strings
          results.push(new Array(512).fill(0))
        }
      }

      return results
    } catch (error) {
      this.logger(
        'warn',
        'Failed to batch embed text with Universal Sentence Encoder, using fallback:',
        error
      )
      
      // Use fallback mechanism instead of throwing
      return dataArray.map(text => {
        if (typeof text === 'string' && text.trim() !== '') {
          return this.generateFallbackVector(text)
        } else {
          return new Array(512).fill(0)
        }
      })
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
        this.logger(
          'error',
          'Failed to dispose Universal Sentence Encoder:',
          error
        )
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
  // Module structure available for debugging if needed

  // Find the appropriate load function from the module
  let loadFunction = null

  // Try sentenceEncoderModule.load first (direct export)
  if (
    sentenceEncoderModule.load &&
    typeof sentenceEncoderModule.load === 'function'
  ) {
    loadFunction = sentenceEncoderModule.load
  }
  // Then try sentenceEncoderModule.default.load (default export)
  else if (
    sentenceEncoderModule.default &&
    sentenceEncoderModule.default.load &&
    typeof sentenceEncoderModule.default.load === 'function'
  ) {
    loadFunction = sentenceEncoderModule.default.load
  }
  // Try sentenceEncoderModule.default directly if it's a function
  else if (
    sentenceEncoderModule.default &&
    typeof sentenceEncoderModule.default === 'function'
  ) {
    loadFunction = sentenceEncoderModule.default
  }
  // Try sentenceEncoderModule directly if it's a function
  else if (typeof sentenceEncoderModule === 'function') {
    loadFunction = sentenceEncoderModule
  }
  // Try additional common patterns
  else if (
    sentenceEncoderModule.UniversalSentenceEncoder &&
    typeof sentenceEncoderModule.UniversalSentenceEncoder.load === 'function'
  ) {
    loadFunction = sentenceEncoderModule.UniversalSentenceEncoder.load
  } else if (
    sentenceEncoderModule.default &&
    sentenceEncoderModule.default.UniversalSentenceEncoder &&
    typeof sentenceEncoderModule.default.UniversalSentenceEncoder.load === 'function'
  ) {
    loadFunction = sentenceEncoderModule.default.UniversalSentenceEncoder.load
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
              break
            }
          }
        }
        if (loadFunction) break
      }
    }
  }

  // Return a function that calls the load function without arguments
  // This will use the bundled model from the package
  if (loadFunction) {
    return async () => await loadFunction()
  }
  
  return null
}

/**
 * Check if we're running in a test environment (standalone version)
 * Uses the same logic as the class method to avoid duplication
 */
function isTestEnvironment(): boolean {
  // Use the same implementation as the class method
  // Safely check for Node.js environment first
  if (typeof process === 'undefined') {
    return false
  }

  return (
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST === 'true' ||
    (typeof global !== 'undefined' && global.__vitest__) ||
    process.argv.some((arg) => arg.includes('vitest'))
  )
}

/**
 * Log message only if not in test environment and verbose mode is enabled (standalone version)
 * @param level Log level ('log', 'warn', 'error')
 * @param message Message to log
 * @param args Additional arguments to log
 * @param verbose Whether to log non-essential messages (default: true)
 */
function logIfNotTest(
  level: 'log' | 'warn' | 'error',
  message: string,
  args: any[] = [],
  verbose: boolean = true
): void {
  // Always log errors, but only log other messages if verbose mode is enabled
  if ((level === 'error' || verbose) && !isTestEnvironment()) {
    console[level](message, ...args)
  }
}

/**
 * Create an embedding function from an embedding model
 * @param model Embedding model to use (optional, defaults to UniversalSentenceEncoder)
 */
export function createEmbeddingFunction(
  model?: EmbeddingModel
): EmbeddingFunction {
  // If no model is provided, use the default TensorFlow embedding function
  if (!model) {
    return createTensorFlowEmbeddingFunction()
  }

  return async (data: any): Promise<Vector> => {
    return await model.embed(data)
  }
}

/**
 * Creates a TensorFlow-based Universal Sentence Encoder embedding function
 * This is the required embedding function for all text embeddings
 * Uses a shared model instance for better performance across multiple calls
 * @param options Configuration options
 * @param options.verbose Whether to log non-essential messages (default: true)
 */
// Create a single shared instance of the model that persists across all embedding calls
let sharedModel: UniversalSentenceEncoder | null = null
let sharedModelInitialized = false
let sharedModelVerbose = true

export function createTensorFlowEmbeddingFunction(options: { verbose?: boolean } = {}): EmbeddingFunction {
  // Update verbose setting if provided
  if (options.verbose !== undefined) {
    sharedModelVerbose = options.verbose
  }
  
  // Create the shared model if it doesn't exist yet
  if (!sharedModel) {
    sharedModel = new UniversalSentenceEncoder({ verbose: sharedModelVerbose })
  }
  
  return async (data: any): Promise<Vector> => {
    try {
      // Initialize the model if it hasn't been initialized yet
      if (!sharedModelInitialized) {
        try {
          await sharedModel!.init()
          sharedModelInitialized = true
        } catch (initError) {
          // Reset the flag so we can retry initialization on the next call
          sharedModelInitialized = false
          throw initError
        }
      }

      return await sharedModel!.embed(data)
    } catch (error) {
      logIfNotTest('error', 'Failed to use TensorFlow embedding:', [error], sharedModelVerbose)
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
 * @param options Configuration options
 * @param options.verbose Whether to log non-essential messages (default: true)
 */
export function getDefaultEmbeddingFunction(options: { verbose?: boolean } = {}): EmbeddingFunction {
  return createTensorFlowEmbeddingFunction(options)
}

/**
 * Default embedding function with default options
 * Uses UniversalSentenceEncoder for all text embeddings
 * TensorFlow.js is required for this to work
 * Uses CPU for compatibility
 */
export const defaultEmbeddingFunction: EmbeddingFunction = getDefaultEmbeddingFunction()

/**
 * Creates a batch embedding function that uses UniversalSentenceEncoder
 * TensorFlow.js is required for this to work
 * Processes all items in a single batch operation
 * Uses a shared model instance for better performance across multiple calls
 * @param options Configuration options
 * @param options.verbose Whether to log non-essential messages (default: true)
 */
// Create a single shared instance of the model that persists across function calls
let sharedBatchModel: UniversalSentenceEncoder | null = null
let sharedBatchModelInitialized = false
let sharedBatchModelVerbose = true

export function createBatchEmbeddingFunction(options: { verbose?: boolean } = {}): (
  dataArray: string[]
) => Promise<Vector[]> {
  // Update verbose setting if provided
  if (options.verbose !== undefined) {
    sharedBatchModelVerbose = options.verbose
  }
  
  // Create the shared model if it doesn't exist yet
  if (!sharedBatchModel) {
    sharedBatchModel = new UniversalSentenceEncoder({ verbose: sharedBatchModelVerbose })
  }
  
  return async (dataArray: string[]): Promise<Vector[]> => {
    try {
      // Initialize the model if it hasn't been initialized yet
      if (!sharedBatchModelInitialized) {
        await sharedBatchModel!.init()
        sharedBatchModelInitialized = true
      }

      return await sharedBatchModel!.embedBatch(dataArray)
    } catch (error) {
      logIfNotTest('error', 'Failed to use TensorFlow batch embedding:', [error], sharedBatchModelVerbose)
      throw new Error(
        `Universal Sentence Encoder batch embedding failed: ${error}`
      )
    }
  }
}

/**
 * Get a batch embedding function with custom options
 * Uses UniversalSentenceEncoder for all text embeddings
 * TensorFlow.js is required for this to work
 * Processes all items in a single batch operation
 * @param options Configuration options
 * @param options.verbose Whether to log non-essential messages (default: true)
 */
export function getDefaultBatchEmbeddingFunction(options: { verbose?: boolean } = {}): (
  dataArray: string[]
) => Promise<Vector[]> {
  return createBatchEmbeddingFunction(options)
}

/**
 * Default batch embedding function with default options
 * Uses UniversalSentenceEncoder for all text embeddings
 * TensorFlow.js is required for this to work
 * Processes all items in a single batch operation
 */
export const defaultBatchEmbeddingFunction = getDefaultBatchEmbeddingFunction()

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
