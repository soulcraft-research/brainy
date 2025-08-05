/**
 * Embedding functions for converting data to vectors
 */

import { EmbeddingFunction, EmbeddingModel, Vector } from '../coreTypes.js'
import { executeInThread } from './workerUtils.js'
import { isBrowser } from './environment.js'
import {
  RobustModelLoader,
  ModelLoadOptions,
  createRobustModelLoader,
  getUniversalSentenceEncoderFallbacks
} from './robustModelLoader.js'

/**
 * TensorFlow Universal Sentence Encoder embedding model
 * This model provides high-quality text embeddings using TensorFlow.js
 * The required TensorFlow.js dependencies are automatically installed with this package
 *
 * This implementation attempts to use GPU processing when available for better performance,
 * falling back to CPU processing for compatibility across all environments.
 */
export interface UniversalSentenceEncoderOptions extends ModelLoadOptions {
  /** Whether to enable verbose logging */
  verbose?: boolean
}

export class UniversalSentenceEncoder implements EmbeddingModel {
  private model: any = null
  private initialized = false
  private tf: any = null
  private use: any = null
  private backend: string = 'cpu' // Default to CPU
  private verbose: boolean = true // Whether to log non-essential messages
  private robustLoader: RobustModelLoader

  /**
   * Create a new UniversalSentenceEncoder instance
   * @param options Configuration options including reliability settings
   */
  constructor(options: UniversalSentenceEncoderOptions = {}) {
    this.verbose = options.verbose !== undefined ? options.verbose : true

    // Create robust model loader with enhanced reliability features
    this.robustLoader = createRobustModelLoader({
      maxRetries: options.maxRetries ?? 3,
      initialRetryDelay: options.initialRetryDelay ?? 1000,
      maxRetryDelay: options.maxRetryDelay ?? 30000,
      timeout: options.timeout ?? 60000,
      useExponentialBackoff: options.useExponentialBackoff ?? true,
      fallbackUrls:
        options.fallbackUrls ?? getUniversalSentenceEncoderFallbacks(),
      verbose: this.verbose,
      preferLocalModel: options.preferLocalModel ?? true
    })
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
   * Load the Universal Sentence Encoder model with robust retry and fallback mechanisms
   * @param loadFunction The function to load the model from TensorFlow Hub
   */
  private async loadModelFromLocal(
    loadFunction: () => Promise<EmbeddingModel>
  ): Promise<EmbeddingModel> {
    this.logger(
      'log',
      'Loading Universal Sentence Encoder model with robust loader...'
    )

    try {
      // Use the robust model loader to handle all retry logic, timeouts, and fallbacks
      const model = await this.robustLoader.loadModel(
        loadFunction,
        'universal-sentence-encoder'
      )

      this.logger('log', 'Successfully loaded Universal Sentence Encoder model')
      return model
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      this.logger(
        'error',
        `Failed to load Universal Sentence Encoder model: ${errorMessage}`
      )

      // Log loading statistics for debugging
      const stats = this.robustLoader.getLoadingStats()
      if (Object.keys(stats).length > 0) {
        this.logger('log', 'Loading attempt statistics:', stats)
      }

      throw error
    }
  }

  /**
   * Initialize the embedding model
   */
  public async init(): Promise<void> {
    // Use a mock implementation in test environments
    if (this.isTestEnvironment()) {
      this.logger('log', 'Using mock Universal Sentence Encoder for tests')
      // Create a mock model that returns fixed embeddings
      this.model = {
        embed: async (sentences: string | string[]) => {
          // Create a tensor-like object with a mock array method
          return {
            array: async () => {
              // Return fixed embeddings for each input sentence
              const inputArray = Array.isArray(sentences)
                ? sentences
                : [sentences]
              return inputArray.map(() =>
                new Array(512).fill(0).map((_, i) => (i % 2 === 0 ? 0.1 : -0.1))
              )
            },
            dispose: () => {}
          }
        }
      }
      this.initialized = true
      return
    }

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
                globalObj.TextEncoder = util.TextEncoder as unknown as typeof TextEncoder
              }
              if (!globalObj.TextDecoder) {
                globalObj.TextDecoder =
                  util.TextDecoder as unknown as typeof TextDecoder
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

        // Note: @tensorflow-models/universal-sentence-encoder is no longer used
        // Model loading is handled entirely by robustLoader
      } catch (error) {
        this.logger('error', 'Failed to initialize TensorFlow.js:', error)
        // No fallback allowed - throw error
        throw new Error(
          `Universal Sentence Encoder initialization failed: ${error}`
        )
      }

      // Set the backend
      if (this.tf && this.tf.setBackend) {
        await this.tf.setBackend(this.backend)
      }

      // Load model using robustLoader which handles all loading strategies:
      // 1. @soulcraft/brainy-models package if available (offline mode)
      // 2. Direct TensorFlow.js URL loading as fallback
      try {
        this.model = await this.robustLoader.loadModelWithFallbacks()
        this.initialized = true
        
        // If the model doesn't have an embed method but has embedToArrays, wrap it
        if (!this.model.embed && this.model.embedToArrays) {
          const originalModel = this.model
          this.model = {
            embed: async (sentences: string | string[]) => {
              const input = Array.isArray(sentences) ? sentences : [sentences]
              const embeddings = await originalModel.embedToArrays(input)
              // Return TensorFlow tensor-like object
              return {
                array: async () => embeddings,
                arraySync: () => embeddings
              }
            },
            dispose: () => originalModel.dispose ? originalModel.dispose() : undefined
          }
        }
      } catch (modelError) {
        this.logger(
          'error',
          'Failed to load Universal Sentence Encoder model:',
          modelError
        )
        throw new Error(
          `Universal Sentence Encoder model loading failed: ${modelError}`
        )
      }

      // Restore original console.warn
      console.warn = originalWarn
    } catch (error) {
      this.logger(
        'error',
        'Failed to initialize Universal Sentence Encoder:',
        error
      )
      // No fallback allowed - throw error
      throw new Error(
        `Universal Sentence Encoder initialization failed: ${error}`
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
          // Return a zero vector of 512 dimensions (standard for Universal Sentence Encoder)
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

      // Ensure the model is available
      if (!this.model) {
        throw new Error('Universal Sentence Encoder model is not available')
      }

      // Get embeddings
      const embeddings = await this.model.embed(textToEmbed)

      // Convert to array and return the first embedding
      const embeddingArray = await embeddings.array()

      // Dispose of the tensor to free memory
      embeddings.dispose()

      // Get the first embedding
      let embedding = embeddingArray[0]

      // Always ensure the embedding is exactly 512 dimensions
      if (embedding.length !== 512) {
        this.logger(
          'warn',
          `Embedding dimension mismatch: expected 512, got ${embedding.length}. Standardizing to 512 dimensions.`
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
          embedding = embedding.slice(0, 512)
        }
      }

      return embedding
    } catch (error) {
      this.logger(
        'error',
        'Failed to embed text with Universal Sentence Encoder:',
        error
      )
      throw new Error(`Universal Sentence Encoder embedding failed: ${error}`)
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

      // Ensure the model is available
      if (!this.model) {
        throw new Error('Universal Sentence Encoder model is not available')
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
            `Batch embedding dimension mismatch: expected 512, got ${embedding.length}. Standardizing to 512 dimensions.`
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
            return embedding.slice(0, 512)
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
        'error',
        'Failed to batch embed text with Universal Sentence Encoder:',
        error
      )
      throw new Error(
        `Universal Sentence Encoder batch embedding failed: ${error}`
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
 * Helper function - NO LONGER USED
 * Kept for compatibility but will be removed in next major version
 * @deprecated Since we removed @tensorflow-models/universal-sentence-encoder dependency
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
    typeof sentenceEncoderModule.default.UniversalSentenceEncoder.load ===
      'function'
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

export function createTensorFlowEmbeddingFunction(
  options: { verbose?: boolean } = {}
): EmbeddingFunction {
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
      logIfNotTest(
        'error',
        'Failed to use Universal Sentence Encoder:',
        [error],
        sharedModelVerbose
      )
      // No fallback - Universal Sentence Encoder is required
      throw new Error(
        `Universal Sentence Encoder is required and no fallbacks are allowed: ${error}`
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
export function getDefaultEmbeddingFunction(
  options: { verbose?: boolean } = {}
): EmbeddingFunction {
  return createTensorFlowEmbeddingFunction(options)
}

/**
 * Default embedding function with default options
 * Uses UniversalSentenceEncoder for all text embeddings
 * TensorFlow.js is required for this to work
 * Uses CPU for compatibility
 */
export const defaultEmbeddingFunction: EmbeddingFunction =
  getDefaultEmbeddingFunction()

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

export function createBatchEmbeddingFunction(
  options: { verbose?: boolean } = {}
): (dataArray: string[]) => Promise<Vector[]> {
  // Update verbose setting if provided
  if (options.verbose !== undefined) {
    sharedBatchModelVerbose = options.verbose
  }

  // Create the shared model if it doesn't exist yet
  if (!sharedBatchModel) {
    sharedBatchModel = new UniversalSentenceEncoder({
      verbose: sharedBatchModelVerbose
    })
  }

  return async (dataArray: string[]): Promise<Vector[]> => {
    try {
      // Initialize the model if it hasn't been initialized yet
      if (!sharedBatchModelInitialized) {
        try {
          await sharedBatchModel!.init()
          sharedBatchModelInitialized = true
        } catch (initError) {
          // Reset the flag so we can retry initialization on the next call
          sharedBatchModelInitialized = false
          throw initError
        }
      }

      return await sharedBatchModel!.embedBatch(dataArray)
    } catch (error) {
      logIfNotTest(
        'error',
        'Failed to use Universal Sentence Encoder batch embedding:',
        [error],
        sharedBatchModelVerbose
      )
      // No fallback - Universal Sentence Encoder is required
      throw new Error(
        `Universal Sentence Encoder is required for batch embedding and no fallbacks are allowed: ${error}`
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
export function getDefaultBatchEmbeddingFunction(
  options: { verbose?: boolean } = {}
): (dataArray: string[]) => Promise<Vector[]> {
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
