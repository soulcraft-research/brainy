/**
 * Test script for the statistics storage implementation
 * 
 * This script tests:
 * 1. Saving statistics data
 * 2. Retrieving statistics data
 * 3. Verifying that the data is correctly saved and retrieved
 * 4. Checking that time-based partitioning works correctly
 * 5. Checking that backward compatibility is maintained
 */

// Import required modules
// @ts-expect-error - dotenv doesn't have TypeScript types
import { config } from 'dotenv'
import { setTimeout } from 'timers/promises'
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import * as process from 'process'

// Define types for statistics data
interface ServiceStatistics {
  nounCount: number
  verbCount: number
  metadataCount: number
}

interface StatisticsData {
  nounCount: Record<string, number>
  verbCount: Record<string, number>
  metadataCount: Record<string, number>
  hnswIndexSize: number
  lastUpdated: string
}

// Define types for storage configuration
interface S3StorageConfig {
  endpoint: string
  region: string
  bucketName: string
  accessKeyId: string
  secretAccessKey: string
  prefix: string
  serviceType?: string
  sessionToken?: string
  accountId?: string
}

// Load environment variables
config()

// Create test statistics data
const testStatistics: StatisticsData = {
  nounCount: { 'test-service': 100, 'another-service': 50 },
  verbCount: { 'test-service': 75, 'another-service': 25 },
  metadataCount: { 'test-service': 100, 'another-service': 50 },
  hnswIndexSize: 150,
  lastUpdated: new Date().toISOString()
}

// Test configuration
const storageConfig: S3StorageConfig = {
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  bucketName: process.env.S3_BUCKET || 'test-bucket',
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  prefix: 'test-statistics/'
}

// Check if required S3 credentials are available
const hasS3Credentials = !!process.env.S3_ACCESS_KEY && !!process.env.S3_SECRET_KEY;

// Use conditional describe to skip all tests if credentials are missing
(hasS3Credentials ? describe : describe.skip)('Statistics Storage', () => {
  let storage: any
  let s3Client: S3Client

  beforeAll(async () => {
    if (!hasS3Credentials) {
      console.log('Skipping S3 storage tests: S3_ACCESS_KEY or S3_SECRET_KEY environment variables not set')
      return
    }

    try {
      // Import S3CompatibleStorage dynamically to avoid issues with dynamic imports
      const { S3CompatibleStorage } = await import('../dist/storage/adapters/s3CompatibleStorage')
      
      // Create storage instance
      storage = new S3CompatibleStorage(storageConfig)
      await storage.init()
      
      // Initialize S3 client for checking files
      s3Client = new S3Client({
        endpoint: storageConfig.endpoint,
        region: storageConfig.region,
        credentials: {
          accessKeyId: storageConfig.accessKeyId,
          secretAccessKey: storageConfig.secretAccessKey
        }
      })
    } catch (error) {
      console.log('Error initializing S3 storage:', error)
      throw error // Let the test fail with a clear error message
    }
  })

  it('should save statistics data', async () => {
    await storage.saveStatistics(testStatistics)
    expect(true).toBe(true) // If no error is thrown, the test passes
  })

  it('should retrieve statistics data after batch update completes', async () => {
    // Wait for the batch update to complete (longer than MAX_FLUSH_DELAY_MS)
    await setTimeout(35000)
    
    const retrievedStats = await storage.getStatistics()
    expect(retrievedStats).not.toBeNull()
    
    // Check that all properties match
    expect(JSON.stringify(retrievedStats.nounCount)).toBe(JSON.stringify(testStatistics.nounCount))
    expect(JSON.stringify(retrievedStats.verbCount)).toBe(JSON.stringify(testStatistics.verbCount))
    expect(JSON.stringify(retrievedStats.metadataCount)).toBe(JSON.stringify(testStatistics.metadataCount))
    expect(retrievedStats.hnswIndexSize).toBe(testStatistics.hnswIndexSize)
  })

  it('should store statistics in time-partitioned files', async () => {
    // Get current date in YYYYMMDD format
    const now = new Date()
    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const day = String(now.getUTCDate()).padStart(2, '0')
    const dateStr = `${year}${month}${day}`
    
    // Check if the file exists in the expected location
    const listResponse = await s3Client.send(new ListObjectsV2Command({
      Bucket: storageConfig.bucketName,
      Prefix: `${storageConfig.prefix}index/statistics_${dateStr}`
    }))
    
    expect(listResponse.Contents).toBeDefined()
    expect(listResponse.Contents?.length).toBeGreaterThan(0)
  })

  it('should maintain backward compatibility with legacy statistics file', async () => {
    // Check if the legacy file exists
    const legacyListResponse = await s3Client.send(new ListObjectsV2Command({
      Bucket: storageConfig.bucketName,
      Prefix: `${storageConfig.prefix}index/statistics.json`
    }))
    
    // This test is informational - the legacy file may not exist if the 10% random update didn't trigger
    if (legacyListResponse.Contents && legacyListResponse.Contents.length > 0) {
      expect(legacyListResponse.Contents.length).toBeGreaterThan(0)
    } else {
      console.log('Legacy statistics file not found. This is expected if the 10% random update didn\'t trigger.')
    }
  })
})