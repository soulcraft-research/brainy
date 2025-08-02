/**
 * Storage Factory
 * Creates the appropriate storage adapter based on the environment and configuration
 */

import { StorageAdapter } from '../coreTypes.js'
import { MemoryStorage } from './adapters/memoryStorage.js'
import { OPFSStorage } from './adapters/opfsStorage.js'
import {
  S3CompatibleStorage,
  R2Storage
} from './adapters/s3CompatibleStorage.js'
// FileSystemStorage is dynamically imported to avoid issues in browser environments
import { isBrowser } from '../utils/environment.js'
import { OperationConfig } from '../utils/operationUtils.js'

/**
 * Options for creating a storage adapter
 */
export interface StorageOptions {
  /**
   * The type of storage to use
   * - 'auto': Automatically select the best storage adapter based on the environment
   * - 'memory': Use in-memory storage
   * - 'opfs': Use Origin Private File System storage (browser only)
   * - 'filesystem': Use file system storage (Node.js only)
   * - 's3': Use Amazon S3 storage
   * - 'r2': Use Cloudflare R2 storage
   * - 'gcs': Use Google Cloud Storage
   */
  type?: 'auto' | 'memory' | 'opfs' | 'filesystem' | 's3' | 'r2' | 'gcs'

  /**
   * Force the use of memory storage even if other storage types are available
   */
  forceMemoryStorage?: boolean

  /**
   * Force the use of file system storage even if other storage types are available
   */
  forceFileSystemStorage?: boolean

  /**
   * Request persistent storage permission from the user (browser only)
   */
  requestPersistentStorage?: boolean

  /**
   * Root directory for file system storage (Node.js only)
   */
  rootDirectory?: string

  /**
   * Configuration for Amazon S3 storage
   */
  s3Storage?: {
    /**
     * S3 bucket name
     */
    bucketName: string

    /**
     * AWS region (e.g., 'us-east-1')
     */
    region?: string

    /**
     * AWS access key ID
     */
    accessKeyId: string

    /**
     * AWS secret access key
     */
    secretAccessKey: string

    /**
     * AWS session token (optional)
     */
    sessionToken?: string
  }

  /**
   * Configuration for Cloudflare R2 storage
   */
  r2Storage?: {
    /**
     * R2 bucket name
     */
    bucketName: string

    /**
     * Cloudflare account ID
     */
    accountId: string

    /**
     * R2 access key ID
     */
    accessKeyId: string

    /**
     * R2 secret access key
     */
    secretAccessKey: string
  }

  /**
   * Configuration for Google Cloud Storage
   */
  gcsStorage?: {
    /**
     * GCS bucket name
     */
    bucketName: string

    /**
     * GCS region (e.g., 'us-central1')
     */
    region?: string

    /**
     * GCS access key ID
     */
    accessKeyId: string

    /**
     * GCS secret access key
     */
    secretAccessKey: string

    /**
     * GCS endpoint (e.g., 'https://storage.googleapis.com')
     */
    endpoint?: string
  }

  /**
   * Configuration for custom S3-compatible storage
   */
  customS3Storage?: {
    /**
     * S3-compatible bucket name
     */
    bucketName: string

    /**
     * S3-compatible region
     */
    region?: string

    /**
     * S3-compatible endpoint URL
     */
    endpoint: string

    /**
     * S3-compatible access key ID
     */
    accessKeyId: string

    /**
     * S3-compatible secret access key
     */
    secretAccessKey: string

    /**
     * S3-compatible service type (for logging and error messages)
     */
    serviceType?: string
  }

  /**
   * Operation configuration for timeout and retry behavior
   */
  operationConfig?: OperationConfig

  /**
   * Cache configuration for optimizing data access
   * Particularly important for S3 and other remote storage
   */
  cacheConfig?: {
    /**
     * Maximum size of the hot cache (most frequently accessed items)
     * For large datasets, consider values between 5000-50000 depending on available memory
     */
    hotCacheMaxSize?: number

    /**
     * Threshold at which to start evicting items from the hot cache
     * Expressed as a fraction of hotCacheMaxSize (0.0 to 1.0)
     * Default: 0.8 (start evicting when cache is 80% full)
     */
    hotCacheEvictionThreshold?: number

    /**
     * Time-to-live for items in the warm cache in milliseconds
     * Default: 3600000 (1 hour)
     */
    warmCacheTTL?: number

    /**
     * Batch size for operations like prefetching
     * Larger values improve throughput but use more memory
     */
    batchSize?: number

    /**
     * Whether to enable auto-tuning of cache parameters
     * When true, the system will automatically adjust cache sizes based on usage patterns
     * Default: true
     */
    autoTune?: boolean

    /**
     * The interval (in milliseconds) at which to auto-tune cache parameters
     * Only applies when autoTune is true
     * Default: 60000 (1 minute)
     */
    autoTuneInterval?: number

    /**
     * Whether the storage is in read-only mode
     * This affects cache sizing and prefetching strategies
     */
    readOnly?: boolean
  }
}

/**
 * Create a storage adapter based on the environment and configuration
 * @param options Options for creating the storage adapter
 * @returns Promise that resolves to a storage adapter
 */
export async function createStorage(
  options: StorageOptions = {}
): Promise<StorageAdapter> {
  // If memory storage is forced, use it regardless of other options
  if (options.forceMemoryStorage) {
    console.log('Using memory storage (forced)')
    return new MemoryStorage()
  }

  // If file system storage is forced, use it regardless of other options
  if (options.forceFileSystemStorage) {
    if (isBrowser()) {
      console.warn(
        'FileSystemStorage is not available in browser environments, falling back to memory storage'
      )
      return new MemoryStorage()
    }
    console.log('Using file system storage (forced)')
    try {
      const { FileSystemStorage } = await import(
        './adapters/fileSystemStorage.js'
      )
      return new FileSystemStorage(options.rootDirectory || './brainy-data')
    } catch (error) {
      console.warn(
        'Failed to load FileSystemStorage, falling back to memory storage:',
        error
      )
      return new MemoryStorage()
    }
  }

  // If a specific storage type is specified, use it
  if (options.type && options.type !== 'auto') {
    switch (options.type) {
      case 'memory':
        console.log('Using memory storage')
        return new MemoryStorage()

      case 'opfs': {
        // Check if OPFS is available
        const opfsStorage = new OPFSStorage()
        if (opfsStorage.isOPFSAvailable()) {
          console.log('Using OPFS storage')
          await opfsStorage.init()

          // Request persistent storage if specified
          if (options.requestPersistentStorage) {
            const isPersistent = await opfsStorage.requestPersistentStorage()
            console.log(
              `Persistent storage ${isPersistent ? 'granted' : 'denied'}`
            )
          }

          return opfsStorage
        } else {
          console.warn(
            'OPFS storage is not available, falling back to memory storage'
          )
          return new MemoryStorage()
        }
      }

      case 'filesystem': {
        if (isBrowser()) {
          console.warn(
            'FileSystemStorage is not available in browser environments, falling back to memory storage'
          )
          return new MemoryStorage()
        }
        console.log('Using file system storage')
        try {
          const { FileSystemStorage } = await import(
            './adapters/fileSystemStorage.js'
          )
          return new FileSystemStorage(options.rootDirectory || './brainy-data')
        } catch (error) {
          console.warn(
            'Failed to load FileSystemStorage, falling back to memory storage:',
            error
          )
          return new MemoryStorage()
        }
      }

      case 's3':
        if (options.s3Storage) {
          console.log('Using Amazon S3 storage')
          return new S3CompatibleStorage({
            bucketName: options.s3Storage.bucketName,
            region: options.s3Storage.region,
            accessKeyId: options.s3Storage.accessKeyId,
            secretAccessKey: options.s3Storage.secretAccessKey,
            sessionToken: options.s3Storage.sessionToken,
            serviceType: 's3',
            operationConfig: options.operationConfig,
            cacheConfig: options.cacheConfig
          })
        } else {
          console.warn(
            'S3 storage configuration is missing, falling back to memory storage'
          )
          return new MemoryStorage()
        }

      case 'r2':
        if (options.r2Storage) {
          console.log('Using Cloudflare R2 storage')
          return new R2Storage({
            bucketName: options.r2Storage.bucketName,
            accountId: options.r2Storage.accountId,
            accessKeyId: options.r2Storage.accessKeyId,
            secretAccessKey: options.r2Storage.secretAccessKey,
            serviceType: 'r2',
            cacheConfig: options.cacheConfig
          })
        } else {
          console.warn(
            'R2 storage configuration is missing, falling back to memory storage'
          )
          return new MemoryStorage()
        }

      case 'gcs':
        if (options.gcsStorage) {
          console.log('Using Google Cloud Storage')
          return new S3CompatibleStorage({
            bucketName: options.gcsStorage.bucketName,
            region: options.gcsStorage.region,
            endpoint:
              options.gcsStorage.endpoint || 'https://storage.googleapis.com',
            accessKeyId: options.gcsStorage.accessKeyId,
            secretAccessKey: options.gcsStorage.secretAccessKey,
            serviceType: 'gcs',
            cacheConfig: options.cacheConfig
          })
        } else {
          console.warn(
            'GCS storage configuration is missing, falling back to memory storage'
          )
          return new MemoryStorage()
        }

      default:
        console.warn(
          `Unknown storage type: ${options.type}, falling back to memory storage`
        )
        return new MemoryStorage()
    }
  }

  // If custom S3-compatible storage is specified, use it
  if (options.customS3Storage) {
    console.log(
      `Using custom S3-compatible storage: ${options.customS3Storage.serviceType || 'custom'}`
    )
    return new S3CompatibleStorage({
      bucketName: options.customS3Storage.bucketName,
      region: options.customS3Storage.region,
      endpoint: options.customS3Storage.endpoint,
      accessKeyId: options.customS3Storage.accessKeyId,
      secretAccessKey: options.customS3Storage.secretAccessKey,
      serviceType: options.customS3Storage.serviceType || 'custom',
      cacheConfig: options.cacheConfig
    })
  }

  // If R2 storage is specified, use it
  if (options.r2Storage) {
    console.log('Using Cloudflare R2 storage')
    return new R2Storage({
      bucketName: options.r2Storage.bucketName,
      accountId: options.r2Storage.accountId,
      accessKeyId: options.r2Storage.accessKeyId,
      secretAccessKey: options.r2Storage.secretAccessKey,
      serviceType: 'r2',
      cacheConfig: options.cacheConfig
    })
  }

  // If S3 storage is specified, use it
  if (options.s3Storage) {
    console.log('Using Amazon S3 storage')
    return new S3CompatibleStorage({
      bucketName: options.s3Storage.bucketName,
      region: options.s3Storage.region,
      accessKeyId: options.s3Storage.accessKeyId,
      secretAccessKey: options.s3Storage.secretAccessKey,
      sessionToken: options.s3Storage.sessionToken,
      serviceType: 's3',
      cacheConfig: options.cacheConfig
    })
  }

  // If GCS storage is specified, use it
  if (options.gcsStorage) {
    console.log('Using Google Cloud Storage')
    return new S3CompatibleStorage({
      bucketName: options.gcsStorage.bucketName,
      region: options.gcsStorage.region,
      endpoint: options.gcsStorage.endpoint || 'https://storage.googleapis.com',
      accessKeyId: options.gcsStorage.accessKeyId,
      secretAccessKey: options.gcsStorage.secretAccessKey,
      serviceType: 'gcs',
      cacheConfig: options.cacheConfig
    })
  }

  // Auto-detect the best storage adapter based on the environment
  // First, try OPFS (browser only)
  const opfsStorage = new OPFSStorage()
  if (opfsStorage.isOPFSAvailable()) {
    console.log('Using OPFS storage (auto-detected)')
    await opfsStorage.init()

    // Request persistent storage if specified
    if (options.requestPersistentStorage) {
      const isPersistent = await opfsStorage.requestPersistentStorage()
      console.log(`Persistent storage ${isPersistent ? 'granted' : 'denied'}`)
    }

    return opfsStorage
  }

  // Next, try file system storage (Node.js only)
  try {
    // Check if we're in a Node.js environment
    if (
      typeof process !== 'undefined' &&
      process.versions &&
      process.versions.node
    ) {
      console.log('Using file system storage (auto-detected)')
      try {
        const { FileSystemStorage } = await import(
          './adapters/fileSystemStorage.js'
        )
        return new FileSystemStorage(options.rootDirectory || './brainy-data')
      } catch (fsError) {
        console.warn(
          'Failed to load FileSystemStorage, falling back to memory storage:',
          fsError
        )
      }
    }
  } catch (error) {
    // Not in a Node.js environment or file system is not available
    console.warn('Not in a Node.js environment:', error)
  }

  // Finally, fall back to memory storage
  console.log('Using memory storage (auto-detected)')
  return new MemoryStorage()
}

/**
 * Export storage adapters
 */
export {
  MemoryStorage,
  OPFSStorage,
  S3CompatibleStorage,
  R2Storage
}

// Export FileSystemStorage conditionally
export { FileSystemStorage } from './adapters/fileSystemStorage.js'
