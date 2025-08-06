/**
 * Tests for offset-based pagination in search results
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BrainyData } from '../src/brainyData.js'
import { cleanupWorkerPools } from '../src/utils/index.js'

describe('Pagination with Offset', () => {
  let db: BrainyData

  beforeEach(async () => {
    // Initialize BrainyData with in-memory storage for testing
    db = new BrainyData({
      storage: {
        forceMemoryStorage: true
      },
      logging: {
        verbose: false
      }
    })
    await db.init()
  })

  afterEach(async () => {
    await db.clear()
    await cleanupWorkerPools()
  })

  describe('Basic Offset Pagination', () => {
    it('should return correct results with offset=0', async () => {
      // Add test data
      const testData = []
      for (let i = 0; i < 20; i++) {
        const item = {
          id: `item-${i}`,
          text: `test document ${i}`,
          value: i
        }
        testData.push(item)
        await db.add(item)
      }

      // Search without offset (default offset=0)
      const results = await db.search('test document', 5)
      expect(results.length).toBe(5)
      
      // Results should be the top 5 most similar
      const resultIds = results.map(r => r.metadata.id)
      expect(resultIds.length).toBe(5)
    })

    it('should skip results with offset > 0', async () => {
      // Add test data
      const testData = []
      for (let i = 0; i < 20; i++) {
        const item = {
          id: `item-${i}`,
          text: `test document ${i}`,
          value: i
        }
        testData.push(item)
        await db.add(item)
      }

      // Get first page (no offset)
      const firstPage = await db.search('test document', 5)
      expect(firstPage.length).toBe(5)
      const firstPageIds = firstPage.map(r => r.metadata.id)

      // Get second page (offset=5)
      const secondPage = await db.search('test document', 5, { offset: 5 })
      expect(secondPage.length).toBe(5)
      const secondPageIds = secondPage.map(r => r.metadata.id)

      // Ensure no overlap between pages
      const overlap = firstPageIds.filter(id => secondPageIds.includes(id))
      expect(overlap.length).toBe(0)
    })

    it('should handle offset beyond available results', async () => {
      // Add limited test data
      for (let i = 0; i < 10; i++) {
        await db.add({
          id: `item-${i}`,
          text: `test document ${i}`
        })
      }

      // Search with offset beyond available results
      const results = await db.search('test document', 5, { offset: 15 })
      expect(results.length).toBe(0)
    })

    it('should return partial results when offset + k exceeds total', async () => {
      // Add limited test data
      for (let i = 0; i < 10; i++) {
        await db.add({
          id: `item-${i}`,
          text: `test document ${i}`
        })
      }

      // Search with offset that allows only partial results
      const results = await db.search('test document', 5, { offset: 7 })
      expect(results.length).toBe(3) // Only 3 results available after offset 7
    })
  })

  describe('Pagination with Filters', () => {
    it.skip('should paginate with noun type filters', async () => {
      // TODO: This test requires proper noun type support in the add method
      // Currently skipped as noun types are not directly supported in the add method
      // Add test data with different noun types
      for (let i = 0; i < 15; i++) {
        await db.add({
          id: `doc-${i}`,
          text: `document ${i}`,
          type: 'document'
        }, undefined, 'document')
      }
      
      for (let i = 0; i < 15; i++) {
        await db.add({
          id: `note-${i}`,
          text: `note ${i}`,
          type: 'note'
        }, undefined, 'note')
      }

      // Get first page of documents
      const firstPage = await db.search('document', 5, {
        nounTypes: ['document']
      })
      expect(firstPage.length).toBe(5)
      expect(firstPage.every(r => r.metadata.type === 'document')).toBe(true)

      // Get second page of documents
      const secondPage = await db.search('document', 5, {
        nounTypes: ['document'],
        offset: 5
      })
      expect(secondPage.length).toBe(5)
      expect(secondPage.every(r => r.metadata.type === 'document')).toBe(true)
      
      // Ensure pages are different
      const firstIds = firstPage.map(r => r.metadata.id)
      const secondIds = secondPage.map(r => r.metadata.id)
      const overlap = firstIds.filter(id => secondIds.includes(id))
      expect(overlap.length).toBe(0)
    })

    it('should paginate with service filters', async () => {
      // Add test data with different services
      for (let i = 0; i < 20; i++) {
        const metadata = {
          id: `item-${i}`,
          text: `test item ${i}`,
          createdBy: {
            augmentation: i < 10 ? 'service-a' : 'service-b'
          }
        }
        await db.add(metadata)
      }

      // Get paginated results for service-a
      const page1 = await db.search('test item', 3, {
        service: 'service-a'
      })
      const page2 = await db.search('test item', 3, {
        service: 'service-a',
        offset: 3
      })

      // Check that results are from service-a
      expect(page1.every(r => r.metadata.createdBy?.augmentation === 'service-a')).toBe(true)
      expect(page2.every(r => r.metadata.createdBy?.augmentation === 'service-a')).toBe(true)
      
      // Check no overlap
      const page1Ids = page1.map(r => r.metadata.id)
      const page2Ids = page2.map(r => r.metadata.id)
      expect(page1Ids.filter(id => page2Ids.includes(id)).length).toBe(0)
    })
  })

  describe('Pagination Consistency', () => {
    it('should maintain consistent ordering across pages', async () => {
      // Add test data
      for (let i = 0; i < 30; i++) {
        await db.add({
          id: `item-${i.toString().padStart(2, '0')}`,
          text: `consistent test ${i}`,
          score: Math.random()
        })
      }

      // Get all results in one query
      const allResults = await db.search('consistent test', 30)
      const allIds = allResults.map(r => r.metadata.id)

      // Get results in pages
      const page1 = await db.search('consistent test', 10, { offset: 0 })
      const page2 = await db.search('consistent test', 10, { offset: 10 })
      const page3 = await db.search('consistent test', 10, { offset: 20 })

      const pagedIds = [
        ...page1.map(r => r.metadata.id),
        ...page2.map(r => r.metadata.id),
        ...page3.map(r => r.metadata.id)
      ]

      // Check that paginated results match the full query
      expect(pagedIds).toEqual(allIds)
    })

    it('should handle empty results gracefully', async () => {
      // Search empty database with offset
      const results = await db.search('nonexistent', 10, { offset: 5 })
      expect(results).toEqual([])
    })
  })

  describe('Vector Search with Offset', () => {
    it('should paginate vector searches', async () => {
      // Add test vectors
      for (let i = 0; i < 20; i++) {
        const vector = new Array(384).fill(0).map(() => Math.random())
        await db.add({
          id: `vec-${i}`,
          vector: vector,
          index: i
        })
      }

      // Create a query vector
      const queryVector = new Array(384).fill(0).map(() => Math.random())

      // Get first page
      const page1 = await db.search(queryVector, 5, { forceEmbed: false })
      expect(page1.length).toBe(5)

      // Get second page
      const page2 = await db.search(queryVector, 5, { 
        forceEmbed: false,
        offset: 5 
      })
      expect(page2.length).toBe(5)

      // Ensure different results
      const page1Ids = page1.map(r => r.metadata.id)
      const page2Ids = page2.map(r => r.metadata.id)
      expect(page1Ids.filter(id => page2Ids.includes(id)).length).toBe(0)
    })
  })
})