import { BrainyData } from '@soulcraft/brainy';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Initialize the Brainy instance with appropriate configuration
 * based on environment variables
 */
export async function initializeBrainy(): Promise<BrainyData> {
  // Get storage configuration from environment variables
  const storageType = process.env.STORAGE_TYPE || 'filesystem';

  // Create configuration object
  const config: any = {
    storage: {}
  };

  // Configure storage based on type
  switch (storageType) {
    case 's3':
      // Configure S3 storage
      config.storage.s3Storage = {
        bucketName: process.env.S3_BUCKET_NAME,
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.S3_REGION || 'us-east-1',
        endpoint: process.env.S3_ENDPOINT // Optional for custom S3-compatible services
      };
      break;

    case 'filesystem':
      // Configure filesystem storage
      config.storage.rootDirectory = process.env.STORAGE_ROOT_DIR || './data';
      break;

    case 'memory':
      // No additional configuration needed for memory storage
      break;

    default:
      // Default to filesystem storage
      config.storage.rootDirectory = process.env.STORAGE_ROOT_DIR || './data';
      break;
  }

  // Note: Universal Sentence Encoder is now the only embedding option
  // TensorFlow.js is required for embedding to work

  // Configure HNSW index parameters if provided
  if (process.env.HNSW_M) {
    config.hnsw = {
      M: parseInt(process.env.HNSW_M, 10),
      efConstruction: process.env.HNSW_EF_CONSTRUCTION 
        ? parseInt(process.env.HNSW_EF_CONSTRUCTION, 10) 
        : 200,
      efSearch: process.env.HNSW_EF_SEARCH 
        ? parseInt(process.env.HNSW_EF_SEARCH, 10) 
        : 50
    };
  }

  // Create and initialize the Brainy instance
  const brainy = new BrainyData(config);
  await brainy.init();

  return brainy;
}

/**
 * Get the current storage type being used by Brainy
 */
export async function getStorageType(brainy: BrainyData): Promise<string> {
  const status = await brainy.status();
  return status.storageType || 'unknown';
}
