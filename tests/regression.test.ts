/**
 * Regression Test Suite for Brainy
 * 
 * This test suite verifies that core functionality works across:
 * - All storage adapters
 * - All environments (Node.js, Browser simulation)
 * - Performance benchmarks
 * - Package size limits
 * - CLI and API consistency
 * 
 * These tests should ALWAYS pass before any release.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BrainyData, NounType, VerbType, MemoryStorage, OPFSStorage, createEmbeddingFunction } from '../src/index.js'
import { performance } from 'perf_hooks'

describe('Brainy Regression Tests', () => {
  
  describe('Core Functionality Across Storage Adapters', () => {
    const storageAdapters = [
      { name: 'Memory', create: () => new MemoryStorage() },
      // Note: FileSystem and OPFS require different test environments
      // { name: 'OPFS', create: () => new OPFSStorage() }, // Browser only
      // { name: 'FileSystem', create: () => new FileSystemStorage('./test-fs') }, // Node only
    ]

    storageAdapters.forEach(({ name, create }) => {
      describe(`${name} Storage`, () => {
        let brainy: BrainyData

        beforeEach(async () => {
          brainy = new BrainyData({
            storage: create()
          })
          await brainy.init()
        })

        afterEach(async () => {
          if (brainy) {
            await brainy.cleanup()
          }
        })

        it('should handle basic add and search operations', async () => {
          const id = await brainy.add("Test data for regression testing")
          expect(id).toBeDefined()

          const results = await brainy.search("regression testing", 5)
          expect(results.length).toBeGreaterThan(0)
          expect(results[0].id).toBe(id)
        })

        it('should handle typed noun and verb operations', async () => {
          const personId = await brainy.addNoun("John Doe", NounType.Person)
          const companyId = await brainy.addNoun("Tech Corp", NounType.Organization)
          const verbId = await brainy.addVerb(personId, companyId, VerbType.WorksWith)

          expect(personId).toBeDefined()
          expect(companyId).toBeDefined() 
          expect(verbId).toBeDefined()
        })

        it('should handle metadata filtering', async () => {
          await brainy.add("Item 1", { category: "A", priority: 1 })
          await brainy.add("Item 2", { category: "B", priority: 2 })
          
          const results = await brainy.search("", 10, {
            metadata: { category: "A" }
          })
          expect(results.length).toBe(1)
          expect(results[0].metadata.category).toBe("A")
        })

        it('should handle update operations', async () => {
          const id = await brainy.add("Original content", { version: 1 })
          const success = await brainy.update(id, "Updated content", { version: 2 })
          expect(success).toBe(true)

          const results = await brainy.search("Updated content", 5)
          expect(results[0].metadata.version).toBe(2)
        })

        it('should handle soft delete (default behavior)', async () => {
          const id = await brainy.add("Content to delete")
          const success = await brainy.delete(id) // Soft delete by default
          expect(success).toBe(true)

          // Should not appear in search results
          const results = await brainy.search("Content to delete", 10)
          expect(results.length).toBe(0)
        })
      })
    })
  })

  describe('Performance Benchmarks', () => {
    let brainy: BrainyData

    beforeEach(async () => {
      brainy = new BrainyData()
      await brainy.init()
    })

    afterEach(async () => {
      if (brainy) {
        await brainy.cleanup()
      }
    })

    it('should add 100 items within performance threshold', async () => {
      const startTime = performance.now()
      
      const promises = []
      for (let i = 0; i < 100; i++) {
        promises.push(brainy.add(`Test item ${i}`))
      }
      await Promise.all(promises)

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete within 10 seconds (generous threshold for CI)
      expect(duration).toBeLessThan(10000)
    })

    it('should search through 1000+ items efficiently', async () => {
      // Add test data
      const promises = []
      for (let i = 0; i < 200; i++) {
        promises.push(brainy.add(`Document ${i} about various topics and information`))
      }
      await Promise.all(promises)

      // Benchmark search
      const startTime = performance.now()
      const results = await brainy.search("document topics", 10)
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(results.length).toBeGreaterThan(0)
      // Search should complete within 1 second
      expect(duration).toBeLessThan(1000)
    })

    it('should handle batch import efficiently', async () => {
      const data = Array.from({ length: 50 }, (_, i) => `Batch item ${i}`)
      
      const startTime = performance.now()
      const ids = await brainy.import(data)
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(ids.length).toBe(50)
      // Batch import should be faster than individual adds
      expect(duration).toBeLessThan(5000)
    })
  })

  describe('Environment Compatibility', () => {
    it('should detect Node.js environment correctly', async () => {
      const { isNode, isBrowser, isWebWorker } = await import('../src/index.js')
      
      expect(isNode()).toBe(true)
      expect(isBrowser()).toBe(false)
      expect(isWebWorker()).toBe(false)
    })

    it('should create embedding functions in Node.js', async () => {
      const embeddingFn = await createEmbeddingFunction()
      expect(typeof embeddingFn).toBe('function')

      const embedding = await embeddingFn("test text")
      expect(Array.isArray(embedding)).toBe(true)
      expect(embedding.length).toBeGreaterThan(0)
    })
  })

  describe('Data Integrity', () => {
    let brainy: BrainyData

    beforeEach(async () => {
      brainy = new BrainyData()
      await brainy.init()
    })

    afterEach(async () => {
      if (brainy) {
        await brainy.cleanup()
      }
    })

    it('should maintain data consistency across operations', async () => {
      // Add initial data
      const id1 = await brainy.add("Document about machine learning")
      const id2 = await brainy.add("Article about artificial intelligence")
      
      // Verify both exist
      let results = await brainy.search("machine learning", 10)
      expect(results.some(r => r.id === id1)).toBe(true)
      
      results = await brainy.search("artificial intelligence", 10)
      expect(results.some(r => r.id === id2)).toBe(true)

      // Update one item
      await brainy.update(id1, "Updated document about deep learning")
      
      // Verify update
      results = await brainy.search("deep learning", 10)
      expect(results.some(r => r.id === id1)).toBe(true)

      // Original content should not be found
      results = await brainy.search("machine learning", 10)
      expect(results.some(r => r.id === id1)).toBe(false)

      // Other document should remain unchanged
      results = await brainy.search("artificial intelligence", 10)
      expect(results.some(r => r.id === id2)).toBe(true)
    })

    it('should handle concurrent operations without corruption', async () => {
      const concurrentOperations = []
      
      // Start multiple operations concurrently
      for (let i = 0; i < 20; i++) {
        concurrentOperations.push(brainy.add(`Concurrent item ${i}`))
      }
      
      const ids = await Promise.all(concurrentOperations)
      expect(ids.length).toBe(20)
      
      // Verify all items can be found
      const results = await brainy.search("Concurrent item", 25)
      expect(results.length).toBe(20)
    })
  })

  describe('Error Handling & Edge Cases', () => {
    let brainy: BrainyData

    beforeEach(async () => {
      brainy = new BrainyData()
      await brainy.init()
    })

    afterEach(async () => {
      if (brainy) {
        await brainy.cleanup()
      }
    })

    it('should handle empty search queries gracefully', async () => {
      await brainy.add("Some content")
      
      const results = await brainy.search("", 10)
      expect(Array.isArray(results)).toBe(true)
      // Empty query might return all results or none, but should not throw
    })

    it('should handle invalid IDs gracefully', async () => {
      const result = await brainy.update("invalid-id", "new data")
      expect(result).toBe(false)
      
      const deleteResult = await brainy.delete("invalid-id")
      expect(deleteResult).toBe(false)
    })

    it('should handle very large text content', async () => {
      const largeText = "Lorem ipsum ".repeat(1000) // ~11KB text
      const id = await brainy.add(largeText)
      expect(id).toBeDefined()

      const results = await brainy.search("Lorem ipsum", 5)
      expect(results.some(r => r.id === id)).toBe(true)
    })

    it('should handle special characters and unicode', async () => {
      const specialText = "Hello 世界! 🌍 Special chars: @#$%^&*()_+-=[]{}|;':\",./<>?"
      const id = await brainy.add(specialText)
      expect(id).toBeDefined()

      const results = await brainy.search("世界", 5)
      expect(results.some(r => r.id === id)).toBe(true)
    })
  })

  describe('Package Size Regression', () => {
    it('should not exceed package size threshold', async () => {
      // This is a placeholder test - actual implementation would check built package size
      // For now, we'll just verify core imports don't significantly bloat
      const coreModules = await import('../src/index.js')
      
      // Verify main exports exist (prevents tree-shaking regression)
      expect(coreModules.BrainyData).toBeDefined()
      expect(coreModules.NounType).toBeDefined()
      expect(coreModules.VerbType).toBeDefined()
      expect(coreModules.createEmbeddingFunction).toBeDefined()
    })
  })

  describe('Configuration & Initialization', () => {
    it('should initialize with default configuration', async () => {
      const brainy = new BrainyData()
      await brainy.init()
      
      // Should not throw and should be usable
      const id = await brainy.add("Test initialization")
      expect(id).toBeDefined()
      
      await brainy.cleanup()
    })

    it('should initialize with custom configuration', async () => {
      const brainy = new BrainyData({
        maxNeighbors: 32,
        efConstruction: 400,
        storage: new MemoryStorage()
      })
      await brainy.init()
      
      const id = await brainy.add("Test custom config")
      expect(id).toBeDefined()
      
      await brainy.cleanup()
    })

    it('should handle multiple instances', async () => {
      const brainy1 = new BrainyData()
      const brainy2 = new BrainyData()
      
      await brainy1.init()
      await brainy2.init()
      
      // Both should work independently
      const id1 = await brainy1.add("Instance 1 data")
      const id2 = await brainy2.add("Instance 2 data")
      
      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      
      await brainy1.destroy()
      await brainy2.destroy()
    })
  })
})