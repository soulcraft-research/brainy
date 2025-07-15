/**
 * Core Functionality Tests
 * Tests core Brainy features as a consumer would use them
 */

import { describe, it, expect, beforeAll } from 'vitest'

describe('Brainy Core Functionality', () => {
  let brainy: any

  beforeAll(async () => {
    // Load brainy library as a consumer would
    brainy = await import('../dist/unified.js')
  })

  describe('Library Exports', () => {
    it('should export BrainyData class', () => {
      expect(brainy.BrainyData).toBeDefined()
      expect(typeof brainy.BrainyData).toBe('function')
    })

    it('should export environment detection functions', () => {
      expect(typeof brainy.isBrowser).toBe('function')
      expect(typeof brainy.isNode).toBe('function')
      expect(typeof brainy.isWebWorker).toBe('function')
      expect(typeof brainy.areWebWorkersAvailable).toBe('function')
      expect(typeof brainy.isThreadingAvailable).toBe('function')
    })

    it('should export embedding function creator', () => {
      expect(typeof brainy.createEmbeddingFunction).toBe('function')
    })

    it('should export environment object', () => {
      expect(brainy.environment).toBeDefined()
      expect(typeof brainy.environment).toBe('object')
      expect(brainy.environment).toHaveProperty('isBrowser')
      expect(brainy.environment).toHaveProperty('isNode')
      expect(brainy.environment).toHaveProperty('isServerless')
    })
  })

  describe('BrainyData Configuration', () => {
    it('should create instance with minimal configuration', () => {
      const data = new brainy.BrainyData({
        dimensions: 3
      })

      expect(data).toBeDefined()
      expect(data.dimensions).toBe(3)
    })

    it('should create instance with full configuration', () => {
      const data = new brainy.BrainyData({
        dimensions: 128,
        metric: 'cosine',
        maxConnections: 32,
        efConstruction: 200,
        storage: 'memory'
      })

      expect(data).toBeDefined()
      expect(data.dimensions).toBe(128)
    })

    it('should validate configuration parameters', () => {
      expect(() => {
        new brainy.BrainyData({
          dimensions: 0 // Invalid dimensions
        })
      }).toThrow()

      expect(() => {
        new brainy.BrainyData({
          dimensions: -1 // Invalid dimensions
        })
      }).toThrow()
    })

    it('should use default values for optional parameters', () => {
      const data = new brainy.BrainyData({
        dimensions: 10
      })

      expect(data.dimensions).toBe(10)
      // Should have reasonable defaults for other parameters
      expect(data.maxConnections).toBeGreaterThan(0)
      expect(data.efConstruction).toBeGreaterThan(0)
    })
  })

  describe('Vector Operations', () => {
    it('should handle vector addition and search', async () => {
      const data = new brainy.BrainyData({
        dimensions: 3,
        metric: 'euclidean'
      })

      await data.init()

      // Add vectors
      await data.add([1, 0, 0], { id: 'v1', label: 'x-axis' })
      await data.add([0, 1, 0], { id: 'v2', label: 'y-axis' })
      await data.add([0, 0, 1], { id: 'v3', label: 'z-axis' })

      // Search for similar vector
      const results = await data.search([1, 0, 0], 1)

      expect(results).toBeDefined()
      expect(results.length).toBe(1)
      expect(results[0].metadata.id).toBe('v1')
    })

    it('should handle batch vector operations', async () => {
      const data = new brainy.BrainyData({
        dimensions: 2,
        metric: 'euclidean'
      })

      await data.init()

      // Add multiple vectors
      const vectors = [
        { vector: [1, 1], metadata: { id: 'batch1' } },
        { vector: [2, 2], metadata: { id: 'batch2' } },
        { vector: [3, 3], metadata: { id: 'batch3' } }
      ]

      for (const { vector, metadata } of vectors) {
        await data.add(vector, metadata)
      }

      // Search should return results
      const results = await data.search([1.5, 1.5], 3)
      expect(results.length).toBe(3)
    })

    it('should handle different distance metrics', async () => {
      const euclideanData = new brainy.BrainyData({
        dimensions: 2,
        metric: 'euclidean'
      })

      const cosineData = new brainy.BrainyData({
        dimensions: 2,
        metric: 'cosine'
      })

      await euclideanData.init()
      await cosineData.init()

      const vector = [1, 1]
      const metadata = { id: 'test' }

      await euclideanData.add(vector, metadata)
      await cosineData.add(vector, metadata)

      const euclideanResults = await euclideanData.search(vector, 1)
      const cosineResults = await cosineData.search(vector, 1)

      expect(euclideanResults.length).toBe(1)
      expect(cosineResults.length).toBe(1)

      // Both should find the exact match, but distances might differ
      expect(euclideanResults[0].metadata.id).toBe('test')
      expect(cosineResults[0].metadata.id).toBe('test')
    })
  })

  describe('Text Processing', () => {
    it('should handle text items with embedding function', async () => {
      const embeddingFunction = brainy.createEmbeddingFunction()

      const data = new brainy.BrainyData({
        embeddingFunction,
        metric: 'cosine'
      })

      await data.init()

      // Add text items
      await data.addItem('Hello world', { id: 'greeting', type: 'text' })
      await data.addItem('Goodbye world', { id: 'farewell', type: 'text' })

      // Search with text
      const results = await data.search('Hi there', 1)

      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].metadata).toHaveProperty('id')
    }, testUtils.timeout)

    it('should handle mixed vector and text operations', async () => {
      const embeddingFunction = brainy.createEmbeddingFunction()

      const data = new brainy.BrainyData({
        embeddingFunction,
        metric: 'cosine'
      })

      await data.init()

      // Add text item
      await data.addItem('Machine learning', { id: 'text1', type: 'text' })

      // Add vector item (using embedding of similar text)
      const embedding = await embeddingFunction('Artificial intelligence')
      await data.add(embedding, { id: 'vector1', type: 'vector' })

      // Search should find both
      const results = await data.search('AI and ML', 2)

      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
    }, testUtils.timeout)
  })

  describe('Error Handling', () => {
    it('should handle invalid vector dimensions', async () => {
      const data = new brainy.BrainyData({
        dimensions: 3,
        metric: 'euclidean'
      })

      await data.init()

      // Try to add vector with wrong dimensions
      await expect(data.add([1, 2], { id: 'wrong' })).rejects.toThrow()
      await expect(data.add([1, 2, 3, 4], { id: 'wrong' })).rejects.toThrow()
    })

    it('should handle search before initialization', async () => {
      const data = new brainy.BrainyData({
        dimensions: 2,
        metric: 'euclidean'
      })

      // Try to search without initialization
      await expect(data.search([1, 2], 1)).rejects.toThrow()
    })

    it('should handle empty search results gracefully', async () => {
      const data = new brainy.BrainyData({
        dimensions: 2,
        metric: 'euclidean'
      })

      await data.init()

      // Search in empty database
      const results = await data.search([1, 2], 1)
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(0)
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle moderate number of vectors efficiently', async () => {
      const data = new brainy.BrainyData({
        dimensions: 10,
        metric: 'euclidean'
      })

      await data.init()

      const startTime = Date.now()

      // Add 100 test vectors
      for (let i = 0; i < 100; i++) {
        const vector = testUtils.createTestVector(10)
        await data.add(vector, { id: `item_${i}`, index: i })
      }

      const addTime = Date.now() - startTime

      // Search should be fast
      const searchStart = Date.now()
      const results = await data.search(testUtils.createTestVector(10), 10)
      const searchTime = Date.now() - searchStart

      expect(results.length).toBeLessThanOrEqual(10)
      expect(addTime).toBeLessThan(10000) // Should complete within 10 seconds
      expect(searchTime).toBeLessThan(1000) // Search should be under 1 second
    })

    it('should maintain search quality with more data', async () => {
      const data = new brainy.BrainyData({
        dimensions: 5,
        metric: 'euclidean'
      })

      await data.init()

      // Add some known vectors
      const knownVector = [1, 2, 3, 4, 5]
      await data.add(knownVector, { id: 'known', type: 'target' })

      // Add noise vectors
      for (let i = 0; i < 50; i++) {
        const noiseVector = testUtils.createTestVector(5)
        await data.add(noiseVector, { id: `noise_${i}`, type: 'noise' })
      }

      // Search for the known vector should still find it first
      const results = await data.search(knownVector, 5)

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].metadata.id).toBe('known')
    })
  })
})
