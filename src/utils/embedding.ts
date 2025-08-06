/**
 * Embedding functions for converting data to vectors using Transformers.js
 * Complete rewrite to eliminate TensorFlow.js and use ONNX-based models
 */

import { EmbeddingFunction, EmbeddingModel, Vector } from '../coreTypes.js'
import { executeInThread } from './workerUtils.js'
import { isBrowser } from './environment.js'
import { pipeline, env } from '@huggingface/transformers'

/**
 * Transformers.js Sentence Encoder embedding model
 * Uses ONNX Runtime for fast, offline embeddings with smaller models
 * Default model: all-MiniLM-L6-v2 (384 dimensions, ~90MB)
 */
export interface TransformerEmbeddingOptions {
  /** Model name/path to use - defaults to all-MiniLM-L6-v2 */
  model?: string
  /** Whether to enable verbose logging */
  verbose?: boolean
  /** Custom cache directory for models */
  cacheDir?: string
  /** Force local files only (no downloads) */
  localFilesOnly?: boolean
  /** Quantization setting (fp32, fp16, q8, q4) */
  dtype?: 'fp32' | 'fp16' | 'q8' | 'q4'
}

export class TransformerEmbedding implements EmbeddingModel {
  private extractor: any = null
  private initialized = false
  private verbose: boolean = true
  private options: Required<TransformerEmbeddingOptions>

  /**
   * Create a new TransformerEmbedding instance
   */
  constructor(options: TransformerEmbeddingOptions = {}) {
    this.verbose = options.verbose !== undefined ? options.verbose : true
    this.options = {
      model: options.model || 'Xenova/all-MiniLM-L6-v2',
      verbose: this.verbose,
      cacheDir: options.cacheDir || this.getDefaultCacheDir(),
      localFilesOnly: options.localFilesOnly !== undefined ? options.localFilesOnly : !isBrowser(),
      dtype: options.dtype || 'fp32'
    }

    // Configure transformers.js environment
    if (!isBrowser()) {
      // Set cache directory for Node.js
      env.cacheDir = this.options.cacheDir
      // Prioritize local models for offline operation
      env.allowRemoteModels = !this.options.localFilesOnly
      env.allowLocalModels = true
    } else {
      // Browser configuration
      // Allow both local and remote models, but prefer local if available
      env.allowLocalModels = true
      env.allowRemoteModels = true
      // Force the configuration to ensure it's applied
      if (this.verbose) {
        this.logger('log', `Browser env config - allowLocalModels: ${env.allowLocalModels}, allowRemoteModels: ${env.allowRemoteModels}, localFilesOnly: ${this.options.localFilesOnly}`)
      }
    }
  }

  /**
   * Get the default cache directory for models
   */
  private getDefaultCacheDir(): string {
    if (isBrowser()) {
      return './models' // Browser default
    }

    // Check for bundled models in the package
    const possiblePaths = [
      // In the installed package
      './node_modules/@soulcraft/brainy/models',
      // In development/source
      './models',
      './dist/../models',
      // Alternative locations
      '../models',
      '../../models'
    ]

    // Check if we're in Node.js and try to find the bundled models
    if (typeof process !== 'undefined' && process.versions?.node) {
      try {
        const path = require('path')
        const fs = require('fs')

        // Try to resolve the package location
        try {
          const brainyPackagePath = require.resolve('@soulcraft/brainy/package.json')
          const brainyPackageDir = path.dirname(brainyPackagePath)
          const bundledModelsPath = path.join(brainyPackageDir, 'models')
          
          if (fs.existsSync(bundledModelsPath)) {
            this.logger('log', `Using bundled models from package: ${bundledModelsPath}`)
            return bundledModelsPath
          }
        } catch (e) {
          // Not installed as package, continue
        }

        // Try relative paths from current location
        for (const relativePath of possiblePaths) {
          const fullPath = path.resolve(relativePath)
          if (fs.existsSync(fullPath)) {
            this.logger('log', `Using bundled models from: ${fullPath}`)
            return fullPath
          }
        }
      } catch (error) {
        this.logger('warn', 'Could not auto-detect bundled models directory:', error)
      }
    }

    // Fallback to default cache directory
    return './models'
  }

  /**
   * Check if we're running in a test environment
   */
  private isTestEnvironment(): boolean {
    // Always use real implementation - no more mocking
    return false
  }

  /**
   * Log message only if verbose mode is enabled
   */
  private logger(level: 'log' | 'warn' | 'error', message: string, ...args: any[]): void {
    if (level === 'error' || this.verbose) {
      console[level](`[TransformerEmbedding] ${message}`, ...args)
    }
  }

  /**
   * Initialize the embedding model
   */
  public async init(): Promise<void> {
    if (this.initialized) {
      return
    }

    // Always use real implementation - no mocking

    try {
      this.logger('log', `Loading Transformer model: ${this.options.model}`)
      
      const startTime = Date.now()
      
      // Load the feature extraction pipeline
      // In browsers, never use local_files_only to avoid conflicts
      const pipelineOptions = {
        cache_dir: this.options.cacheDir,
        local_files_only: isBrowser() ? false : this.options.localFilesOnly,
        dtype: this.options.dtype
      }
      
      if (this.verbose) {
        this.logger('log', `Pipeline options: ${JSON.stringify(pipelineOptions)}`)
      }
      
      this.extractor = await pipeline('feature-extraction', this.options.model, pipelineOptions)

      const loadTime = Date.now() - startTime
      this.logger('log', `✅ Model loaded successfully in ${loadTime}ms`)
      
      this.initialized = true
    } catch (error) {
      this.logger('error', 'Failed to initialize Transformer embedding model:', error)
      throw new Error(`Transformer embedding initialization failed: ${error}`)
    }
  }

  /**
   * Generate embeddings for text data
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
          // Return a zero vector of 384 dimensions (all-MiniLM-L6-v2 standard)
          return new Array(384).fill(0)
        }
        textToEmbed = [data]
      } else if (Array.isArray(data) && data.every((item) => typeof item === 'string')) {
        // Handle empty array or array with empty strings
        if (data.length === 0 || data.every((item) => item.trim() === '')) {
          return new Array(384).fill(0)
        }
        // Filter out empty strings
        textToEmbed = data.filter((item) => item.trim() !== '')
        if (textToEmbed.length === 0) {
          return new Array(384).fill(0)
        }
      } else {
        throw new Error('TransformerEmbedding only supports string or string[] data')
      }

      // Ensure the extractor is available
      if (!this.extractor) {
        throw new Error('Transformer embedding model is not available')
      }

      // Generate embeddings with mean pooling and normalization
      const result = await this.extractor(textToEmbed, {
        pooling: 'mean',
        normalize: true
      })

      // Extract the embedding data
      let embedding: number[]
      
      if (textToEmbed.length === 1) {
        // Single text input - return first embedding
        embedding = Array.from(result.data.slice(0, 384))
      } else {
        // Multiple texts - return first embedding (maintain compatibility)
        embedding = Array.from(result.data.slice(0, 384))
      }

      // Validate embedding dimensions
      if (embedding.length !== 384) {
        this.logger('warn', `Unexpected embedding dimension: ${embedding.length}, expected 384`)
        // Pad or truncate to 384 dimensions
        if (embedding.length < 384) {
          embedding = [...embedding, ...new Array(384 - embedding.length).fill(0)]
        } else {
          embedding = embedding.slice(0, 384)
        }
      }

      return embedding
    } catch (error) {
      this.logger('error', 'Error generating embeddings:', error)
      throw new Error(`Failed to generate embeddings: ${error}`)
    }
  }

  /**
   * Dispose of the model and free resources
   */
  public async dispose(): Promise<void> {
    if (this.extractor && typeof this.extractor.dispose === 'function') {
      await this.extractor.dispose()
    }
    this.extractor = null
    this.initialized = false
  }

  /**
   * Get the dimension of embeddings produced by this model
   */
  public getDimension(): number {
    return 384
  }

  /**
   * Check if the model is initialized
   */
  public isInitialized(): boolean {
    return this.initialized
  }
}

// Legacy alias for backward compatibility
export const UniversalSentenceEncoder = TransformerEmbedding

/**
 * Create a new embedding model instance
 */
export function createEmbeddingModel(options?: TransformerEmbeddingOptions): EmbeddingModel {
  return new TransformerEmbedding(options)
}

/**
 * Default embedding function using the lightweight transformer model
 */
export const defaultEmbeddingFunction: EmbeddingFunction = async (data: string | string[]): Promise<Vector> => {
  const embedder = new TransformerEmbedding({ verbose: false })
  return await embedder.embed(data)
}

/**
 * Create an embedding function with custom options
 */
export function createEmbeddingFunction(options: TransformerEmbeddingOptions = {}): EmbeddingFunction {
  const embedder = new TransformerEmbedding(options)
  
  return async (data: string | string[]): Promise<Vector> => {
    return await embedder.embed(data)
  }
}

/**
 * Batch embedding function for processing multiple texts efficiently
 */
export async function batchEmbed(
  texts: string[],
  options: TransformerEmbeddingOptions = {}
): Promise<Vector[]> {
  const embedder = new TransformerEmbedding(options)
  await embedder.init()
  
  const embeddings: Vector[] = []
  
  // Process in batches for memory efficiency
  const batchSize = 32
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    
    for (const text of batch) {
      const embedding = await embedder.embed(text)
      embeddings.push(embedding)
    }
  }
  
  await embedder.dispose()
  return embeddings
}

/**
 * Embedding functions for specific model types
 */
export const embeddingFunctions = {
  /** Default lightweight model (all-MiniLM-L6-v2, 384 dimensions) */
  default: defaultEmbeddingFunction,
  
  /** Create custom embedding function */
  create: createEmbeddingFunction,
  
  /** Batch processing */
  batch: batchEmbed
}