/**
 * Robust Model Loader - Enhanced model loading with retry mechanisms and fallbacks
 * 
 * This module provides a more reliable way to load TensorFlow models with:
 * - Exponential backoff retry mechanisms
 * - Timeout handling
 * - Multiple fallback strategies
 * - Better error handling and logging
 * - Optional local model bundling support
 */

import { EmbeddingModel } from '../coreTypes.js'

// Import the findUSELoadFunction from embedding.ts
// We need to access it directly since it's not exported
// For now, we'll implement a similar function locally

export interface ModelLoadOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number
  /** Initial retry delay in milliseconds */
  initialRetryDelay?: number
  /** Maximum retry delay in milliseconds */
  maxRetryDelay?: number
  /** Request timeout in milliseconds */
  timeout?: number
  /** Whether to use exponential backoff */
  useExponentialBackoff?: boolean
  /** Fallback model URLs to try if primary fails */
  fallbackUrls?: string[]
  /** Whether to enable verbose logging */
  verbose?: boolean
  /** Whether to prefer local bundled model if available */
  preferLocalModel?: boolean
  /** Custom directory path where models are stored (for Docker deployments) */
  customModelsPath?: string
}

export interface RetryConfig {
  attempt: number
  maxRetries: number
  delay: number
  error: Error
}

export class RobustModelLoader {
  private options: Required<Omit<ModelLoadOptions, 'customModelsPath'>> & { customModelsPath?: string }
  private loadAttempts: Map<string, number> = new Map()

  constructor(options: ModelLoadOptions = {}) {
    // Check for environment variables
    const envModelsPath = process.env.BRAINY_MODELS_PATH || process.env.MODELS_PATH
    
    // Auto-detect if we need to use an auto-extracted models directory
    const autoDetectedPath = this.autoDetectModelsPath()
    
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      initialRetryDelay: options.initialRetryDelay ?? 1000,
      maxRetryDelay: options.maxRetryDelay ?? 30000,
      timeout: options.timeout ?? 60000, // 60 seconds
      useExponentialBackoff: options.useExponentialBackoff ?? true,
      fallbackUrls: options.fallbackUrls ?? [],
      verbose: options.verbose ?? false,
      preferLocalModel: options.preferLocalModel ?? true,
      customModelsPath: options.customModelsPath ?? envModelsPath ?? autoDetectedPath
    }
  }

  /**
   * Auto-detect extracted models directory
   */
  private autoDetectModelsPath(): string | undefined {
    try {
      // Check if we're in Node.js environment
      const isNode = typeof process !== 'undefined' && 
                     process.versions != null && 
                     process.versions.node != null

      if (!isNode) {
        return undefined
      }

      // Try to detect extracted models directory
      const possiblePaths = [
        // Standard extraction location
        './models',
        '../models',
        '/app/models',
        // Project root relative paths
        process.cwd() + '/models',
        // Docker/container standard paths
        '/usr/src/app/models',
        '/home/app/models'
      ]

      // Use require to access fs and path synchronously (only in Node.js)
      let fs: any, path: any
      try {
        fs = require('fs')
        path = require('path')
      } catch (error) {
        // If require fails, we're probably in a browser environment
        return undefined
      }

      for (const modelPath of possiblePaths) {
        try {
          // Check for marker file that indicates successful extraction
          const markerFile = path.join(modelPath, '.brainy-models-extracted')
          if (fs.existsSync(markerFile)) {
            console.log(`🎯 Auto-detected extracted models at: ${modelPath}`)
            return modelPath
          }

          // Fallback: check for universal-sentence-encoder directory
          const useDir = path.join(modelPath, 'universal-sentence-encoder')
          const modelJson = path.join(useDir, 'model.json')
          if (fs.existsSync(modelJson)) {
            console.log(`🎯 Auto-detected models directory at: ${modelPath}`)
            return modelPath
          }
        } catch (error) {
          continue
        }
      }

      return undefined
    } catch (error) {
      return undefined
    }
  }

  /**
   * Load model with all available fallback strategies
   */
  async loadModelWithFallbacks(): Promise<EmbeddingModel> {
    const startTime = Date.now()
    this.log('Starting model loading with all fallback strategies')
    
    // Try local bundled model first (from @soulcraft/brainy-models if available)
    const localModel = await this.tryLoadLocalBundledModel()
    if (localModel) {
      const loadTime = Date.now() - startTime
      this.log(`✅ Model loaded successfully from local bundle in ${loadTime}ms`)
      return localModel
    }
    
    // Fallback to loading from URLs
    console.warn('⚠️ Local model not found. Falling back to remote model loading.')
    console.warn('   For best performance and reliability:')
    console.warn('   1. Install @soulcraft/brainy-models: npm install @soulcraft/brainy-models')
    console.warn('   2. Or set BRAINY_MODELS_PATH environment variable for Docker deployments')
    console.warn('   3. Or use customModelsPath option in RobustModelLoader')
    
    const fallbackUrls = getUniversalSentenceEncoderFallbacks()
    for (const url of fallbackUrls) {
      try {
        this.log(`Attempting to load model from: ${url}`)
        const model = await this.withTimeout(this.loadFromUrl(url), this.options.timeout)
        const loadTime = Date.now() - startTime
        
        // Verify it's the correct model by checking if it can embed text
        try {
          const testEmbedding = await model.embed('test')
          if (!testEmbedding || (Array.isArray(testEmbedding) && testEmbedding.length !== 512)) {
            throw new Error(`Model verification failed: incorrect embedding dimensions (expected 512, got ${Array.isArray(testEmbedding) ? testEmbedding.length : 'invalid'})`)
          }
        } catch (verifyError) {
          console.warn(`⚠️ Model verification failed for ${url}: ${verifyError}`)
          continue
        }
        
        console.warn(`✅ Successfully loaded Universal Sentence Encoder from remote URL: ${url}`)
        console.warn(`   Load time: ${loadTime}ms`)
        return model
      } catch (error) {
        this.log(`Failed to load from ${url}: ${error}`)
      }
    }
    
    throw new Error('Failed to load model from all available sources')
  }

  /**
   * Load a model with robust retry and fallback mechanisms
   */
  async loadModel(
    primaryLoadFunction: () => Promise<EmbeddingModel>,
    modelIdentifier: string = 'default'
  ): Promise<EmbeddingModel> {
    const startTime = Date.now()
    this.log(`Starting robust model loading for: ${modelIdentifier}`)

    // Try local bundled model first if preferred
    if (this.options.preferLocalModel) {
      try {
        const localModel = await this.tryLoadLocalBundledModel()
        if (localModel) {
          this.log(`Successfully loaded local bundled model in ${Date.now() - startTime}ms`)
          return localModel
        }
      } catch (error) {
        this.log(`Local bundled model not available: ${error}`)
      }
    }

    // Try primary load function with retries
    try {
      const model = await this.loadWithRetries(
        primaryLoadFunction,
        `primary-${modelIdentifier}`
      )
      this.log(`Successfully loaded model via primary method in ${Date.now() - startTime}ms`)
      return model
    } catch (primaryError) {
      this.log(`Primary model loading failed: ${primaryError}`)

      // Try fallback URLs if available
      for (let i = 0; i < this.options.fallbackUrls.length; i++) {
        const fallbackUrl = this.options.fallbackUrls[i]
        this.log(`Trying fallback URL ${i + 1}/${this.options.fallbackUrls.length}: ${fallbackUrl}`)

        try {
          const fallbackModel = await this.loadWithRetries(
            () => this.loadFromUrl(fallbackUrl),
            `fallback-${i}-${modelIdentifier}`
          )
          this.log(`Successfully loaded model via fallback ${i + 1} in ${Date.now() - startTime}ms`)
          return fallbackModel
        } catch (fallbackError) {
          this.log(`Fallback ${i + 1} failed: ${fallbackError}`)
        }
      }

      // All attempts failed
      const totalTime = Date.now() - startTime
      const errorMessage = `All model loading attempts failed after ${totalTime}ms. Primary error: ${primaryError}`
      this.log(errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * Load a model with retry logic and exponential backoff
   */
  private async loadWithRetries(
    loadFunction: () => Promise<EmbeddingModel>,
    identifier: string
  ): Promise<EmbeddingModel> {
    let lastError: Error
    const currentAttempts = this.loadAttempts.get(identifier) || 0

    for (let attempt = currentAttempts; attempt <= this.options.maxRetries; attempt++) {
      this.loadAttempts.set(identifier, attempt)

      try {
        this.log(`Attempt ${attempt + 1}/${this.options.maxRetries + 1} for ${identifier}`)

        // Apply timeout to the load function
        const model = await this.withTimeout(loadFunction(), this.options.timeout)
        
        // Success - clear attempt counter
        this.loadAttempts.delete(identifier)
        return model

      } catch (error) {
        lastError = error as Error
        this.log(`Attempt ${attempt + 1} failed: ${lastError.message}`)

        // Don't retry on the last attempt
        if (attempt === this.options.maxRetries) {
          break
        }

        // Calculate delay for next attempt
        const delay = this.calculateRetryDelay(attempt)
        this.log(`Retrying in ${delay}ms...`)

        // Wait before next attempt
        await this.sleep(delay)
      }
    }

    // All retries exhausted
    this.loadAttempts.delete(identifier)
    throw lastError!
  }

  /**
   * Try to load a locally bundled model
   */
  private async tryLoadLocalBundledModel(): Promise<EmbeddingModel | null> {
    try {
      // First, try custom models directory if specified (for Docker deployments)
      if (this.options.customModelsPath) {
        console.log(`Checking custom models directory: ${this.options.customModelsPath}`)
        const customModel = await this.tryLoadFromCustomPath(this.options.customModelsPath)
        if (customModel) {
          console.log('✅ Successfully loaded model from custom directory')
          console.log('   Using custom model path for Docker/production deployment')
          return customModel
        }
      }

      // Second, try to use @soulcraft/brainy-models package if available
      try {
        console.log('Checking for @soulcraft/brainy-models package...')
        // Use dynamic import with string literal to avoid TypeScript compilation errors for optional dependency
        const packageName = '@soulcraft/brainy-models'
        const brainyModels = await import(packageName).catch(() => null)
        
        if (brainyModels?.BundledUniversalSentenceEncoder) {
          console.log('✅ Found @soulcraft/brainy-models package installed')
          console.log('   Using local bundled model for maximum performance and reliability')
          
          try {
            const encoder = new brainyModels.BundledUniversalSentenceEncoder({ 
              verbose: this.options.verbose,
              preferCompressed: false 
            })
            
            // Log metadata if available
            if (encoder.metadata) {
              console.log('📋 Model metadata:', encoder.metadata)
            }
            
            await encoder.load()
            console.log('✅ Local Universal Sentence Encoder model loaded successfully')
            
            // Return a wrapper that matches the Universal Sentence Encoder interface
            return {
              init: async () => {
                // Already initialized
              },
              embed: async (sentences: string | string[]) => {
                const input = Array.isArray(sentences) ? sentences : [sentences]
                const embeddings = await encoder.embedToArrays(input)
                
                // Return the first embedding as a Vector (number[])
                return embeddings[0] || []
              },
              dispose: async () => {
                encoder.dispose()
              }
            }
          } catch (loadError) {
            console.error('Failed to load bundled model:', loadError)
            // Try alternative loading method if available
            if (brainyModels.loadUniversalSentenceEncoder) {
              console.log('Trying alternative loading method...')
              try {
                const model = await brainyModels.loadUniversalSentenceEncoder({
                  verbose: this.options.verbose
                })
                console.log('✅ Loaded via alternative method')
                return model
              } catch (altError) {
                console.error('Alternative loading failed:', altError)
              }
            }
          }
        }
      } catch (importError) {
        this.log(`@soulcraft/brainy-models not available: ${importError}`)
      }

      // Check if we're in Node.js environment
      const isNode = typeof process !== 'undefined' && 
                     process.versions != null && 
                     process.versions.node != null

      if (isNode) {
        try {
          // Try to load from bundled model directory
          // Use dynamic import with a non-literal string to prevent Rollup from bundling these
          const pathModule = 'path'
          const fsModule = 'fs'
          const urlModule = 'url'
          
          const path = await import(/* @vite-ignore */ pathModule)
          const fs = await import(/* @vite-ignore */ fsModule)
          const { fileURLToPath } = await import(/* @vite-ignore */ urlModule)

        const __filename = fileURLToPath(import.meta.url)
        const __dirname = path.dirname(__filename)

        // Look for bundled model in multiple possible locations
        const possiblePaths = [
          // Direct @soulcraft/brainy-models paths
          path.join(process.cwd(), 'node_modules', '@soulcraft', 'brainy-models', 'models', 'universal-sentence-encoder'),
          path.join(process.cwd(), 'node_modules', '@soulcraft', 'brainy-models', 'universal-sentence-encoder'),
          path.join(__dirname, '..', '..', 'node_modules', '@soulcraft', 'brainy-models', 'models', 'universal-sentence-encoder'),
          path.join(__dirname, '..', '..', 'node_modules', '@soulcraft', 'brainy-models', 'universal-sentence-encoder'),
          // Alternative paths
          path.join(__dirname, '..', '..', 'models', 'bundled', 'universal-sentence-encoder'),
          path.join(__dirname, '..', '..', 'brainy-models-package', 'models', 'universal-sentence-encoder'),
          path.join(process.cwd(), 'brainy-models-package', 'models', 'universal-sentence-encoder'),
          // Check parent directories (for monorepo structures)
          path.join(process.cwd(), '..', 'node_modules', '@soulcraft', 'brainy-models', 'models', 'universal-sentence-encoder'),
          path.join(process.cwd(), '..', '..', 'node_modules', '@soulcraft', 'brainy-models', 'models', 'universal-sentence-encoder')
        ]

        for (const modelPath of possiblePaths) {
          const modelJsonPath = path.join(modelPath, 'model.json')
          if (fs.existsSync(modelJsonPath)) {
            this.log(`Found bundled model at: ${modelJsonPath}`)
            
            // Load TensorFlow.js if not already loaded
            const tf = await import('@tensorflow/tfjs')
            
            // Read the model.json to check the format
            const modelJsonContent = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'))
            
            // Ensure the format field exists for TensorFlow.js compatibility
            if (!modelJsonContent.format) {
              modelJsonContent.format = 'tfjs-graph-model'
              try {
                fs.writeFileSync(modelJsonPath, JSON.stringify(modelJsonContent, null, 2))
                this.log(`✅ Added missing "format" field to model.json for TensorFlow.js compatibility`)
              } catch (writeError) {
                this.log(`⚠️ Could not write format field to model.json: ${writeError}`)
              }
            }
            
            const modelFormat = modelJsonContent.format || 'tfjs-graph-model'
            
            let model
            if (modelFormat === 'tfjs-graph-model') {
              // Use loadGraphModel for graph models
              model = await tf.loadGraphModel(`file://${modelJsonPath}`)
            } else {
              // Use loadLayersModel for layers models (default)
              model = await tf.loadLayersModel(`file://${modelJsonPath}`)
            }
            
            // Return a wrapper that matches the Universal Sentence Encoder interface
            return this.createModelWrapper(model)
          }
        }
        } catch (nodeImportError) {
          this.log(`Could not load Node.js modules in browser: ${nodeImportError}`)
        }
      }

      return null
    } catch (error) {
      this.log(`Error checking for bundled model: ${error}`)
      return null
    }
  }

  /**
   * Try to load model from a custom directory path
   */
  private async tryLoadFromCustomPath(customPath: string): Promise<EmbeddingModel | null> {
    try {
      // Check if we're in Node.js environment
      const isNode = typeof process !== 'undefined' && 
                     process.versions != null && 
                     process.versions.node != null

      if (!isNode) {
        console.log('Custom model path only supported in Node.js environment')
        return null
      }

      // Dynamic imports to avoid bundling issues
      const pathModule = 'path'
      const fsModule = 'fs'
      
      const path = await import(/* @vite-ignore */ pathModule)
      const fs = await import(/* @vite-ignore */ fsModule)

      // Look for models in standard subdirectories
      const possibleModelPaths = [
        // Direct path to universal-sentence-encoder
        path.join(customPath, 'universal-sentence-encoder'),
        // Mirroring @soulcraft/brainy-models structure
        path.join(customPath, 'models', 'universal-sentence-encoder'),
        // TensorFlow hub model structure
        path.join(customPath, 'tfhub', 'universal-sentence-encoder'),
        // Simple models directory
        path.join(customPath, 'use'),
        // Check if customPath itself contains model.json
        customPath
      ]

      for (const modelPath of possibleModelPaths) {
        const modelJsonPath = path.join(modelPath, 'model.json')
        
        if (fs.existsSync(modelJsonPath)) {
          console.log(`Found model at custom path: ${modelJsonPath}`)
          
          // Load TensorFlow.js if not already loaded
          const tf = await import('@tensorflow/tfjs')
          
          // Read and validate the model.json
          const modelJsonContent = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'))
          
          // Ensure the format field exists for TensorFlow.js compatibility
          if (!modelJsonContent.format) {
            modelJsonContent.format = 'tfjs-graph-model'
            try {
              fs.writeFileSync(modelJsonPath, JSON.stringify(modelJsonContent, null, 2))
              console.log(`✅ Added missing "format" field to model.json for TensorFlow.js compatibility`)
            } catch (writeError) {
              console.log(`⚠️ Could not write format field to model.json: ${writeError}`)
            }
          }
          
          const modelFormat = modelJsonContent.format || 'tfjs-graph-model'
          
          let model
          if (modelFormat === 'tfjs-graph-model') {
            // Use loadGraphModel for graph models
            model = await tf.loadGraphModel(`file://${modelJsonPath}`)
          } else {
            // Use loadLayersModel for layers models (default)
            model = await tf.loadLayersModel(`file://${modelJsonPath}`)
          }
          
          // Return a wrapper that matches the Universal Sentence Encoder interface
          return this.createModelWrapper(model)
        }
      }

      console.log(`No model found in custom path: ${customPath}`)
      return null
    } catch (error) {
      console.log(`Error loading from custom path ${customPath}: ${error}`)
      return null
    }
  }

  /**
   * Load model from a specific URL
   */
  private async loadFromUrl(url: string): Promise<EmbeddingModel> {
    try {
      this.log(`Loading model from URL: ${url}`)
      
      // Import TensorFlow.js
      const tf = await import('@tensorflow/tfjs')
      
      // Load the model as a graph model
      const model = await tf.loadGraphModel(url)
      
      this.log(`✅ Successfully loaded model from: ${url}`)
      
      // Return a wrapper that matches the Universal Sentence Encoder interface
      return this.createModelWrapper(model)
    } catch (error) {
      throw new Error(`Failed to load model from ${url}: ${error}`)
    }
  }

  /**
   * Create a model wrapper that matches the Universal Sentence Encoder interface
   */
  private createModelWrapper(tfModel: any): EmbeddingModel {
    return {
      init: async () => {
        // Model is already loaded
      },
      embed: async (sentences: string | string[]) => {
        const tf = await import('@tensorflow/tfjs')
        const input = Array.isArray(sentences) ? sentences : [sentences]
        
        // Universal Sentence Encoder expects tokenized input
        // For the tfhub model, we need to handle text preprocessing
        // The model expects a tensor of strings
        const inputTensor = tf.tensor(input)
        
        try {
          // Run the model prediction
          const embeddings = await tfModel.predict(inputTensor)
          
          // Convert to array and clean up
          const result = await embeddings.array()
          embeddings.dispose()
          inputTensor.dispose()
          
          // Return first embedding if single input, otherwise return all
          return Array.isArray(sentences) ? result : (result[0] || [])
        } catch (error) {
          inputTensor.dispose()
          throw new Error(`Failed to generate embeddings: ${error}`)
        }
      },
      dispose: async () => {
        if (tfModel && tfModel.dispose) {
          tfModel.dispose()
        }
      }
    }
  }

  /**
   * Apply timeout to a promise
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })

    return Promise.race([promise, timeoutPromise])
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    if (!this.options.useExponentialBackoff) {
      return this.options.initialRetryDelay
    }

    // Exponential backoff: delay = initialDelay * (2 ^ attempt) + jitter
    const exponentialDelay = this.options.initialRetryDelay * Math.pow(2, attempt)
    
    // Add jitter (random factor) to prevent thundering herd
    const jitter = Math.random() * 1000
    
    // Cap at maximum delay
    const delay = Math.min(exponentialDelay + jitter, this.options.maxRetryDelay)
    
    return Math.floor(delay)
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Log message if verbose mode is enabled
   */
  private log(message: string): void {
    if (this.options.verbose) {
      console.log(`[RobustModelLoader] ${message}`)
    }
  }

  /**
   * Get loading statistics
   */
  getLoadingStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {}
    for (const [identifier, attempts] of this.loadAttempts.entries()) {
      stats[identifier] = attempts
    }
    return stats
  }

  /**
   * Reset loading statistics
   */
  resetStats(): void {
    this.loadAttempts.clear()
  }
}

/**
 * Create a robust model loader with sensible defaults
 */
export function createRobustModelLoader(options?: ModelLoadOptions): RobustModelLoader {
  return new RobustModelLoader(options)
}

/**
 * Utility function to create fallback URLs for Universal Sentence Encoder
 */
export function getUniversalSentenceEncoderFallbacks(): string[] {
  return [
    // TensorFlow Hub model URL (correct path)
    'https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder/1/default/1/model.json?tfjs-format=file',
    // Alternative TensorFlow Hub URL
    'https://www.kaggle.com/models/tensorflow/universal-sentence-encoder/tfJs/default/1/model.json?tfjs-format=file',
    // Google Storage URL (updated path)
    'https://storage.googleapis.com/tfjs-models/savedmodel/universal_sentence_encoder/model.json',
    // Alternative Google Storage URL
    'https://storage.googleapis.com/tfhub-tfjs-modules/tensorflow/universal-sentence-encoder/1/default/1/model.json',
    // Add more fallback URLs as they become available
  ]
}
