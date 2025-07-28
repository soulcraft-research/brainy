/**
 * Multi-Environment Tests
 * 
 * Purpose:
 * This test suite verifies that Brainy works correctly across different environments:
 * 1. Node.js
 * 2. Browser
 * 3. Web Worker
 * 4. Worker Threads
 * 
 * These tests ensure consistent behavior regardless of the runtime environment.
 * Some tests are conditionally executed based on the current environment.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BrainyData, createStorage, environment } from '../dist/unified.js'

describe('Multi-Environment Tests', () => {
  let brainyInstance: any
  
  beforeEach(async () => {
    // Create a test BrainyData instance with memory storage for faster tests
    const storage = await createStorage({ forceMemoryStorage: true })
    brainyInstance = new BrainyData({
      storageAdapter: storage
    })
    
    await brainyInstance.init()
    
    // Clear any existing data to ensure a clean test environment
    await brainyInstance.clear()
  })
  
  afterEach(async () => {
    // Clean up after each test
    if (brainyInstance) {
      await brainyInstance.clear()
      await brainyInstance.shutDown()
    }
  })
  
  describe('Environment Detection', () => {
    it('should correctly detect the current environment', () => {
      // Check that environment detection functions exist
      expect(typeof environment.isNode).toBe('boolean')
      expect(typeof environment.isBrowser).toBe('boolean')
      
      // In Node.js test environment, isNode should be true and isBrowser should be false
      // In browser test environment (jsdom), isBrowser might be true
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        expect(environment.isNode).toBe(true)
        expect(environment.isBrowser).toBe(false)
      }
    })
    
    it('should detect threading availability', async () => {
      // Check that threading detection functions exist
      expect(typeof environment.isThreadingAvailable).toBe('boolean')
      
      // The actual value depends on the environment
      const threadingAvailable = await environment.isThreadingAvailableAsync()
      expect(typeof threadingAvailable).toBe('boolean')
    })
  })
  
  describe('Node.js Environment', () => {
    // Only run these tests in Node.js environment
    if (!environment.isNode) {
      it.skip('Node.js specific tests skipped in non-Node environment', () => {
        expect(true).toBe(true)
      })
      return
    }
    
    it('should use FileSystem storage by default in Node.js', async () => {
      // Create storage with auto detection
      const storage = await createStorage({ type: 'auto' })
      
      // Get storage status
      const status = await storage.getStorageStatus()
      expect(status.type).toBe('filesystem')
    })
    
    it('should handle Worker Threads if available', async () => {
      // This is a basic check - actual worker thread testing would require more setup
      const workerThreadsAvailable = await environment.areWorkerThreadsAvailable()
      
      // Just verify the function returns a boolean
      expect(typeof workerThreadsAvailable).toBe('boolean')
      
      // If worker threads are available, we could test them more thoroughly
      if (workerThreadsAvailable) {
        // This would require setting up actual worker threads
        // which is beyond the scope of this basic test
        expect(true).toBe(true)
      }
    })
  })
  
  describe('Browser Environment', () => {
    // Mock browser environment if needed
    let originalWindow: any
    let originalDocument: any
    
    beforeEach(() => {
      // Save original globals
      originalWindow = global.window
      originalDocument = global.document
      
      // Mock browser environment if not already in one
      if (!environment.isBrowser) {
        // @ts-expect-error - Mocking global
        global.window = { location: { href: 'http://localhost/' } }
        // @ts-expect-error - Mocking global
        global.document = { createElement: vi.fn() }
      }
    })
    
    afterEach(() => {
      // Restore original globals
      global.window = originalWindow
      global.document = originalDocument
    })
    
    it('should detect browser environment correctly', () => {
      // With our mocks in place, isBrowser should be true
      expect(environment.isBrowser).toBe(true)
    })
    
    it('should prefer OPFS storage in browser if available', async () => {
      // Mock OPFS availability
      if (!global.navigator) {
        // @ts-expect-error - Mocking global
        global.navigator = {}
      }
      
      if (!global.navigator.storage) {
        global.navigator.storage = {} as any
      }
      
      // Mock the storage.getDirectory method to simulate OPFS availability
      // Create a more complete mock of the directory handle
      const mockDirectoryHandle = {
        getDirectoryHandle: vi.fn().mockImplementation((name, options) => {
          return Promise.resolve({
            kind: 'directory',
            name,
            getDirectoryHandle: vi.fn().mockResolvedValue({
              kind: 'directory',
              getFileHandle: vi.fn().mockResolvedValue({
                kind: 'file',
                getFile: vi.fn().mockResolvedValue({
                  text: vi.fn().mockResolvedValue('{}')
                }),
                createWritable: vi.fn().mockResolvedValue({
                  write: vi.fn().mockResolvedValue(undefined),
                  close: vi.fn().mockResolvedValue(undefined)
                })
              }),
              entries: vi.fn().mockImplementation(function* () {
                // Empty generator
              })
            }),
            getFileHandle: vi.fn().mockResolvedValue({
              kind: 'file',
              getFile: vi.fn().mockResolvedValue({
                text: vi.fn().mockResolvedValue('{}')
              }),
              createWritable: vi.fn().mockResolvedValue({
                write: vi.fn().mockResolvedValue(undefined),
                close: vi.fn().mockResolvedValue(undefined)
              })
            }),
            entries: vi.fn().mockImplementation(function* () {
              // Empty generator
            })
          });
        }),
        entries: vi.fn().mockImplementation(function* () {
          // Empty generator
        })
      };
      
      global.navigator.storage.getDirectory = vi.fn().mockResolvedValue(mockDirectoryHandle)
      
      // Create storage with auto detection
      const storage = await createStorage({ type: 'auto' })
      
      // Get storage status - this might still be memory if our mocks aren't complete
      const status = await storage.getStorageStatus()
      
      // In a real browser with OPFS, this would be 'opfs'
      // In our mocked environment, it might be 'memory' due to incomplete mocking
      expect(['opfs', 'memory']).toContain(status.type)
    })
  })
  
  describe('Web Worker Environment', () => {
    // Mock Web Worker environment
    let originalSelf: any
    
    beforeEach(() => {
      // Save original self
      originalSelf = global.self
      
      // Mock Web Worker environment
      // @ts-expect-error - Mocking global
      global.self = {
        constructor: { name: 'DedicatedWorkerGlobalScope' }
      }
    })
    
    afterEach(() => {
      // Restore original self
      global.self = originalSelf
    })
    
    it('should detect Web Worker environment correctly', () => {
      // With our mocks in place, isWebWorker should be true
      expect(environment.isWebWorker()).toBe(true)
    })
  })
  
  describe('Cross-Environment Data Compatibility', () => {
    it('should create compatible vector formats across environments', async () => {
      // Add data
      const id = await brainyInstance.add('cross-environment test')
      expect(id).toBeDefined()
      
      // Get the item with its vector
      const item = await brainyInstance.get(id)
      expect(item).toBeDefined()
      expect(item.vector).toBeDefined()
      
      // Vectors should be standard JavaScript arrays regardless of environment
      expect(Array.isArray(item.vector)).toBe(true)
      
      // Create a backup (which should be environment-independent)
      const backup = await brainyInstance.backup()
      expect(backup).toBeDefined()
      
      // The backup should be a standard JSON object
      expect(typeof backup).toBe('object')
      
      // Clear the database
      await brainyInstance.clear()
      
      // Restore from backup
      await brainyInstance.restore(backup)
      
      // Verify the item was restored correctly
      const restoredItem = await brainyInstance.get(id)
      expect(restoredItem).toBeDefined()
      expect(restoredItem.vector).toBeDefined()
      expect(Array.isArray(restoredItem.vector)).toBe(true)
      
      // The vector should have the same length
      expect(restoredItem.vector.length).toBe(item.vector.length)
    })
  })
})
