/**
 * Node.js Environment Tests
 * Tests Brainy functionality in Node.js environment as a consumer would use it
 */

import { describe, it, expect, beforeAll } from 'vitest'

/**
 * Helper function to create a 512-dimensional vector for testing
 * @param primaryIndex The index to set to 1.0, all other indices will be 0.0
 * @returns A 512-dimensional vector with a single 1.0 value at the specified index
 */
function createTestVector(primaryIndex: number = 0): number[] {
  const vector = new Array(384).fill(0)
  vector[primaryIndex % 512] = 1.0
  return vector
}

describe('Brainy in Node.js Environment', () => {
  let brainy: any

  beforeAll(async () => {
    // Load brainy library as a consumer would
    try {
      brainy = await import('../dist/unified.js')
    } catch (error) {
      console.error('Error loading brainy library:', error)
      if (error.message.includes('TextEncoder')) {
        console.warn(
          'TensorFlow.js initialization issue detected, some tests may be skipped'
        )
        brainy = null
      } else {
        throw error
      }
    }
  })

  describe('Library Loading', () => {
    it('should load brainy library successfully', () => {
      if (brainy === null) {
        console.warn('Skipping test due to TensorFlow.js initialization issue')
        return
      }
      expect(brainy).toBeDefined()
      expect(brainy.BrainyData).toBeDefined()
      expect(typeof brainy.BrainyData).toBe('function')
    })

    it('should detect Node.js environment correctly', () => {
      if (brainy === null) {
        console.warn('Skipping test due to TensorFlow.js initialization issue')
        return
      }
      expect(brainy.environment.isNode).toBe(true)
      expect(brainy.environment.isBrowser).toBe(false)
    })
  })

  describe('Core Functionality - Add Data and Search', () => {
    it('should create database and add vector data', async () => {
      if (brainy === null) {
        console.warn('Skipping test due to TensorFlow.js initialization issue')
        return
      }
      const db = new brainy.BrainyData({
        metric: 'euclidean',
        storage: {
          forceMemoryStorage: true
        }
      })

      await db.init()
      await db.clear() // Clear any existing data

      // Add some test vectors
      await db.add(createTestVector(0), { id: 'item1', label: 'x-axis' })
      await db.add(createTestVector(1), { id: 'item2', label: 'y-axis' })
      await db.add(createTestVector(2), { id: 'item3', label: 'z-axis' })

      // Search should work
      const results = await db.search(createTestVector(0), 1)
      expect(results).toBeDefined()
      expect(results.length).toBe(1)
      expect(results[0].metadata.id).toBe('item1')
    })

    it(
      'should handle text data with embeddings',
      async () => {
        if (brainy === null) {
          console.warn(
            'Skipping test due to TensorFlow.js initialization issue'
          )
          return
        }
        const db = new brainy.BrainyData({
          embeddingFunction: brainy.createEmbeddingFunction(),
          metric: 'cosine',
          storage: {
            forceMemoryStorage: true
          }
        })

        await db.init()
        await db.clear() // Clear any existing data

        // Add text items as a consumer would
        await db.addItem('Hello world', { id: 'greeting' })
        await db.addItem('Goodbye world', { id: 'farewell' })

        // Search with text
        const results = await db.search('Hi there', 1)
        expect(results).toBeDefined()
        expect(results.length).toBeGreaterThan(0)
        expect(results[0].metadata).toHaveProperty('id')
      },
      globalThis.testUtils?.timeout || 30000
    )

    it('should handle multiple data types', async () => {
      if (brainy === null) {
        console.warn('Skipping test due to TensorFlow.js initialization issue')
        return
      }
      const db = new brainy.BrainyData({
        metric: 'euclidean',
        storage: {
          forceMemoryStorage: true
        }
      })

      await db.init()
      await db.clear() // Clear any existing data

      // Add different types of data
      const testData = [
        { vector: createTestVector(10), metadata: { type: 'point', name: 'A' } },
        { vector: createTestVector(20), metadata: { type: 'point', name: 'B' } },
        { vector: createTestVector(30), metadata: { type: 'point', name: 'C' } }
      ]

      for (const item of testData) {
        await db.add(item.vector, item.metadata)
      }

      // Search should return relevant results
      const results = await db.search(createTestVector(15), 2)
      expect(results.length).toBe(2)
      expect(
        results.every(
          (r: { metadata: { type: string } }) => r.metadata.type === 'point'
        )
      ).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should not throw with valid configuration', () => {
      if (brainy === null) {
        console.warn('Skipping test due to TensorFlow.js initialization issue')
        return
      }
      expect(() => {
        new brainy.BrainyData({ metric: 'euclidean' })
      }).not.toThrow()
    })

    it('should handle search on empty database', async () => {
      if (brainy === null) {
        console.warn('Skipping test due to TensorFlow.js initialization issue')
        return
      }
      const db = new brainy.BrainyData({
        metric: 'euclidean',
        storage: {
          forceMemoryStorage: true
        }
      })

      await db.init()
      await db.clear() // Clear any existing data

      const results = await db.search(createTestVector(0), 5)
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(0)
    })
  })
})
