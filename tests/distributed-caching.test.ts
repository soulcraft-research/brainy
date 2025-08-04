/**
 * Tests for distributed caching behavior with shared storage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BrainyData } from '../src/brainyData.js'
import { cleanupWorkerPools } from '../src/utils/index.js'

describe('Distributed Caching', () => {
  let serviceA: BrainyData
  let serviceB: BrainyData

  beforeEach(async () => {
    // Mock the checkForUpdates to simulate real-time updates without waiting
    const mockCheckForUpdates = vi.fn()
    
    // Create two services sharing the same storage configuration
    const sharedConfig = {
      storage: {
        forceMemoryStorage: true // Use memory storage for testing
      },
      searchCache: {
        enabled: true,
        maxSize: 50,
        maxAge: 60000 // 1 minute
      },
      realtimeUpdates: {
        enabled: true,
        interval: 1000, // 1 second for testing
        updateIndex: true,
        updateStatistics: true
      },
      logging: {
        verbose: false
      }
    }

    serviceA = new BrainyData(sharedConfig)
    serviceB = new BrainyData(sharedConfig)
    
    await serviceA.init()
    await serviceB.init()
  })

  afterEach(async () => {
    await serviceA.clear()
    await serviceB.clear()
    await cleanupWorkerPools()
  })

  describe('Cache Invalidation on External Changes', () => {
    it('should invalidate cache when external data changes are detected', async () => {
      // Since we're using memory storage and separate instances for testing,
      // we'll simulate distributed behavior within a single service
      
      // Add initial data
      await serviceA.add({
        id: 'item-1',
        text: 'initial data from service A'
      })

      // Search and cache the result
      const results1 = await serviceA.search('initial data', 5)
      expect(results1.length).toBe(1)
      
      // Verify cache is populated
      let stats = serviceA.getCacheStats()
      expect(stats.search.size).toBe(1)

      // Add more data (simulates external changes)
      await serviceA.add({
        id: 'item-2',
        text: 'new data from service A'
      })

      // Cache should have been invalidated due to the add operation
      stats = serviceA.getCacheStats()
      expect(stats.search.size).toBe(0) // Cache cleared

      // Search again - should get fresh results including new data
      const results2 = await serviceA.search('data from service', 10)
      expect(results2.length).toBe(2) // Should now see both items

      stats = serviceA.getCacheStats()
      // Cache should be rebuilt with fresh data
      expect(stats.search.size).toBe(1) // New cache entry
    })

    it('should handle cache expiration gracefully', async () => {
      // Create a service with very short cache TTL
      const shortCacheService = new BrainyData({
        storage: { forceMemoryStorage: true },
        searchCache: {
          enabled: true,
          maxAge: 100 // 100ms - very short for testing
        },
        logging: { verbose: false }
      })
      await shortCacheService.init()

      // Add data and search
      await shortCacheService.add({
        id: 'item-1',
        text: 'short cache test'
      })

      const results1 = await shortCacheService.search('short cache', 5)
      expect(results1.length).toBe(1)

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      // Clean up expired entries
      const expiredCount = shortCacheService['searchCache'].cleanupExpiredEntries()
      expect(expiredCount).toBeGreaterThan(0)

      // Search again - should work fine with fresh data
      const results2 = await shortCacheService.search('short cache', 5)
      expect(results2.length).toBe(1)

      await shortCacheService.clear()
    })

    it('should provide cache statistics for monitoring', async () => {
      // Add test data
      for (let i = 0; i < 10; i++) {
        await serviceA.add({
          id: `item-${i}`,
          text: `test data ${i}`
        })
      }

      // Clear cache to start fresh
      serviceA.clearCache()

      // Perform searches to populate cache
      await serviceA.search('test data', 5) // Miss
      await serviceA.search('test data', 5) // Hit
      await serviceA.search('test data', 3) // Miss (different k)
      await serviceA.search('test data', 3) // Hit

      const stats = serviceA.getCacheStats()
      
      expect(stats.search.hits).toBe(2)
      expect(stats.search.misses).toBe(2)
      expect(stats.search.hitRate).toBe(0.5)
      expect(stats.search.size).toBe(2) // Two different cache entries
      expect(stats.searchMemoryUsage).toBeGreaterThan(0)
    })
  })

  describe('Real-time Update Integration', () => {
    it('should enable real-time updates for distributed scenarios', () => {
      const config = serviceA.getRealtimeUpdateConfig()
      expect(config.enabled).toBe(true)
      expect(config.updateIndex).toBe(true)
      expect(config.updateStatistics).toBe(true)
    })

    it('should handle skipCache option correctly', async () => {
      // Add test data
      await serviceA.add({
        id: 'item-1',
        text: 'skip cache test'
      })

      // Search with cache
      const results1 = await serviceA.search('skip cache', 5)
      expect(results1.length).toBe(1)

      // Verify cache is populated
      let stats = serviceA.getCacheStats()
      expect(stats.search.size).toBe(1)

      // Search with skipCache - should bypass cache
      const results2 = await serviceA.search('skip cache', 5, { skipCache: true })
      expect(results2.length).toBe(1)

      // Cache size shouldn't increase
      stats = serviceA.getCacheStats()
      expect(stats.search.size).toBe(1) // Still just one entry
    })
  })

  describe('Distributed Mode Best Practices', () => {
    it('should work with recommended distributed settings', async () => {
      const distributedService = new BrainyData({
        storage: { forceMemoryStorage: true },
        searchCache: {
          enabled: true,
          maxAge: 180000, // 3 minutes - shorter for distributed
          maxSize: 100
        },
        realtimeUpdates: {
          enabled: true,
          interval: 30000, // 30 seconds
          updateIndex: true,
          updateStatistics: true
        },
        logging: { verbose: false }
      })

      await distributedService.init()

      // Verify configuration
      const config = distributedService.getRealtimeUpdateConfig()
      expect(config.enabled).toBe(true)
      expect(config.interval).toBe(30000)

      const cacheStats = distributedService.getCacheStats()
      expect(cacheStats.search.enabled).toBe(true)

      await distributedService.clear()
    })

    it('should maintain performance with frequent external changes', async () => {
      // Simulate a scenario with frequent external changes
      const queries = ['query1', 'query2', 'query3', 'query4', 'query5']
      
      // Add initial data
      for (let i = 0; i < 20; i++) {
        await serviceA.add({
          id: `item-${i}`,
          text: `data for query${(i % 5) + 1} item ${i}`
        })
      }

      // Clear cache to start measurement
      serviceA.clearCache()

      // Perform multiple searches (some will be cache hits)
      for (const query of queries) {
        await serviceA.search(query, 5) // First search - cache miss
        await serviceA.search(query, 5) // Second search - cache hit
      }

      const stats = serviceA.getCacheStats()
      
      // Should have good hit rate despite distributed scenario
      expect(stats.search.hitRate).toBeGreaterThan(0.4) // At least 40%
      expect(stats.search.hits).toBeGreaterThan(0)
      expect(stats.search.size).toBe(queries.length)
    })
  })
})