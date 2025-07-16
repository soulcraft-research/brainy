/**
 * Browser Environment Tests
 * Tests Brainy functionality in browser environment as a consumer would use it
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'

describe('Brainy in Browser Environment', () => {
  let brainy: any

  beforeAll(async () => {
    // Minimal browser environment setup for jsdom
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'TextEncoder', {
        writable: true,
        value: TextEncoder
      })
      Object.defineProperty(window, 'TextDecoder', {
        writable: true,
        value: TextDecoder
      })

      // Mock Web Workers for jsdom
      Object.defineProperty(window, 'Worker', {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          postMessage: vi.fn(),
          terminate: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn()
        }))
      })
    }

    // Load brainy library as a consumer would
    brainy = await import('../dist/unified.js')
  })

  describe('Library Loading', () => {
    it('should load brainy library successfully', () => {
      expect(brainy).toBeDefined()
      expect(brainy.BrainyData).toBeDefined()
      expect(typeof brainy.BrainyData).toBe('function')
    })

    it('should detect browser environment correctly', () => {
      expect(brainy.environment.isBrowser).toBe(true)
      expect(brainy.environment.isNode).toBe(false)
    })
  })

  describe('Core Functionality - Add Data and Search', () => {
    it('should create database and add vector data', async () => {
      const db = new brainy.BrainyData({
        dimensions: 3,
        metric: 'euclidean',
        storage: {
          forceMemoryStorage: true
        }
      })

      await db.init()

      // Add some test vectors
      await db.add([1, 0, 0], { id: 'item1', label: 'x-axis' })
      await db.add([0, 1, 0], { id: 'item2', label: 'y-axis' })
      await db.add([0, 0, 1], { id: 'item3', label: 'z-axis' })

      // Search should work
      const results = await db.search([1, 0, 0], 1)
      expect(results).toBeDefined()
      expect(results.length).toBe(1)
      expect(results[0].metadata.id).toBe('item1')
    })

    it(
      'should handle text data with embeddings',
      async () => {
        const db = new brainy.BrainyData({
          embeddingFunction: brainy.createEmbeddingFunction(),
          metric: 'cosine',
          storage: {
            forceMemoryStorage: true
          }
        })

        await db.init()

        // Add text items as a consumer would
        await db.addItem('Hello browser world', { id: 'greeting' })
        await db.addItem('Goodbye browser world', { id: 'farewell' })

        // Search with text
        const results = await db.search('Hi there', 1)
        expect(results).toBeDefined()
        expect(results.length).toBeGreaterThan(0)
        expect(results[0].metadata).toHaveProperty('id')
      },
      globalThis.testUtils?.timeout || 30000
    )

    it('should handle multiple data types', async () => {
      const db = new brainy.BrainyData({
        dimensions: 2,
        metric: 'euclidean',
        storage: {
          forceMemoryStorage: true
        }
      })

      await db.init()

      // Add different types of data
      const testData = [
        { vector: [1, 1], metadata: { type: 'point', name: 'A' } },
        { vector: [2, 2], metadata: { type: 'point', name: 'B' } },
        { vector: [3, 3], metadata: { type: 'point', name: 'C' } }
      ]

      for (const item of testData) {
        await db.add(item.vector, item.metadata)
      }

      // Search should return relevant results
      const results = await db.search([1.5, 1.5], 2)
      expect(results.length).toBe(2)
      expect(
        results.every(
          (r: { metadata: { type: string } }) => r.metadata.type === 'point'
        )
      ).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid configurations gracefully', () => {
      expect(() => {
        new brainy.BrainyData({ dimensions: 0 })
      }).toThrow()
    })

    it('should handle search on empty database', async () => {
      const db = new brainy.BrainyData({
        dimensions: 2,
        metric: 'euclidean',
        storage: {
          forceMemoryStorage: true
        }
      })

      await db.init()

      const results = await db.search([1, 2], 5)
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(0)
    })
  })
})
