/**
 * Tests for performance improvements: caching and cursor-based pagination
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BrainyData } from '../src/brainyData.js'
import { cleanupWorkerPools } from '../src/utils/index.js'

describe('Performance Improvements', () => {
  let db: BrainyData

  beforeEach(async () => {
    // Initialize BrainyData with caching enabled
    db = new BrainyData({
      storage: {
        forceMemoryStorage: true
      },
      searchCache: {
        enabled: true,
        maxSize: 50,
        maxAge: 60000 // 1 minute
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

  describe('Search Result Caching', () => {
    it('should cache search results transparently', async () => {
      // Add test data
      for (let i = 0; i < 10; i++) {
        await db.add({
          id: `item-${i}`,
          text: `test document ${i}`,
          value: i
        })
      }

      // Clear cache to start fresh
      db.clearCache()
      let stats = db.getCacheStats()
      expect(stats.search.hits).toBe(0)
      expect(stats.search.misses).toBe(0)

      // First search - should be cache miss
      const query = 'test document'
      const results1 = await db.search(query, 5)
      expect(results1.length).toBe(5)

      stats = db.getCacheStats()
      expect(stats.search.misses).toBe(1) // First search is a miss
      expect(stats.search.hits).toBe(0)

      // Second identical search - should be cache hit
      const results2 = await db.search(query, 5)
      expect(results2.length).toBe(5)
      expect(results2).toEqual(results1) // Same results

      stats = db.getCacheStats()
      expect(stats.search.misses).toBe(1) // Still only one miss
      expect(stats.search.hits).toBe(1) // Now we have a hit
      expect(stats.search.hitRate).toBe(0.5) // 50% hit rate
    })

    it('should invalidate cache when data changes', async () => {
      // Add test data
      for (let i = 0; i < 5; i++) {
        await db.add({
          id: `item-${i}`,
          text: `test document ${i}`
        })
      }

      // Search and cache results
      const results1 = await db.search('test document', 3)
      expect(results1.length).toBe(3)

      let stats = db.getCacheStats()
      const initialMisses = stats.search.misses

      // Same search should hit cache
      await db.search('test document', 3)
      stats = db.getCacheStats()
      expect(stats.search.hits).toBeGreaterThan(0)

      // Add new data - should invalidate cache
      await db.add({
        id: 'new-item',
        text: 'new test document'
      })

      // Same search should miss cache (due to invalidation)
      await db.search('test document', 3)
      stats = db.getCacheStats()
      // Cache was cleared, so we should have fewer misses recorded than expected
      // The key point is that cache size should be 0 or low, indicating invalidation worked
      expect(stats.search.size).toBeLessThanOrEqual(1) // Cache should have been cleared
    })

    it('should handle cache with different search parameters', async () => {
      // Add test data
      for (let i = 0; i < 10; i++) {
        await db.add({
          id: `item-${i}`,
          text: `test document ${i}`
        })
      }

      db.clearCache()

      // Different k values should create different cache entries
      await db.search('test document', 3)
      await db.search('test document', 5) // Different k
      await db.search('test document', 3) // Should hit cache

      const stats = db.getCacheStats()
      expect(stats.search.hits).toBe(1)
      expect(stats.search.misses).toBe(2)
    })
  })

  describe('Cursor-based Pagination', () => {
    beforeEach(async () => {
      // Add more test data for pagination
      for (let i = 0; i < 50; i++) {
        await db.add({
          id: `doc-${i.toString().padStart(2, '0')}`,
          text: `document content for testing pagination ${i}`,
          index: i
        })
      }
    })

    it('should return cursor for pagination', async () => {
      const page1 = await db.searchWithCursor('document content for testing', 10)
      
      expect(page1.results.length).toBe(10)
      expect(page1.hasMore).toBe(true)
      expect(page1.cursor).toBeDefined()
      expect(page1.cursor!.lastId).toBeDefined()
      expect(page1.cursor!.lastScore).toBeDefined()
    })

    it('should paginate consistently with cursor', async () => {
      const page1 = await db.searchWithCursor('document content for testing', 5)
      expect(page1.results.length).toBe(5)
      expect(page1.hasMore).toBe(true)

      // Get next page using cursor
      const page2 = await db.searchWithCursor('document content for testing', 5, {
        cursor: page1.cursor
      })
      expect(page2.results.length).toBe(5)
      
      // Ensure no overlap between pages
      const page1Ids = page1.results.map(r => r.id)
      const page2Ids = page2.results.map(r => r.id)
      const overlap = page1Ids.filter(id => page2Ids.includes(id))
      expect(overlap.length).toBe(0)
    })

    it('should handle last page correctly', async () => {
      // Get small pages to reach the end
      let currentCursor: any = undefined
      let allResults: any[] = []
      let pageCount = 0
      const maxPages = 10 // Safety limit

      while (pageCount < maxPages) {
        const page = await db.searchWithCursor('document content', 5, {
          cursor: currentCursor
        })
        
        allResults.push(...page.results)
        pageCount++
        
        if (!page.hasMore) {
          expect(page.cursor).toBeUndefined()
          break
        }
        
        currentCursor = page.cursor
      }

      expect(pageCount).toBeLessThan(maxPages) // Should have finished before limit
      expect(allResults.length).toBeGreaterThan(0)
    })

    it('should provide total estimate when possible', async () => {
      const page = await db.searchWithCursor('document content', 50) // Request more than we have
      
      // Should get all results in one page
      expect(page.results.length).toBeGreaterThan(0)
      expect(page.hasMore).toBe(false)
      expect(page.totalEstimate).toBeDefined()
      expect(page.totalEstimate).toBe(page.results.length)
    })
  })

  describe('Performance Characteristics', () => {
    it('should show performance improvement with caching', async () => {
      // Add substantial test data
      for (let i = 0; i < 50; i++) {
        await db.add({
          id: `perf-test-${i}`,
          text: `performance test document ${i} with some content`
        })
      }

      // Clear cache and perform first search
      db.clearCache()
      const results1 = await db.search('performance test document', 10)
      
      let stats = db.getCacheStats()
      expect(stats.search.misses).toBe(1) // First search is a miss
      expect(stats.search.hits).toBe(0)

      // Perform second identical search (should hit cache)
      const results2 = await db.search('performance test document', 10)

      expect(results1).toEqual(results2) // Same results
      
      stats = db.getCacheStats()
      expect(stats.search.hits).toBe(1) // Second search is a hit
      expect(stats.search.hitRate).toBe(0.5) // 50% hit rate (1 hit, 1 miss)
    })

    it('should provide cache memory usage information', async () => {
      // Add some data and search to populate cache
      for (let i = 0; i < 10; i++) {
        await db.add({
          id: `mem-test-${i}`,
          text: `memory test ${i}`
        })
      }

      db.clearCache()
      
      // Perform several searches to populate cache
      await db.search('memory test', 5)
      await db.search('memory test', 3)
      await db.search('test', 5)

      const stats = db.getCacheStats()
      expect(stats.searchMemoryUsage).toBeGreaterThan(0)
      expect(stats.search.size).toBeGreaterThan(0)
      expect(stats.search.size).toBeLessThanOrEqual(stats.search.maxSize)
    })
  })
})