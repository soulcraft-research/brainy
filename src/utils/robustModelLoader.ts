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
}

export interface RetryConfig {
  attempt: number
  maxRetries: number
  delay: number
  error: Error
}

export class RobustModelLoader {
  private options: Required<ModelLoadOptions>
  private loadAttempts: Map<string, number> = new Map()

  constructor(options: ModelLoadOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      initialRetryDelay: options.initialRetryDelay ?? 1000,
      maxRetryDelay: options.maxRetryDelay ?? 30000,
      timeout: options.timeout ?? 60000, // 60 seconds
      useExponentialBackoff: options.useExponentialBackoff ?? true,
      fallbackUrls: options.fallbackUrls ?? [],
      verbose: options.verbose ?? false,
      preferLocalModel: options.preferLocalModel ?? true
    }
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
      // Check if we're in Node.js environment
      const isNode = typeof process !== 'undefined' && 
                     process.versions != null && 
                     process.versions.node != null

      if (isNode) {
        // Try to load from bundled model directory
        const path = await import('path')
        const fs = await import('fs')
        const { fileURLToPath } = await import('url')

        const __filename = fileURLToPath(import.meta.url)
        const __dirname = path.dirname(__filename)

        // Look for bundled model in multiple possible locations
        const possiblePaths = [
          path.join(__dirname, '..', '..', 'models', 'bundled', 'universal-sentence-encoder'),
          path.join(__dirname, '..', '..', 'brainy-models-package', 'models', 'universal-sentence-encoder'),
          path.join(process.cwd(), 'brainy-models-package', 'models', 'universal-sentence-encoder'),
          path.join(__dirname, '..', '..', 'node_modules', '@soulcraft', 'brainy-models', 'models', 'universal-sentence-encoder'),
          path.join(__dirname, '..', '..', 'node_modules', '@soulcraft', 'brainy-models', 'universal-sentence-encoder'),
          path.join(process.cwd(), 'node_modules', '@soulcraft', 'brainy-models', 'universal-sentence-encoder')
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
      }

      return null
    } catch (error) {
      this.log(`Error checking for bundled model: ${error}`)
      return null
    }
  }

  /**
   * Load model from a specific URL
   */
  private async loadFromUrl(url: string): Promise<EmbeddingModel> {
    // This would need to be implemented based on the specific model type
    // For now, we'll throw an error indicating this needs implementation
    throw new Error(`Loading from custom URL not yet implemented: ${url}`)
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
        const input = Array.isArray(sentences) ? sentences : [sentences]
        
        // This is a simplified implementation - would need proper preprocessing
        const inputTensors = tfModel.predict(input)
        return inputTensors
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
    'https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder/1/default/1',
    'https://storage.googleapis.com/tfjs-models/savedmodel/universal_sentence_encoder/1/model.json',
    // Add more fallback URLs as they become available
  ]
}
