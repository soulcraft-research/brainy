/**
 * S3 Compatible Storage Tests
 * Tests for the S3 compatible storage adapter using a simulated S3 environment
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupS3Mock, cleanupS3Mock, S3Commands } from './mocks/s3-mock'
import { Vector } from '../src/coreTypes'

// Setup S3 mock environment at the top level
console.log('Setting up S3 mock environment at the top level')
const s3MockSetup = setupS3Mock()

// Mock AWS SDK imports at the top level
vi.mock('@aws-sdk/client-s3', () => {
  console.log('Mocking AWS SDK imports')
  return {
    S3Client: class MockS3Client {
      send = s3MockSetup.mockS3Client.send
    },
    ...S3Commands
  }
})

describe('S3CompatibleStorage', () => {
  // Import modules inside tests to avoid issues with dynamic imports
  let S3CompatibleStorage: any
  let R2Storage: any
  let s3Mock: any

  beforeEach(async () => {
    console.log('==== TEST SETUP START ====')
    
    // Store the mock setup for use in tests
    s3Mock = s3MockSetup
    
    // Reset the mock storage before each test
    s3Mock.reset()
    
    // Import storage factory
    console.log('Importing storage factory')
    const storageFactory = await import('../src/storage/storageFactory.js')
    S3CompatibleStorage = storageFactory.S3CompatibleStorage
    R2Storage = storageFactory.R2Storage
    
    console.log('==== TEST SETUP COMPLETE ====')
  })

  afterEach(() => {
    console.log('==== TEST CLEANUP START ====')
    
    // Clean up S3 mock environment
    cleanupS3Mock()
    
    // Reset mocks
    vi.resetAllMocks()
    vi.clearAllMocks()
    
    console.log('==== TEST CLEANUP COMPLETE ====')
  })

  it('should initialize S3CompatibleStorage correctly', async () => {
    // Create the bucket first using our mock
    const createBucketCommand = new S3Commands.CreateBucketCommand({
      Bucket: 'test-bucket'
    })
    await s3Mock.mockS3Client.send(createBucketCommand)
    
    // Create a new instance with our mocked environment
    const s3Storage = new S3CompatibleStorage({
      bucketName: 'test-bucket',
      region: 'us-east-1',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      serviceType: 's3'
    })
    
    // Initialize the storage
    await s3Storage.init()
    
    // Verify the storage was initialized correctly
    expect(s3Storage).toBeDefined()
    
    // Clean up
    await s3Storage.clear()
  })

  it('should initialize R2Storage correctly', async () => {
    // Create the bucket first using our mock
    const createBucketCommand = new S3Commands.CreateBucketCommand({
      Bucket: 'test-bucket'
    })
    await s3Mock.mockS3Client.send(createBucketCommand)
    
    // Create a new instance with our mocked environment
    const r2Storage = new R2Storage({
      bucketName: 'test-bucket',
      accountId: 'test-account',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key'
    })
    
    // Initialize the storage
    await r2Storage.init()
    
    // Verify the storage was initialized correctly
    expect(r2Storage).toBeDefined()
    
    // Clean up
    await r2Storage.clear()
  })

  it('should perform basic metadata operations with S3 storage', async () => {
    // Create the bucket first using our mock
    const createBucketCommand = new S3Commands.CreateBucketCommand({
      Bucket: 'test-bucket'
    })
    await s3Mock.mockS3Client.send(createBucketCommand)
    
    // Create a new instance with our mocked environment
    const s3Storage = new S3CompatibleStorage({
      bucketName: 'test-bucket',
      region: 'us-east-1',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      serviceType: 's3'
    })
    
    // Initialize the storage
    await s3Storage.init()
    
    // Test basic metadata operations
    const testMetadata = { test: 'data', value: 123 }
    await s3Storage.saveMetadata('test-key', testMetadata)
    
    const retrievedMetadata = await s3Storage.getMetadata('test-key')
    expect(retrievedMetadata).toEqual(testMetadata)
    
    // Clean up
    await s3Storage.clear()
  })

  it('should handle noun operations correctly with S3 storage', async () => {
    // Create the bucket first using our mock
    const createBucketCommand = new S3Commands.CreateBucketCommand({
      Bucket: 'test-bucket'
    })
    await s3Mock.mockS3Client.send(createBucketCommand)
    
    // Create a new instance with our mocked environment
    const s3Storage = new S3CompatibleStorage({
      bucketName: 'test-bucket',
      region: 'us-east-1',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      serviceType: 's3'
    })
    
    // Initialize the storage
    await s3Storage.init()
    
    // Create test noun
    const testVector: Vector = [0.1, 0.2, 0.3, 0.4, 0.5]
    const testNoun = {
      id: 'test-noun-1',
      vector: testVector,
      connections: new Map([
        [0, new Set(['test-noun-2', 'test-noun-3'])]
      ])
    }
    
    // Save the noun
    await s3Storage.saveNoun(testNoun)
    
    // Retrieve the noun
    const retrievedNoun = await s3Storage.getNoun('test-noun-1')
    
    // Verify the noun was saved and retrieved correctly
    expect(retrievedNoun).toBeDefined()
    expect(retrievedNoun?.id).toBe('test-noun-1')
    expect(retrievedNoun?.vector).toEqual(testVector)
    
    // Verify connections were saved correctly
    // Note: connections are stored as a Map in memory but might be serialized differently
    expect(retrievedNoun?.connections).toBeDefined()
    expect(retrievedNoun?.connections.get(0)).toBeDefined()
    expect(retrievedNoun?.connections.get(0)?.has('test-noun-2')).toBe(true)
    expect(retrievedNoun?.connections.get(0)?.has('test-noun-3')).toBe(true)
    
    // Test getNouns with pagination
    const nounsResult = await s3Storage.getNouns({ pagination: { limit: 100 } })
    expect(nounsResult.items.length).toBe(1)
    expect(nounsResult.items[0].id).toBe('test-noun-1')
    
    // Test deleteNoun
    await s3Storage.deleteNoun('test-noun-1')
    const deletedNoun = await s3Storage.getNoun('test-noun-1')
    expect(deletedNoun).toBeNull()
    
    // Clean up
    await s3Storage.clear()
  })

  it('should handle verb operations correctly with S3 storage', async () => {
    // Create the bucket first using our mock
    const createBucketCommand = new S3Commands.CreateBucketCommand({
      Bucket: 'test-bucket'
    })
    await s3Mock.mockS3Client.send(createBucketCommand)
    
    // Create a new instance with our mocked environment
    const s3Storage = new S3CompatibleStorage({
      bucketName: 'test-bucket',
      region: 'us-east-1',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      serviceType: 's3'
    })
    
    // Initialize the storage
    await s3Storage.init()
    
    // Create test verb
    const testVector: Vector = [0.1, 0.2, 0.3, 0.4, 0.5]
    const timestamp = {
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: (Date.now() % 1000) * 1000000
    }
    const testVerb = {
      id: 'test-verb-1',
      vector: testVector,
      connections: new Map(),
      source: 'source-noun-1',
      target: 'target-noun-1',
      verb: 'test-relation',
      weight: 0.75,
      metadata: { description: 'Test relation' },
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: {
        augmentation: 'test-service',
        version: '1.0'
      }
    }
    
    // Save the verb
    await s3Storage.saveVerb(testVerb)
    
    // Retrieve the verb
    const retrievedVerb = await s3Storage.getVerb('test-verb-1')
    
    // Verify the verb was saved and retrieved correctly
    expect(retrievedVerb).toBeDefined()
    expect(retrievedVerb?.id).toBe('test-verb-1')
    expect(retrievedVerb?.vector).toEqual(testVector)
    expect(retrievedVerb?.sourceId).toBe('source-noun-1')
    expect(retrievedVerb?.targetId).toBe('target-noun-1')
    expect(retrievedVerb?.type).toBe('test-relation')
    expect(retrievedVerb?.weight).toBe(0.75)
    expect(retrievedVerb?.metadata).toEqual({ description: 'Test relation' })
    
    // Test getVerbs with pagination
    const verbsResult = await s3Storage.getVerbs({ pagination: { limit: 100 } })
    expect(verbsResult.items.length).toBe(1)
    expect(verbsResult.items[0].id).toBe('test-verb-1')
    
    // Test getVerbsBySource
    const verbsBySource = await s3Storage.getVerbsBySource('source-noun-1')
    expect(verbsBySource.length).toBe(1)
    expect(verbsBySource[0].id).toBe('test-verb-1')
    
    // Test getVerbsByTarget
    const verbsByTarget = await s3Storage.getVerbsByTarget('target-noun-1')
    expect(verbsByTarget.length).toBe(1)
    expect(verbsByTarget[0].id).toBe('test-verb-1')
    
    // Test getVerbsByType
    const verbsByType = await s3Storage.getVerbsByType('test-relation')
    expect(verbsByType.length).toBe(1)
    expect(verbsByType[0].id).toBe('test-verb-1')
    
    // Test deleteVerb
    await s3Storage.deleteVerb('test-verb-1')
    const deletedVerb = await s3Storage.getVerb('test-verb-1')
    expect(deletedVerb).toBeNull()
    
    // Clean up
    await s3Storage.clear()
  })

  it('should handle storage status correctly with S3 storage', async () => {
    // Create the bucket first using our mock
    const createBucketCommand = new S3Commands.CreateBucketCommand({
      Bucket: 'test-bucket'
    })
    await s3Mock.mockS3Client.send(createBucketCommand)
    
    // Create a new instance with our mocked environment
    const s3Storage = new S3CompatibleStorage({
      bucketName: 'test-bucket',
      region: 'us-east-1',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      serviceType: 's3'
    })
    
    // Initialize the storage
    await s3Storage.init()
    
    // Add some data to the storage
    const testVector: Vector = [0.1, 0.2, 0.3, 0.4, 0.5]
    const testNoun = {
      id: 'test-noun-1',
      vector: testVector,
      connections: new Map([
        [0, new Set(['test-noun-2', 'test-noun-3'])]
      ])
    }
    
    await s3Storage.saveNoun(testNoun)
    await s3Storage.saveMetadata('test-key', { test: 'data', value: 123 })
    
    // Get storage status
    const status = await s3Storage.getStorageStatus()
    
    // Verify status
    expect(status.type).toBe('s3')
    expect(status.used).toBeGreaterThan(0)
    
    // Clean up
    await s3Storage.clear()
  })

  it('should handle multiple objects and pagination with S3 storage', async () => {
    // Create the bucket first using our mock
    const createBucketCommand = new S3Commands.CreateBucketCommand({
      Bucket: 'test-bucket'
    })
    await s3Mock.mockS3Client.send(createBucketCommand)
    
    // Create a new instance with our mocked environment
    const s3Storage = new S3CompatibleStorage({
      bucketName: 'test-bucket',
      region: 'us-east-1',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      serviceType: 's3'
    })
    
    // Initialize the storage
    await s3Storage.init()
    
    // Create multiple test nouns
    const testVector: Vector = [0.1, 0.2, 0.3, 0.4, 0.5]
    const nounCount = 10
    
    for (let i = 0; i < nounCount; i++) {
      const testNoun = {
        id: `test-noun-${i}`,
        vector: testVector,
        connections: new Map([
          [0, new Set([`test-noun-${(i + 1) % nounCount}`, `test-noun-${(i + 2) % nounCount}`])]
        ])
      }
      
      await s3Storage.saveNoun(testNoun)
    }
    
    // Test getNouns with pagination
    const nounsResult = await s3Storage.getNouns({ pagination: { limit: 100 } })
    expect(nounsResult.items.length).toBe(nounCount)
    
    // Clean up
    await s3Storage.clear()
  })
  
  it('should handle change log functionality correctly with S3 storage', async () => {
    // Create the bucket first using our mock
    const createBucketCommand = new S3Commands.CreateBucketCommand({
      Bucket: 'test-bucket'
    })
    await s3Mock.mockS3Client.send(createBucketCommand)
    
    // Create a new instance with our mocked environment
    const s3Storage = new S3CompatibleStorage({
      bucketName: 'test-bucket',
      region: 'us-east-1',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      serviceType: 's3'
    })
    
    // Initialize the storage
    await s3Storage.init()
    
    // Create test nouns that will generate change log entries
    const testVector: Vector = [0.1, 0.2, 0.3, 0.4, 0.5]
    
    // Save first noun - should create a change log entry
    const testNoun1 = {
      id: 'test-noun-change-1',
      vector: testVector,
      connections: new Map()
    }
    await s3Storage.saveNoun(testNoun1)
    
    // Wait a bit to ensure timestamps are different
    await new Promise(resolve => setTimeout(resolve, 10))
    const firstTimestamp = Date.now()
    
    // Wait a bit more before creating second noun
    await new Promise(resolve => setTimeout(resolve, 10))
    
    // Save second noun - should create another change log entry
    const testNoun2 = {
      id: 'test-noun-change-2',
      vector: testVector,
      connections: new Map()
    }
    await s3Storage.saveNoun(testNoun2)
    
    // Get changes since beginning of time
    const allChanges = await s3Storage.getChangesSince(0)
    
    // Verify we have at least 2 changes (might be more due to initialization)
    expect(allChanges.length).toBeGreaterThanOrEqual(2)
    
    // Verify the changes contain our noun operations
    const nounChanges = allChanges.filter(c => 
      c.entityType === 'noun' && 
      (c.entityId === 'test-noun-change-1' || c.entityId === 'test-noun-change-2')
    )
    expect(nounChanges.length).toBe(2)
    
    // Get changes since first timestamp - should only include the second noun
    const recentChanges = await s3Storage.getChangesSince(firstTimestamp)
    const recentNounChanges = recentChanges.filter(c => 
      c.entityType === 'noun' && c.entityId === 'test-noun-change-2'
    )
    expect(recentNounChanges.length).toBe(1)
    
    // Clean up
    await s3Storage.clear()
  })
  
  it('should handle change log functionality with getChangesSince', async () => {
    // Create the bucket first using our mock
    const createBucketCommand = new S3Commands.CreateBucketCommand({
      Bucket: 'test-bucket'
    })
    await s3Mock.mockS3Client.send(createBucketCommand)
    
    // Create a new instance with our mocked environment
    const s3Storage = new S3CompatibleStorage({
      bucketName: 'test-bucket',
      region: 'us-east-1',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      serviceType: 's3'
    })
    
    // Initialize the storage
    await s3Storage.init()
    
    // Create test vector
    const testVector: Vector = [0.1, 0.2, 0.3, 0.4, 0.5]
    
    // Create first noun (older entry)
    const testNoun1 = {
      id: 'test-noun-cleanup-1',
      vector: testVector,
      connections: new Map()
    }
    await s3Storage.saveNoun(testNoun1)
    
    // Record the timestamp after first noun
    const oldTimestamp = Date.now()
    
    // Wait to ensure timestamps are different
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Create second noun (newer entry)
    const testNoun2 = {
      id: 'test-noun-cleanup-2',
      vector: testVector,
      connections: new Map()
    }
    await s3Storage.saveNoun(testNoun2)
    
    // Verify we have both change log entries
    const allChanges = await s3Storage.getChangesSince(0)
    const testNounChanges = allChanges.filter(c => 
      c.entityType === 'noun' && 
      (c.entityId === 'test-noun-cleanup-1' || c.entityId === 'test-noun-cleanup-2')
    )
    expect(testNounChanges.length).toBe(2)
    
    // Get changes since oldTimestamp - should only include the second noun
    const recentChanges = await s3Storage.getChangesSince(oldTimestamp)
    const recentNounChanges = recentChanges.filter(c => 
      c.entityType === 'noun' && 
      (c.entityId === 'test-noun-cleanup-1' || c.entityId === 'test-noun-cleanup-2')
    )
    
    // Should only have the newer entry for test-noun-cleanup-2
    expect(recentNounChanges.length).toBe(1)
    expect(recentNounChanges[0].entityId).toBe('test-noun-cleanup-2')
    
    // Clean up
    await s3Storage.clear()
  })
})
