/**
 * OPFS Storage Tests
 * Tests for the OPFS storage adapter using a simulated OPFS environment
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupOPFSMock, cleanupOPFSMock } from './mocks/opfs-mock'
import { Vector } from '../src/coreTypes'

describe('OPFSStorage', () => {
  // Import modules inside tests to avoid issues with dynamic imports
  let OPFSStorage: any
  let opfsMock: any

  beforeEach(async () => {
    // Setup OPFS mock environment
    opfsMock = setupOPFSMock()
    
    // Import storage factory
    const storageFactory = await import('../src/storage/storageFactory.js')
    OPFSStorage = storageFactory.OPFSStorage
  })

  afterEach(() => {
    // Clean up OPFS mock environment
    cleanupOPFSMock()
    
    // Reset mocks
    vi.resetAllMocks()
  })

  it('should detect OPFS availability correctly', () => {
    // Create a new instance with our mocked environment
    const opfsStorage = new OPFSStorage()
    
    // With our mocks in place, OPFS should be available
    expect(opfsStorage.isOPFSAvailable()).toBe(true)
    
    // Now remove the getDirectory method to simulate OPFS not being available
    delete global.navigator.storage.getDirectory
    
    // Create a new instance with the modified environment
    const opfsStorage2 = new OPFSStorage()
    expect(opfsStorage2.isOPFSAvailable()).toBe(false)
  })

  it('should initialize and perform basic operations with OPFS storage', async () => {
    // Create a new instance with our mocked environment
    const opfsStorage = new OPFSStorage()
    
    // Initialize the storage
    await opfsStorage.init()
    
    // Test basic metadata operations
    const testMetadata = { test: 'data', value: 123 }
    await opfsStorage.saveMetadata('test-key', testMetadata)
    
    const retrievedMetadata = await opfsStorage.getMetadata('test-key')
    expect(retrievedMetadata).toEqual(testMetadata)
    
    // Clean up
    await opfsStorage.clear()
  })

  it('should handle noun operations correctly', async () => {
    // Create a new instance with our mocked environment
    const opfsStorage = new OPFSStorage()
    
    // Initialize the storage
    await opfsStorage.init()
    
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
    await opfsStorage.saveNoun(testNoun)
    
    // Retrieve the noun
    const retrievedNoun = await opfsStorage.getNoun('test-noun-1')
    
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
    
    // Test getAllNouns
    const allNouns = await opfsStorage.getAllNouns()
    expect(allNouns.length).toBe(1)
    expect(allNouns[0].id).toBe('test-noun-1')
    
    // Test deleteNoun
    await opfsStorage.deleteNoun('test-noun-1')
    const deletedNoun = await opfsStorage.getNoun('test-noun-1')
    expect(deletedNoun).toBeNull()
    
    // Clean up
    await opfsStorage.clear()
  })

  it('should handle verb operations correctly', async () => {
    // Create a new instance with our mocked environment
    const opfsStorage = new OPFSStorage()
    
    // Initialize the storage
    await opfsStorage.init()
    
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
    await opfsStorage.saveVerb(testVerb)
    
    // Retrieve the verb
    const retrievedVerb = await opfsStorage.getVerb('test-verb-1')
    
    // Verify the verb was saved and retrieved correctly
    expect(retrievedVerb).toBeDefined()
    expect(retrievedVerb?.id).toBe('test-verb-1')
    expect(retrievedVerb?.vector).toEqual(testVector)
    expect(retrievedVerb?.source).toBe('source-noun-1')
    expect(retrievedVerb?.target).toBe('target-noun-1')
    expect(retrievedVerb?.verb).toBe('test-relation')
    expect(retrievedVerb?.weight).toBe(0.75)
    expect(retrievedVerb?.metadata).toEqual({ description: 'Test relation' })
    expect(retrievedVerb?.createdAt).toEqual(timestamp)
    expect(retrievedVerb?.updatedAt).toEqual(timestamp)
    expect(retrievedVerb?.createdBy).toEqual({
      augmentation: 'test-service',
      version: '1.0'
    })
    
    // Test getAllVerbs
    const allVerbs = await opfsStorage.getAllVerbs()
    expect(allVerbs.length).toBe(1)
    expect(allVerbs[0].id).toBe('test-verb-1')
    
    // Test getVerbsBySource
    const verbsBySource = await opfsStorage.getVerbsBySource('source-noun-1')
    expect(verbsBySource.length).toBe(1)
    expect(verbsBySource[0].id).toBe('test-verb-1')
    
    // Test getVerbsByTarget
    const verbsByTarget = await opfsStorage.getVerbsByTarget('target-noun-1')
    expect(verbsByTarget.length).toBe(1)
    expect(verbsByTarget[0].id).toBe('test-verb-1')
    
    // Test getVerbsByType
    const verbsByType = await opfsStorage.getVerbsByType('test-relation')
    expect(verbsByType.length).toBe(1)
    expect(verbsByType[0].id).toBe('test-verb-1')
    
    // Test deleteVerb
    await opfsStorage.deleteVerb('test-verb-1')
    const deletedVerb = await opfsStorage.getVerb('test-verb-1')
    expect(deletedVerb).toBeNull()
    
    // Clean up
    await opfsStorage.clear()
  })

  it('should handle storage status correctly', async () => {
    // Create a new instance with our mocked environment
    const opfsStorage = new OPFSStorage()
    
    // Initialize the storage
    await opfsStorage.init()
    
    // Add some data to the storage
    const testVector: Vector = [0.1, 0.2, 0.3, 0.4, 0.5]
    const testNoun = {
      id: 'test-noun-1',
      vector: testVector,
      connections: new Map([
        [0, new Set(['test-noun-2', 'test-noun-3'])]
      ])
    }
    
    await opfsStorage.saveNoun(testNoun)
    await opfsStorage.saveMetadata('test-key', { test: 'data', value: 123 })
    
    // Get storage status
    const status = await opfsStorage.getStorageStatus()
    
    // Verify status
    expect(status.type).toBe('opfs')
    expect(status.used).toBeGreaterThan(0)
    expect(status.quota).toBeGreaterThan(0)
    
    // Clean up
    await opfsStorage.clear()
  })

  it('should handle persistence correctly', async () => {
    // Create a new instance with our mocked environment
    const opfsStorage = new OPFSStorage()
    
    // Initialize the storage
    await opfsStorage.init()
    
    // Test persistence methods
    const isPersisted = await opfsStorage.isPersistent()
    expect(isPersisted).toBe(true)
    
    // Get the current persistence state
    const initialPersistence = await opfsStorage.isPersistent()
    expect(initialPersistence).toBe(true)
    
    // Request persistence (should return true with our mock)
    const persistResult = await opfsStorage.requestPersistentStorage()
    expect(persistResult).toBe(true)
    
    // Clean up
    await opfsStorage.clear()
  })
})